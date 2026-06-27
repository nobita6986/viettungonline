import { Prisma, OrderStatus, PurchaseStatus, SaleStatus } from '@prisma/client';
import { BaseService } from './base.service';
import { Decimal } from 'decimal.js';
import { DecimalUtils } from '@/lib/decimal-utils';
import { generateOrderCode } from '@/lib/formatters';
import { parseDateSafe } from '@/lib/date-utils';
import { OrderNotFoundError, DomainError } from '@/domain/errors';

export interface CreateOrderInput {
  // Product info
  productName: string;
  unit?: string;
  qty?: number;

  purchaseUnit?: string;
  purchaseQty?: number;
  saleUnit?: string;
  saleQty?: number;

  // Purchase info
  supplierId?: string;
  purchaseDate?: Date | string;
  purchasePrice: number;
  purchaseStatus?: PurchaseStatus;
  receivedDate?: Date | string;

  // Sale info
  customerId?: string;
  saleDate?: Date | string;
  salePrice: number;
  saleStatus?: SaleStatus;
  expectedDate?: Date | string;
  deliveredDate?: Date | string;

  notes?: string;
}

export interface UpdateOrderInput {
  status?: OrderStatus;
  productName?: string;
  unit?: string;
  qty?: number;

  purchaseUnit?: string;
  purchaseQty?: number;
  saleUnit?: string;
  saleQty?: number;

  supplierId?: string;
  purchaseDate?: Date | string;
  purchasePrice?: number;
  purchaseStatus?: PurchaseStatus;
  receivedDate?: Date | string;

  customerId?: string;
  saleDate?: Date | string;
  salePrice?: number;
  saleStatus?: SaleStatus;
  expectedDate?: Date | string;
  deliveredDate?: Date | string;

  notes?: string;
}

