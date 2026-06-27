// src/domain/inventory/StockService.ts
import { PrismaClient, Prisma } from '@prisma/client';
import { InsufficientStockError, ComponentNotFoundError } from '../errors/AppErrors';

export class StockService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Trừ kho cho một đơn hàng (Deduct Stock)
   */
  async deductStockForOrder(orderId: string, userId: string, tx: Prisma.TransactionClient) {
    const orderItems = await tx.orderItem.findMany({
      where: { orderId },
      include: {
        product: {
          include: { comboItems: true },
        },
      },
    });

    for (const item of orderItems) {
      const product = item.product;
      if (!product) continue;

      if (product.type === 'STANDARD') {
        await this.deductStandardProductStock(product, item, orderId, userId, tx);
      } else if (product.type === 'COMBO') {
        await this.deductComboProductStock(product, item, orderId, userId, tx);
      }
    }
  }

  /**
   * Hoàn lại kho cho một đơn hàng (Restock)
   */
  async restockOrder(orderId: string, userId: string, tx: Prisma.TransactionClient) {
    const orderItems = await tx.orderItem.findMany({
      where: { orderId },
      include: {
        product: {
          include: { comboItems: true },
        },
      },
    });

    for (const item of orderItems) {
      const product = item.product;
      if (!product) continue;

      if (product.type === 'STANDARD') {
        await this.restockStandardProduct(product, item, orderId, userId, tx);
      } else if (product.type === 'COMBO') {
        await this.restockComboProduct(product, item, orderId, userId, tx);
      }
    }
  }

  private async deductStandardProductStock(product: any, item: any, orderId: string, userId: string, tx: Prisma.TransactionClient) {
    if (product.stockQty < item.qty) {
      throw new InsufficientStockError(product.name, item.qty, product.stockQty);
    }

    await tx.product.update({
      where: { id: product.id },
      data: { stockQty: { decrement: item.qty } },
    });

    await tx.inventoryLog.create({
      data: {
        productId: product.id,
        changeQty: -item.qty,
        reason: 'ORDER_FULFILL',
        orderId,
        userId,
      },
    });
  }

  private async deductComboProductStock(product: any, item: any, orderId: string, userId: string, tx: Prisma.TransactionClient) {
    for (const componentLink of product.comboItems) {
      const totalComponentQtyToDeduct = componentLink.quantity * item.qty;

      const componentProduct = await tx.product.findUnique({
        where: { id: componentLink.componentId },
      });

      if (!componentProduct) {
        console.warn(`[WARNING] Không tìm thấy Component ${componentLink.componentId} cho Combo ${product.name}`);
        throw new ComponentNotFoundError(componentLink.componentId, product.name);
      }

      if (componentProduct.stockQty < totalComponentQtyToDeduct) {
        throw new InsufficientStockError(componentProduct.name, totalComponentQtyToDeduct, componentProduct.stockQty);
      }

      await tx.product.update({
        where: { id: componentProduct.id },
        data: { stockQty: { decrement: totalComponentQtyToDeduct } },
      });

      await tx.inventoryLog.create({
        data: {
          productId: componentProduct.id,
          changeQty: -totalComponentQtyToDeduct,
          reason: 'ORDER_FULFILL_COMBO',
          note: `Trừ ${totalComponentQtyToDeduct} cho Combo ${product.name} (SL: ${item.qty})`,
          orderId,
          userId,
        },
      });
    }
  }

  private async restockStandardProduct(product: any, item: any, orderId: string, userId: string, tx: Prisma.TransactionClient) {
    await tx.product.update({
      where: { id: product.id },
      data: { stockQty: { increment: item.qty } },
    });

    await tx.inventoryLog.create({
      data: {
        productId: product.id,
        changeQty: item.qty,
        reason: 'ORDER_CANCEL',
        orderId,
        userId,
      },
    });
  }

  private async restockComboProduct(product: any, item: any, orderId: string, userId: string, tx: Prisma.TransactionClient) {
    for (const componentLink of product.comboItems) {
      const totalComponentQtyToRestock = componentLink.quantity * item.qty;

      await tx.product.update({
        where: { id: componentLink.componentId },
        data: { stockQty: { increment: totalComponentQtyToRestock } },
      });

      await tx.inventoryLog.create({
        data: {
          productId: componentLink.componentId,
          changeQty: totalComponentQtyToRestock,
          reason: 'ORDER_CANCEL_COMBO',
          note: `Hoàn ${totalComponentQtyToRestock} từ Combo ${product.name}`,
          orderId,
          userId,
        },
      });
    }
  }
}
