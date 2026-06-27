import { PrismaClient, Prisma, OrderStatus } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { DecimalUtils } from '@/lib/decimal-utils';
import { AppError } from '../errors/AppErrors';
import { StockService } from './StockService';

export interface CreateSalesReturnItem {
  orderItemId: string;
  qtyReturned: number;
  condition: 'SALEABLE' | 'DAMAGED';
  refundAmount: number | Decimal;
  note?: string;
}

export interface CreateSalesReturnInput {
  orderId: string;
  userId: string;
  items: CreateSalesReturnItem[];
  reason?: string;
}

export class SalesReturnService {
  private prisma: PrismaClient;
  private stockService: StockService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.stockService = new StockService(prisma as any);
  }

  /**
   * Khởi tạo phiếu hoàn trả hàng (Chưa Duyệt)
   */
  async createReturn(data: CreateSalesReturnInput) {
    const order = await this.prisma.order.findUnique({
      where: { id: data.orderId },
      include: { items: true },
    });

    if (!order) {
      throw new AppError('OrderNotFoundError', 'Không tìm thấy đơn hàng cần hoàn trả');
    }

    if (order.status !== OrderStatus.SHIPPED && order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.COMPLETED) {
      throw new AppError('InvalidOrderStateError', 'Chỉ có thể hoàn trả với đơn hàng đã giao (SHIPPED/DELIVERED/COMPLETED)');
    }

    // Validate quantities
    for (const item of data.items) {
      const orderItem = order.items.find(i => i.id === item.orderItemId);
      if (!orderItem) {
        throw new AppError('InvalidDataError', `Không tìm thấy sản phẩm (ID: ${item.orderItemId}) trong đơn hàng`);
      }
      if (item.qtyReturned > orderItem.qty) {
        throw new AppError('InvalidDataError', `Số lượng hoàn trả (${item.qtyReturned}) không được lớn hơn số lượng đã bán (${orderItem.qty})`);
      }
    }

    const totalRefund = data.items.reduce((sum, item) => DecimalUtils.add(sum, item.refundAmount), new Decimal(0));

    return this.prisma.$transaction(async (tx) => {
      const salesReturn = await tx.salesReturn.create({
        data: {
          orderId: data.orderId,
          userId: data.userId,
          reason: data.reason,
          status: 'PENDING',
          totalRefund: DecimalUtils.toDecimal(totalRefund),
          items: {
            create: data.items.map(i => ({
              orderItemId: i.orderItemId,
              qtyReturned: i.qtyReturned,
              condition: i.condition,
              refundAmount: DecimalUtils.toDecimal(i.refundAmount),
              note: i.note,
            })),
          },
        },
        include: { items: true }
      });

      // Lưu log lịch sử
      await tx.orderHistory.create({
        data: {
          orderId: data.orderId,
          statusFrom: order.status,
          statusTo: OrderStatus.RETURNED,
          userId: data.userId,
          note: `Khách hàng yêu cầu hoàn trả (Mã Phiếu: ${salesReturn.id})`,
        }
      });

      return salesReturn;
    });
  }

  /**
   * Duyệt phiếu hoàn trả và tự động hoàn kho / ghi nhận dòng tiền
   */
  async approveReturn(returnId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const salesReturn = await tx.salesReturn.findUnique({
        where: { id: returnId },
        include: { items: { include: { orderItem: true } }, order: true }
      });

      if (!salesReturn) throw new AppError('InvalidDataError', 'Không tìm thấy phiếu hoàn trả');
      if (salesReturn.status === 'APPROVED') throw new AppError('InvalidStateError', 'Phiếu hoàn trả đã được duyệt trước đó');

      // 1. Cập nhật trạng thái phiếu
      await tx.salesReturn.update({
        where: { id: returnId },
        data: { status: 'APPROVED', updatedAt: new Date() }
      });

      // 2. Cập nhật đơn hàng (Cấn trừ doanh thu, thay đổi trạng thái sang RETURNED)
      const newTotalAmount = DecimalUtils.subtract(salesReturn.order.totalAmount, salesReturn.totalRefund);
      
      await tx.order.update({
        where: { id: salesReturn.orderId },
        data: { 
          status: OrderStatus.RETURNED,
          totalAmount: newTotalAmount
        }
      });

      // 3. Xử lý tồn kho
      for (const item of salesReturn.items) {
        if (!item.orderItem.productId) continue;
        
        // Nếu hàng còn khả năng bán (SALEABLE) => Nhập lại kho (Cộng)
        // Nếu hàng hỏng (DAMAGED) => Không nhập lại kho chính, nhưng vẫn cần ghi log InventoryLog
        const conditionText = item.condition === 'SALEABLE' ? 'Nguyên vẹn' : 'Hư hỏng';

        if (item.condition === 'SALEABLE') {
          await tx.product.update({
            where: { id: item.orderItem.productId },
            data: { stockQty: { increment: item.qtyReturned } }
          });
        }

        await tx.inventoryLog.create({
          data: {
            productId: item.orderItem.productId,
            changeQty: item.condition === 'SALEABLE' ? item.qtyReturned : 0,
            reason: 'SALES_RETURN',
            note: `Khách hoàn trả (Tình trạng: ${conditionText}, SL: ${item.qtyReturned})`,
            orderId: salesReturn.orderId,
            userId: userId
          }
        });
      }

      // 4. Tạo bút toán chi tiền (Hoàn tiền cho khách)
      if (DecimalUtils.toNumber(salesReturn.totalRefund) > 0) {
        // Tìm categoryId phù hợp cho hoàn tiền khách (Expense)
        const category = await tx.transactionCategory.findFirst({
          where: { type: 'EXPENSE', isActive: true } // Lý tưởng nhất là có category riêng
        });

        await tx.transaction.create({
          data: {
            type: 'EXPENSE',
            amount: salesReturn.totalRefund,
            description: `Hoàn tiền khách hàng trả lại đơn ${salesReturn.order.orderCode}`,
            orderTransactions: { create: { orderId: salesReturn.orderId, appliedAmount: salesReturn.totalRefund } },
            customerId: salesReturn.order.customerId,
            createdBy: userId,
            categoryId: category?.id,
            cashFlowGroup: 'OPERATIONAL'
          }
        });
      }

      return salesReturn;
    });
  }
}
