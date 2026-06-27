import { prisma } from '@viettung/database';
import { logger } from '@/lib/logger';
import { DecimalUtils } from '@/lib/decimal-utils';

export class DebtService {
  /**
   * Tự động ghi nhận công nợ khi một đơn hàng (Bán/Nhập) được hoàn thành nhưng chưa thanh toán đủ
   */
  async createDebtFromOrder(orderId: string) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId }
      });

      if (!order || order.status !== 'COMPLETED') return { success: false, error: 'Đơn hàng chưa hoàn thành' };

      // Xác định loại công nợ và trạng thái thanh toán
      let isUnpaid = false;
      let debtType = '';
      let customerId = '';
      let totalAmount = 0;

      if (order.supplierId && order.purchaseStatus === 'PENDING') {
        isUnpaid = true;
        debtType = 'PAYABLE';
        customerId = order.supplierId;
        totalAmount = Number(order.purchasePrice);
      } else if (order.customerId && order.saleStatus === 'PENDING') {
        isUnpaid = true;
        debtType = 'RECEIVABLE';
        customerId = order.customerId;
        totalAmount = Number(order.salePrice);
      }

      if (!isUnpaid || !customerId) return { success: false, message: 'Đơn hàng đã thanh toán hoặc không có đối tác' };

      // Kiểm tra xem khoản nợ này đã được tạo chưa
      const existingDebt = await tx.customerDebt.findFirst({
        where: { orderId: order.id }
      });

      if (existingDebt) return { success: false, message: 'Công nợ đã được ghi nhận' };

      // Ngày đáo hạn mặc định là 30 ngày sau
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      const debt = await tx.customerDebt.create({
        data: {
          customerId,
          orderId: order.id,
          type: debtType,
          originalAmount: totalAmount,
          currentAmount: totalAmount,
          dueDate,
          status: 'PENDING',
          agingBucket: 'CURRENT'
        }
      });

      // Cập nhật currentDebt của khách hàng
      if (debtType === 'RECEIVABLE') {
        await tx.customer.update({
          where: { id: customerId },
          data: { currentDebt: { increment: totalAmount } }
        });
      } else {
        // PAYABLE cũng có thể coi là currentDebt nhưng mang dấu âm hoặc quản lý riêng.
        // Ở đây ta cộng dồn vào currentDebt hoặc tách riêng. Tạm thời dùng currentDebt chung hoặc trừ đi.
        await tx.customer.update({
          where: { id: customerId },
          data: { currentDebt: { decrement: totalAmount } }
        });
      }

      return { success: true, data: debt };
    });
  }

  /**
   * Phân loại công nợ theo các nhóm tuổi
   */
  async getAgingReport() {
    try {
      const debts = await prisma.customerDebt.findMany({
        where: { status: { in: ['PENDING', 'PARTIAL'] } },
        include: { customer: true }
      });

      const now = new Date().getTime();
      
      const report = {
        receivables: {
          CURRENT: 0,
          '30_DAYS': 0,
          '60_DAYS': 0,
          '90_DAYS': 0,
          total: 0
        },
        payables: {
          CURRENT: 0,
          '30_DAYS': 0,
          '60_DAYS': 0,
          '90_DAYS': 0,
          total: 0
        }
      };

      for (const debt of debts) {
        let bucket: 'CURRENT' | '30_DAYS' | '60_DAYS' | '90_DAYS' = 'CURRENT';
        const amount = Number(debt.currentAmount);

        if (debt.dueDate) {
          const dueTime = new Date(debt.dueDate).getTime();
          const diffDays = Math.floor((now - dueTime) / (1000 * 60 * 60 * 24));

          if (diffDays <= 0) bucket = 'CURRENT';
          else if (diffDays <= 30) bucket = '30_DAYS';
          else if (diffDays <= 60) bucket = '60_DAYS';
          else bucket = '90_DAYS';
        }

        // Cập nhật agingBucket vào DB nếu nó thay đổi
        if (debt.agingBucket !== bucket) {
          await prisma.customerDebt.update({
            where: { id: debt.id },
            data: { agingBucket: bucket }
          });
        }

        const typeGroup = debt.type === 'RECEIVABLE' ? report.receivables : report.payables;
        typeGroup[bucket] += amount;
        typeGroup.total += amount;
      }

      return { success: true, data: report };
    } catch (error) {
      logger.error({ error }, 'Error generating aging report');
      return { success: false, error: 'Cannot generate aging report' };
    }
  }
}

export const debtService = new DebtService();
