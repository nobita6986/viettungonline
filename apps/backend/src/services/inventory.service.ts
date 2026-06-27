import { PrismaClient, Prisma, OrderStatus, OrderType, ProductType } from '@prisma/client';
import { BaseService } from './base.service';
import { generateOrderCode } from '@/lib/formatters';
import { Decimal } from 'decimal.js';
import { DomainError, InsufficientStockError } from '@/domain/errors';

export interface ImportStockItem {
  productId: string;
  qty: number;
  unitName: string;
  buyPrice: number;
}

export interface ImportStockInput {
  supplierId?: string;
  items: ImportStockItem[];
  note?: string;
  userId?: string;
}

export interface AdjustStockInput {
  productId: string;
  changeQty: number; // can be negative or positive
  reason: 'Hàng lỗi' | 'Mất mát' | 'Kiểm kê thừa' | string;
  note: string;
  userId?: string;
}

export class InventoryService extends BaseService {

  /**
   * Tính tồn kho khả dụng của 1 Combo dựa trên tồn kho các thành phần cấu tạo
   */
  async calculateComboStock(comboId: string): Promise<number> {
    const combo = await this.prisma.product.findUnique({
      where: { id: comboId },
      include: {
        comboItems: {
          include: { component: true },
        },
      },
    });

    if (!combo || combo.type !== ProductType.COMBO || combo.comboItems.length === 0) {
      return 0;
    }

    if (combo.comboItems.length === 0) {
      return 0;
    }

    let maxComboAvailable: number = Infinity;

    for (const item of combo.comboItems) {
      const requiredQty = item.quantity;
      if (requiredQty <= 0) continue; // Ngăn chặn lỗi chia cho 0 hoặc data rác

      const componentStock = item.component.stockQty;
      const possibleCombos = Math.floor(componentStock / requiredQty);

      if (possibleCombos < maxComboAvailable) {
        maxComboAvailable = possibleCombos;
      }
    }

    if (maxComboAvailable === Infinity) {
      return 0;
    }

    return Math.floor(maxComboAvailable);
  }

  /**
   * Tính tồn kho khả dụng cho hàng loạt Combo (Khắc phục lỗi N+1 Query)
   */
  async calculateBulkComboStock(comboIds: string[]): Promise<Record<string, number>> {
    if (comboIds.length === 0) return {};

    const combos = await this.prisma.product.findMany({
      where: {
        id: { in: comboIds },
        type: ProductType.COMBO,
      },
      include: {
        comboItems: {
          include: { component: true },
        },
      },
    });

    const result: Record<string, number> = {};

    for (const combo of combos) {
      if (combo.comboItems.length === 0) {
        result[combo.id] = 0;
        continue;
      }

      let maxComboAvailable: number | null = null;
      for (const item of combo.comboItems) {
        if (item.quantity <= 0) continue;

        const possibleCombos = Math.floor(item.component.stockQty / item.quantity);
        if (maxComboAvailable === null || possibleCombos < maxComboAvailable) {
          maxComboAvailable = possibleCombos;
        }
      }
      result[combo.id] = maxComboAvailable === null ? 0 : Math.floor(maxComboAvailable);
    }

    return result;
  }

  /**
   * 1. Import stock (Create PURCHASE Order and update inventory directly)
   */
  async importStock(data: ImportStockInput) {
    return this.withTransaction(async (tx) => {
      const currentYear = this.getCurrentYear();
      // Dùng timestamp + random string để sinh mã tránh bị trùng lắp khi có nhiều request cùng lúc (Fix Race Condition)
      const uniqueSuffix = Date.now().toString().slice(-5) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const orderCode = `NK${currentYear}-${uniqueSuffix}`;

      let totalAmount = new Decimal(0);
      
      const order = await tx.order.create({
        data: {
          orderCode,
          type: OrderType.PURCHASE,
          status: OrderStatus.RECEIVED,
          supplierId: data.supplierId,
          notes: data.note,
          userId: data.userId,
        }
      });

      for (const item of data.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: { units: true }
        });

        if (!product) throw new DomainError('PRODUCT_NOT_FOUND', `Product ${item.productId} not found`);

        let conversionRatio = 1;
        if (item.unitName && item.unitName !== product.baseUnit) {
          const unit = product.units.find(u => u.unitName === item.unitName);
          if (!unit) {
            throw new DomainError('INVALID_UNIT', `Invalid unit ${item.unitName} for product ${product.name}`);
          }
          conversionRatio = unit.conversionRatio;
        }

        const actualQtyToAdd = item.qty * conversionRatio;
        const buyTotal = new Decimal(item.qty).times(item.buyPrice);
        totalAmount = totalAmount.plus(buyTotal);

        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: product.id,
            productName: product.name,
            unit: item.unitName,
            qty: item.qty,
            buyPrice: new Decimal(item.buyPrice),
            buyTotal: buyTotal,
            sellPrice: new Decimal(0),
            sellTotal: new Decimal(0),
            profit: new Decimal(0)
          }
        });

        await tx.product.update({
          where: { id: product.id },
          data: {
            stockQty: { increment: actualQtyToAdd },
            buyPrice: new Decimal(item.buyPrice)
          }
        });

        await tx.inventoryLog.create({
          data: {
            productId: product.id,
            changeQty: actualQtyToAdd,
            reason: 'RESTOCK',
            note: data.note || `Nhập kho từ đơn ${orderCode}`,
            userId: data.userId,
            orderId: order.id
          }
        });
      }

      await tx.order.update({
        where: { id: order.id },
        data: { totalAmount }
      });

      return order;
    });
  }

  /**
   * 2. Adjust Stock (Manual adjustment, e.g. damaged goods, loss)
   */
  async adjustStock(data: AdjustStockInput) {
    return this.withTransaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: data.productId }
      });

      if (!product) throw new DomainError('PRODUCT_NOT_FOUND', 'Product not found');

      if (data.changeQty < 0) {
        const newStock = product.stockQty + data.changeQty;
        if (newStock < 0) {
          throw new InsufficientStockError(product.name, Math.abs(data.changeQty), product.stockQty);
        }
      }

      const logReason = data.changeQty < 0 && data.reason === 'Hàng lỗi' 
        ? 'DAMAGED_GOODS' 
        : data.reason;

      const updatedProduct = await tx.product.update({
        where: { id: data.productId },
        data: {
          stockQty: { increment: data.changeQty }
        }
      });

      await tx.inventoryLog.create({
        data: {
          productId: product.id,
          changeQty: data.changeQty,
          reason: logReason,
          note: data.note,
          userId: data.userId
        }
      });

      return updatedProduct;
    });
  }

  /**
   * 3. Get Inventory History for a product
   */
  async getInventoryHistory(productId: string) {
    return this.prisma.inventoryLog.findMany({
      where: { productId },
      include: {
        user: { select: { name: true } },
        order: { select: { orderCode: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
