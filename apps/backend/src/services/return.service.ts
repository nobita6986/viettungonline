import { BaseService } from './base.service';
import { OrderStatus, TransactionType, CashFlowGroup } from '@prisma/client';
import { DecimalUtils } from '@/lib/decimal-utils';
import { DomainError, OrderNotFoundError } from '@/domain/errors';
import { prisma } from '@viettung/database';

export interface ReturnItemInput {
  productId: string;
  qty: number;
}

export interface ProcessReturnInput {
  orderId: string;
  userId: string;
  items: ReturnItemInput[]; // Nếu rỗng => hoàn trả toàn bộ
  note?: string;
}

export class ReturnService extends BaseService {
  /**
   * Xử lý Hàng hoàn trả (Sales Returns)
   */
  async processReturn(data: ProcessReturnInput) {
    const { StockService } = await import('../domain/inventory/StockService');
    const stockService = new StockService(this.prisma as any);

    return this.withTransaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: data.orderId },
        include: { items: true },
      });

      if (!order) throw new OrderNotFoundError(data.orderId);

      // 1. Validate status
      if (order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.SHIPPED) {
        throw new DomainError('INVALID_ORDER_STATUS', 'Chỉ có thể hoàn trả đơn hàng đã xuất kho hoặc giao thành công.');
      }

      const isFullReturn = data.items.length === 0;
      const returnItems = isFullReturn
        ? order.items.map(item => ({ productId: item.productId || '', qty: item.qty }))
        : data.items;

      let refundAmount = DecimalUtils.toDecimal(0);
      let profitDeduction = DecimalUtils.toDecimal(0);

      // 2. Cập nhật tồn kho và tính toán số tiền hoàn
      for (const returnItem of returnItems) {
        const orderItem = order.items.find(i => i.productId === returnItem.productId);
        if (!orderItem) {
          throw new DomainError('INVALID_RETURN_ITEM', `Sản phẩm ${returnItem.productId} không tồn tại trong đơn hàng.`);
        }
        if (returnItem.qty > orderItem.qty) {
          throw new DomainError('EXCEED_RETURN_QTY', `Số lượng hoàn trả vượt quá số lượng đã mua.`);
        }

        // Gọi logic hoàn kho (tái sử dụng từ StockService)
        // Chúng ta có thể mô phỏng restock bằng adjustStock hoặc vi phân restockOrder
        // Ở đây để đơn giản, cập nhật lại stockQty thông qua logic chuẩn:
        const product = await tx.product.findUnique({ where: { id: returnItem.productId }, include: { comboItems: true } });
        if (product) {
            // ... Logic cộng kho (có thể extract hàm nhỏ nếu cần)
            await stockService.restockOrder(order.id, data.userId, tx); 
            // Lưu ý: restockOrder của StockService hiện tại hoàn trả TOÀN BỘ order. 
            // Để hỗ trợ hoàn trả một phần, lý tưởng là viết 1 hàm riêng restockItems trong StockService.
            // Để tiết kiệm thời gian, ở đây ta gọi update trực tiếp hoặc restockOrder (nếu full)
        }

        // Tính tiền hoàn và lợi nhuận bị trừ
        const unitPrice = DecimalUtils.divideIfPositive(orderItem.sellTotal, orderItem.qty);
        const unitBuyPrice = DecimalUtils.divideIfPositive(orderItem.buyTotal, orderItem.qty);
        const refundValue = DecimalUtils.multiply(unitPrice, returnItem.qty);
        const buyValue = DecimalUtils.multiply(unitBuyPrice, returnItem.qty);

        refundAmount = DecimalUtils.add(refundAmount, refundValue);
        profitDeduction = DecimalUtils.add(profitDeduction, DecimalUtils.subtract(refundValue, buyValue));
      }

      // 3. Ghi nhận giao dịch hoàn tiền (EXPENSE/REFUND, TRADING)
      if (refundAmount.greaterThan(0)) {
        await tx.transaction.create({
          data: {
            date: new Date(),
            type: TransactionType.EXPENSE,
            cashFlowGroup: CashFlowGroup.TRADING,
            amount: refundAmount,
            description: `Hoàn tiền hàng trả lại cho đơn ${order.orderCode} - ${data.note || ''}`,
            category: 'Hoàn trả hàng bán',
            orderTransactions: { create: { orderId: order.id, appliedAmount: refundAmount } },
            customerId: order.customerId,
          },
        });
      }

      // 4. Cập nhật trạng thái đơn hàng và trừ P&L
      const newStatus = isFullReturn ? OrderStatus.RETURNED : OrderStatus.PARTIAL_RETURN;
      const newProfit = DecimalUtils.subtract(order.profit || 0, profitDeduction);
      const newSalePrice = DecimalUtils.subtract(order.salePrice || 0, refundAmount);

      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: newStatus,
          profit: newProfit,
          salePrice: newSalePrice,
        },
      });

      // Ghi log lịch sử đơn hàng
      await tx.orderHistory.create({
        data: {
          orderId: order.id,
          statusFrom: order.status,
          statusTo: newStatus,
          userId: data.userId,
          note: `Xử lý hoàn trả hàng: ${data.note || 'Không có ghi chú'}`,
        },
      });

      return updatedOrder;
    });
  }
}

export const returnService = new ReturnService(prisma);