export interface OrderFilter {
  status?: OrderStatus;
  customerId?: string;
  supplierId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export class OrderService extends BaseService {
  /**
   * Get next order sequence number for current year
   */
  private async getNextOrderSequence(year: number): Promise<number> {
    const result = await this.prisma.$transaction(async (tx) => {
      const lastOrder = await tx.order.findFirst({
        where: { orderCode: { startsWith: `ORD-${year}-` } },
        orderBy: { orderCode: 'desc' },
        select: { orderCode: true }
      });
      
      if (!lastOrder) return 1;
      const lastSeq = parseInt(lastOrder.orderCode.split('-')[2], 10);
      return lastSeq + 1;
    }, {
      isolationLevel: 'Serializable'
    });
    return result;
  }

  /**
   * Get all orders with filtering and pagination
   */
  async getOrders(filter: OrderFilter = {}, page = 1, limit = 50, sortBy?: string, sortOrder: 'asc' | 'desc' = 'desc') {
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {};

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.customerId) {
      where.customerId = filter.customerId;
    }

    if (filter.supplierId) {
      where.supplierId = filter.supplierId;
    }

    if (filter.startDate || filter.endDate) {
      where.OR = [];
      if (filter.startDate) {
        where.OR.push({ purchaseDate: { gte: filter.startDate } });
        where.OR.push({ saleDate: { gte: filter.startDate } });
      }
      if (filter.endDate) {
        where.OR.push({ purchaseDate: { lte: filter.endDate } });
        where.OR.push({ saleDate: { lte: filter.endDate } });
      }
    }

    if (filter.search) {
      where.OR = where.OR || [];
      where.OR.push({
        orderCode: { contains: filter.search, mode: 'insensitive' },
      });
    }

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          supplier: { select: { id: true, name: true, phone: true } },
          items: {
            take: 1, // Dùng để hiển thị tên sản phẩm đại diện (Preview)
            select: { productName: true, qty: true, unit: true }
          },
        },
        orderBy: sortBy
          ? (sortBy === 'customer' ? { customer: { name: sortOrder } } : sortBy === 'supplier' ? { supplier: { name: sortOrder } } : { [sortBy]: sortOrder })
          : { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get order by ID
   */
  async getOrderById(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        supplier: true,
        items: true,
        orderTransactions: { include: { transaction: true } },
      },
    });
  }

  /**
   * Create a new order
   */
  async createOrder(data: CreateOrderInput) {
    const currentYear = this.getCurrentYear();
    const sequence = await this.getNextOrderSequence(currentYear);
    const orderCode = generateOrderCode(currentYear, sequence);

    const pQty = data.purchaseQty ?? data.qty ?? 1;
    const sQty = data.saleQty ?? data.qty ?? 1;
    const pUnit = data.purchaseUnit ?? data.unit ?? 'cái';
    const sUnit = data.saleUnit ?? data.unit ?? 'cái';

    // In legacy schema, purchasePrice and salePrice are TOTAL PRICES
    const buyTotal = DecimalUtils.toDecimal(data.purchasePrice);
    const sellTotal = DecimalUtils.toDecimal(data.salePrice);
    
    const { ProfitCalculator } = await import('../domain/pricing/ProfitCalculator');
    const profit = ProfitCalculator.calculateOrderProfit(data.purchasePrice, data.salePrice);

    const parseDate = (d: Date | string | undefined) => {
      if (!d) return null;
      if (d instanceof Date) return d;
      return parseDateSafe(d) || null;
    };

    return this.withTransaction(async (tx) => {
      // Create order
      const order = await tx.order.create({
        data: {
          orderCode,
          status: OrderStatus.PENDING,
          purchaseDate: parseDateSafe(data.purchaseDate),
          purchaseQty: pQty,
          purchaseUnit: pUnit,
          purchasePrice: buyTotal,
          purchaseStatus: data.purchaseStatus || PurchaseStatus.PENDING,
          receivedDate: parseDateSafe(data.receivedDate),
          saleDate: parseDateSafe(data.saleDate),
          saleQty: sQty,
          saleUnit: sUnit,
          salePrice: sellTotal,
          saleStatus: data.saleStatus || SaleStatus.PENDING,
          expectedDate: parseDateSafe(data.expectedDate),
          deliveredDate: parseDateSafe(data.deliveredDate),
          profit,
          notes: data.notes,
          supplierId: data.supplierId,
          customerId: data.customerId,
        },
      });

      // Find product to link and update buyPrice
      let product = await tx.product.findFirst({
        where: { name: data.productName }
      });

      // Update product's buyPrice (unit price) if it exists
      if (product) {
        const productUnitBuyPrice = DecimalUtils.divideIfPositive(data.purchasePrice, pQty);
        await tx.product.update({
          where: { id: product.id },
          data: { buyPrice: productUnitBuyPrice }
        });
      }

      const unitBuyPrice = DecimalUtils.divideIfPositive(data.purchasePrice, pQty);
      const unitSellPrice = DecimalUtils.divideIfPositive(data.salePrice, sQty);

      // Create order item (legacy support, uses pQty and pUnit as base)
      await tx.orderItem.create({
        data: {
          orderId: order.id,
          productId: product ? product.id : null,
          productName: data.productName,
          unit: pUnit,
          qty: pQty,
          buyPrice: unitBuyPrice,
          buyTotal,
          sellPrice: unitSellPrice,
          sellTotal,
          profit,
        },
      });

      return this.getOrderById(order.id);
    });
  }

  /**
   * Update an order
   */
  async updateOrder(id: string, data: UpdateOrderInput) {
    const existing = await this.prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!existing) return null;

    const parseDate = (d: Date | string | undefined) => {
      if (!d) return null;
      if (d instanceof Date) return d;
      return parseDateSafe(d) || null;
    };

    // Recalculate profit if prices changed
    let profit = existing.profit;
    if (data.purchasePrice !== undefined || data.salePrice !== undefined) {
      const buyTotal = data.purchasePrice ?? DecimalUtils.toNumber(existing.purchasePrice);
      const sellTotal = data.salePrice ?? DecimalUtils.toNumber(existing.salePrice);
      const { ProfitCalculator } = await import('../domain/pricing/ProfitCalculator');
      profit = DecimalUtils.toDecimal(ProfitCalculator.calculateOrderProfit(buyTotal, sellTotal));
    }

    const updateData: Prisma.OrderUncheckedUpdateInput = {};

    if (data.status !== undefined) updateData.status = data.status;
    if (data.supplierId !== undefined) updateData.supplierId = data.supplierId;
    if (data.customerId !== undefined) updateData.customerId = data.customerId;
    if (data.purchaseDate !== undefined) updateData.purchaseDate = parseDateSafe(data.purchaseDate);
    if (data.purchasePrice !== undefined) updateData.purchasePrice = DecimalUtils.toDecimal(data.purchasePrice);
    if (data.purchaseStatus !== undefined) updateData.purchaseStatus = data.purchaseStatus;
    if (data.receivedDate !== undefined) updateData.receivedDate = parseDateSafe(data.receivedDate);
    if (data.purchaseQty !== undefined || data.qty !== undefined) updateData.purchaseQty = data.purchaseQty ?? data.qty;
    if (data.purchaseUnit !== undefined || data.unit !== undefined) updateData.purchaseUnit = data.purchaseUnit ?? data.unit;

    if (data.saleDate !== undefined) updateData.saleDate = parseDateSafe(data.saleDate);
    if (data.salePrice !== undefined) updateData.salePrice = DecimalUtils.toDecimal(data.salePrice);
    if (data.saleStatus !== undefined) updateData.saleStatus = data.saleStatus;
    if (data.expectedDate !== undefined) updateData.expectedDate = parseDateSafe(data.expectedDate);
    if (data.deliveredDate !== undefined) updateData.deliveredDate = parseDateSafe(data.deliveredDate);
    if (data.saleQty !== undefined || data.qty !== undefined) updateData.saleQty = data.saleQty ?? data.qty;
    if (data.saleUnit !== undefined || data.unit !== undefined) updateData.saleUnit = data.saleUnit ?? data.unit;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (profit !== existing.profit) updateData.profit = profit;

    return this.withTransaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id },
        data: updateData,
        include: {
          customer: true,
          supplier: true,
          items: true,
        },
      });

      // Find the first order item since it's a 1-to-1 flat model currently
      const orderItem = await tx.orderItem.findFirst({ where: { orderId: id } });
      
      const qty = data.qty || existing.purchaseQty || 1;
      const buyPrice = data.purchasePrice ?? Number(existing.purchasePrice);
      const sellPrice = data.salePrice ?? Number(existing.salePrice);
      const buyTotal = DecimalUtils.multiply(qty, buyPrice);
      const sellTotal = DecimalUtils.multiply(qty, sellPrice);
      const currentProfit = DecimalUtils.subtract(sellTotal, buyTotal);

      if (orderItem) {
        await tx.orderItem.update({
          where: { id: orderItem.id },
          data: {
            productName: data.productName || orderItem.productName,
            unit: data.unit || orderItem.unit,
            qty,
            buyPrice: DecimalUtils.toDecimal(buyPrice),
            buyTotal,
            sellPrice: DecimalUtils.toDecimal(sellPrice),
            sellTotal,
            profit: currentProfit,
          }
        });
      }

      // Update product's buyPrice in the inventory
      const productName = data.productName || existing.items?.[0]?.productName;
      if (productName && data.purchasePrice !== undefined) {
        const product = await tx.product.findFirst({
          where: { name: productName }
        });

        if (product) {
          await tx.product.update({
            where: { id: product.id },
            data: { buyPrice: DecimalUtils.toDecimal(data.purchasePrice) }
          });
          
          if (orderItem) {
            await tx.orderItem.update({
              where: { id: orderItem.id },
              data: { productId: product.id }
            });
          }
        }
      }

      return this.getOrderById(id);
    });
  }

  /**
   * Delete an order (Soft Delete)
   */
  async deleteOrder(id: string, userId: string) {
    return this.withTransaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!order) throw new OrderNotFoundError(id);
      if (order.status === OrderStatus.CANCELLED) {
        throw new DomainError('ORDER_ALREADY_CANCELLED', 'Đơn hàng đã bị hủy hoặc xóa trước đó');
      }

      const previousStatus = order.status;

      // Bước 4: Soft delete bằng cách chuyển sang CANCELLED
      const updatedOrder = await tx.order.update({
        where: { id },
        data: { status: OrderStatus.CANCELLED },
      });

      // Bước 3: Ghi log
      await tx.orderHistory.create({
        data: {
          orderId: id,
          statusFrom: previousStatus,
          statusTo: OrderStatus.CANCELLED,
          userId,
          note: 'Người dùng xóa đơn hàng (Soft Delete)',
        },
      });

      // Bước 1: Hoàn trả kho nếu đơn hàng đã từng xuất kho
      if (previousStatus === OrderStatus.SHIPPED || previousStatus === OrderStatus.DELIVERED) {
        const { StockService } = await import('../domain/inventory/StockService');
        const stockService = new StockService(this.prisma as any);
        await stockService.restockOrder(id, userId, tx);
      }

      // Bước 2: Xóa/hủy các Phiếu thu/chi (Transaction) liên kết với orderId thông qua bảng trung gian
      await tx.transaction.deleteMany({
        where: { orderTransactions: { some: { orderId: id } } }
      });

      return updatedOrder;
    });
  }

  /**
   * Get order statistics
   */
  async getOrderStats(startDate?: Date, endDate?: Date) {
    const where: Prisma.OrderWhereInput = {};

    if (startDate || endDate) {
      where.saleDate = {};
      if (startDate) where.saleDate.gte = startDate;
      if (endDate) where.saleDate.lte = endDate;
    }

    const [total, completed, pending, cancelled] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.count({ where: { ...where, status: OrderStatus.COMPLETED } }),
      this.prisma.order.count({ where: { ...where, status: OrderStatus.PENDING } }),
      this.prisma.order.count({ where: { ...where, status: OrderStatus.CANCELLED } }),
    ]);

    const agg = await this.prisma.order.aggregate({
      where,
      _sum: {
        profit: true,
        purchasePrice: true,
        salePrice: true,
      },
    });

    const totalPurchase = DecimalUtils.toDecimal(agg._sum.purchasePrice || 0);
    const totalSale = DecimalUtils.toDecimal(agg._sum.salePrice || 0);
    const totalProfit = DecimalUtils.toDecimal(agg._sum.profit || 0);

    return {
      total,
      completed,
      pending,
      cancelled,
      totalPurchase,
      totalSale,
      totalProfit,
    };
  }

  /**
   * Chuyển trạng thái đơn hàng sang SHIPPED và trừ kho
   */
  async processOrderShipped(orderId: string, userId: string) {
    const { StockService } = await import('../domain/inventory/StockService');
    const { OrderNotFoundError, DomainError } = await import('../domain/errors/AppErrors');
    const stockService = new StockService(this.prisma as any);

    return this.withTransaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order) throw new OrderNotFoundError(orderId);
      if (order.status === OrderStatus.SHIPPED || order.status === OrderStatus.DELIVERED) {
        throw new DomainError('INVALID_ORDER_STATUS', 'Đơn hàng đã được xuất kho');
      }

      // Đổi trạng thái
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.SHIPPED },
      });

      // Lưu lịch sử
      await tx.orderHistory.create({
        data: {
          orderId,
          statusFrom: order.status,
          statusTo: OrderStatus.SHIPPED,
          userId,
          note: 'Xuất kho giao hàng',
        },
      });

      // Trừ kho đệ quy qua StockService
      await stockService.deductStockForOrder(orderId, userId, tx);

      return updatedOrder;
    });
  }

  /**
   * Hủy đơn hàng và hoàn trả kho
   */
  async cancelOrder(orderId: string, userId: string) {
    const { StockService } = await import('../domain/inventory/StockService');
    const { OrderNotFoundError, DomainError } = await import('../domain/errors/AppErrors');
    const stockService = new StockService(this.prisma as any);

    return this.withTransaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order) throw new OrderNotFoundError(orderId);
      if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.RETURNED) {
        throw new DomainError('INVALID_ORDER_STATUS', 'Đơn hàng đã bị hủy/hoàn trả trước đó');
      }

      const previousStatus = order.status;

      // Đổi trạng thái
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
      });

      // Lưu lịch sử
      await tx.orderHistory.create({
        data: {
          orderId,
          statusFrom: previousStatus,
          statusTo: OrderStatus.CANCELLED,
          userId,
          note: 'Hủy đơn hàng',
        },
      });

      // Chỉ hoàn kho nếu đơn hàng đã từng trừ kho
      if (previousStatus === OrderStatus.SHIPPED || previousStatus === OrderStatus.DELIVERED) {
        await stockService.restockOrder(orderId, userId, tx);
      }

      return updatedOrder;
    });
  }

}
