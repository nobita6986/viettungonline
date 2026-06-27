import { Prisma, OrderStatus } from '@prisma/client';
import { BaseService } from './base.service';
import { DecimalUtils } from '@/lib/decimal-utils';

export class OrderCalculationService extends BaseService {
  /**
   * Tính toán thống kê đơn hàng (Get Order Stats)
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
}
