import { Injectable, BadRequestException } from '@nestjs/common';
import { prisma } from '@viettung/database';

@Injectable()
export class TransactionService {
  async reconcileTransactionsWithOrders(transactionId: string, orderIds: string[]) {
    try {
      const tx = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: { orderTransactions: true }
      });

      if (!tx) throw new BadRequestException('Không tìm thấy giao dịch');

      const orders = await prisma.order.findMany({
        where: { id: { in: orderIds } },
        include: { orderTransactions: true }
      });

      if (!orders.length) throw new BadRequestException('Không tìm thấy đơn hàng nào');

      const appliedAmountTx = tx.orderTransactions.reduce((sum, ot) => sum + Number(ot.appliedAmount), 0);
      let remainingTxAmount = Number(tx.amount) - appliedAmountTx;

      if (remainingTxAmount <= 0) throw new BadRequestException('Giao dịch này đã được khớp hết số dư');

      await prisma.$transaction(async (prismaTx) => {
        for (const order of orders) {
          if (remainingTxAmount <= 0) break;

          const appliedAmountOrder = order.orderTransactions.reduce((sum, ot) => sum + Number(ot.appliedAmount), 0);
          const remainingOrderAmount = Number(order.totalAmount) - appliedAmountOrder;

          if (remainingOrderAmount <= 0) continue;

          const amountToApply = Math.min(remainingTxAmount, remainingOrderAmount);

          await prismaTx.orderTransaction.create({
            data: { orderId: order.id, transactionId: tx.id, appliedAmount: amountToApply }
          });

          remainingTxAmount -= amountToApply;
          const newAppliedOrder = appliedAmountOrder + amountToApply;
          const newPaymentStatus = newAppliedOrder >= Number(order.totalAmount) ? 'PAID' : 'PARTIAL';

          await prismaTx.order.update({
            where: { id: order.id },
            data: { paidAmount: newAppliedOrder, paymentStatus: newPaymentStatus }
          });
        }
      });

      return { success: true, message: 'Khớp lệnh thành công' };
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
