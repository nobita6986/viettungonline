import { BaseService } from './base.service';
import { Prisma, PayoutStatus } from '@prisma/client';
import { prisma } from '@viettung/database';

export interface CreateRuleInput {
  name: string;
  targetType: string;
  minAmount?: number;
  ratePercent: number;
  fixedAmount?: number;
  isActive?: boolean;
}

export class CommissionService extends BaseService {
  async getRules() {
    return this.prisma.commissionRule.findMany({
      orderBy: { minAmount: 'asc' },
    });
  }

  async createRule(data: CreateRuleInput) {
    return this.prisma.commissionRule.create({
      data: {
        name: data.name,
        targetType: data.targetType,
        minAmount: data.minAmount || null,
        ratePercent: data.ratePercent,
        fixedAmount: data.fixedAmount || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      }
    });
  }

  async updateRule(id: string, data: Partial<CreateRuleInput>) {
    return this.prisma.commissionRule.update({
      where: { id },
      data: {
        ...data,
      }
    });
  }

  async deleteRule(id: string) {
    return this.prisma.commissionRule.delete({ where: { id } });
  }

  async getPayouts(filters?: { periodMonth?: number; periodYear?: number; userId?: string }) {
    const where: Prisma.PayoutWhereInput = {};
    if (filters?.periodMonth) where.periodMonth = filters.periodMonth;
    if (filters?.periodYear) where.periodYear = filters.periodYear;
    if (filters?.userId) where.userId = filters.userId;

    return this.prisma.payout.findMany({
      where,
      include: {
        user: true,
      },
      orderBy: [
        { periodYear: 'desc' },
        { periodMonth: 'desc' },
      ],
    });
  }

  async calculateAndCreatePayout(userId: string, periodMonth: number, periodYear: number) {
    if (!userId) throw new Error("userId là bắt buộc");
    if (periodMonth < 1 || periodMonth > 12) throw new Error("Tháng không hợp lệ");
    if (periodYear < 2000 || periodYear > 2100) throw new Error("Năm không hợp lệ");

    try {
      return await this.withTransaction(async (tx) => {
        // Determine the start and end of the month
        const startDate = new Date(periodYear, periodMonth - 1, 1);
        const endDate = new Date(periodYear, periodMonth, 0, 23, 59, 59, 999);

        // Get closed orders for this user in this month
        const orders = await tx.order.findMany({
          where: {
            userId,
            status: 'COMPLETED',
            createdAt: {
              gte: startDate,
              lte: endDate,
            }
          }
        });

        // Sum up total sales
        const totalSales = orders.reduce((sum, order) => {
          const salePrice = order.salePrice ? Number(order.salePrice) : 0;
          return sum + salePrice;
        }, 0);

        // Find applicable rule
        const rules = await tx.commissionRule.findMany({
          where: { isActive: true, targetType: 'REVENUE' },
          orderBy: { minAmount: 'desc' }
        });

        let matchedRule: any = null;
        for (const rule of rules) {
          if (rule.minAmount !== null && totalSales >= Number(rule.minAmount)) {
            matchedRule = rule;
            break;
          }
        }

        let commission = 0;
        if (matchedRule) {
          if (matchedRule.fixedAmount && Number(matchedRule.fixedAmount) > 0) {
            commission = Number(matchedRule.fixedAmount) * orders.length; // Số tiền cụ thể trên từng đơn hàng
          } else {
            commission = (totalSales * Number(matchedRule.ratePercent)) / 100; // % trên từng đơn (bằng % tổng doanh số)
          }
        }

        // Check if payout already exists
        const existing = await tx.payout.findUnique({
          where: {
            userId_periodMonth_periodYear: {
              userId,
              periodMonth,
              periodYear
            }
          }
        });

        if (existing) {
          if (existing.status === PayoutStatus.PAID) throw new Error('Bảng kê này đã được thanh toán, không thể tính lại.');
          
          return tx.payout.update({
            where: { id: existing.id },
            data: {
              totalSales,
              commission,
            },
            include: { user: true }
          });
        }

        return tx.payout.create({
          data: {
            userId,
            periodMonth,
            periodYear,
            totalSales,
            commission,
            status: PayoutStatus.PENDING,
          },
          include: { user: true }
        });
      });
    } catch (error) {
      console.error('[calculateAndCreatePayout] Error:', error);
      throw error;
    }
  }

  async markPayoutAsPaid(id: string) {
    return this.prisma.payout.update({
      where: { id },
      data: {
        status: PayoutStatus.PAID,
        paidAt: new Date(),
      },
      include: { user: true }
    });
  }
}

export const commissionService = new CommissionService(prisma);
