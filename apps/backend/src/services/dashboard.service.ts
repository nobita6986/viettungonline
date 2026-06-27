import { prisma } from '@viettung/database';
import { logger } from '@/lib/logger';
import { TransactionType, CashFlowGroup, OrderType, OrderStatus } from '@prisma/client';

export class DashboardService {
  /**
   * Lấy Tổng Thu, Tổng Chi, Lợi nhuận (Phân tách Dòng tiền Kinh doanh và Vận hành)
   */
  async getRevenueAndExpenseSummary(startDate?: Date, endDate?: Date) {
    try {
      const whereClause = (startDate && endDate) ? {
        date: { gte: startDate, lte: endDate }
      } : {};

      const rawData = await prisma.transaction.groupBy({
        by: ['type', 'cashFlowGroup'],
        where: whereClause,
        _sum: {
          amount: true,
        },
      });

      const summary = {
        operational: { income: 0, expense: 0, profit: 0 },
        trading: { income: 0, expense: 0, profit: 0 },
        totalIncome: 0,
        totalExpense: 0,
        netProfit: 0
      };

      for (const row of rawData) {
        const group = row.cashFlowGroup === CashFlowGroup.OPERATIONAL ? summary.operational : summary.trading;
        const amount = Number(row._sum.amount || 0);

        if ([TransactionType.INCOME, TransactionType.PROFIT, TransactionType.RECEIPT].includes(row.type as any)) {
          group.income += amount;
          summary.totalIncome += amount;
        } else if ([TransactionType.EXPENSE, TransactionType.COST].includes(row.type as any)) {
          group.expense += amount;
          summary.totalExpense += amount;
        }
      }

      summary.operational.profit = summary.operational.income - summary.operational.expense;
      summary.trading.profit = summary.trading.income - summary.trading.expense;
      summary.netProfit = summary.totalIncome - summary.totalExpense;

      return { success: true, data: summary };
    } catch (error) {
      logger.error({ error }, 'Error in getRevenueAndExpenseSummary');
      return { success: false, error: 'Cannot fetch revenue summary' };
    }
  }

  /**
   * Thống kê biểu đồ 6 tháng gần nhất
   */
  async getSixMonthsChartData() {
    try {
      const now = new Date();
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

      const rawData = await prisma.$queryRaw<any[]>`
        SELECT 
          TO_CHAR(date, 'MM/YYYY') as month,
          DATE_TRUNC('month', date) as month_date,
          COALESCE(SUM(CASE WHEN type IN ('${TransactionType.INCOME}', '${TransactionType.PROFIT}', '${TransactionType.RECEIPT}') THEN amount ELSE 0 END), 0) as income,
          COALESCE(SUM(CASE WHEN type IN ('${TransactionType.EXPENSE}', '${TransactionType.COST}') THEN amount ELSE 0 END), 0) as expense
        FROM transactions
        WHERE date >= ${sixMonthsAgo}
        GROUP BY TO_CHAR(date, 'MM/YYYY'), DATE_TRUNC('month', date)
        ORDER BY month_date ASC
      `;

      return { 
        success: true, 
        data: rawData.map(r => ({
          month: r.month,
          income: Number(r.income),
          expense: Number(r.expense)
        })) 
      };
    } catch (error) {
      logger.error({ error }, 'Error in getSixMonthsChartData');
      return { success: false, error: 'Cannot fetch chart data' };
    }
  }

  /**
   * Cơ cấu chi phí vận hành (Donut chart)
   */
  async getOperationalExpenseBreakdown(startDate?: Date, endDate?: Date) {
    try {
      const whereClause: any = {
        type: { in: [TransactionType.EXPENSE, TransactionType.COST] },
        cashFlowGroup: CashFlowGroup.OPERATIONAL,
        categoryId: { not: null }
      };

      if (startDate && endDate) {
        whereClause.date = { gte: startDate, lte: endDate };
      }

      const expenses = await prisma.transaction.groupBy({
        by: ['categoryId'],
        where: whereClause,
        _sum: { amount: true }
      });

      const categories = await prisma.transactionCategory.findMany({
        where: { id: { in: expenses.map(e => e.categoryId as string) } }
      });

      const categoryMap = new Map(categories.map(c => [c.id, c.name]));

      const data = expenses.map(e => ({
        name: categoryMap.get(e.categoryId as string) || 'Khác',
        value: Number(e._sum.amount || 0)
      })).filter(e => e.value > 0);

      return { success: true, data };
    } catch (error) {
      logger.error({ error }, 'Error in getOperationalExpenseBreakdown');
      return { success: false, error: 'Cannot fetch expense breakdown' };
    }
  }

  /**
   * Top sản phẩm bán chạy
   */
  async getTopSellingProducts(limit: number = 5) {
    try {
      const topProducts = await prisma.orderItem.groupBy({
        by: ['productId', 'productName'],
        where: {
          order: { type: OrderType.SALE, status: OrderStatus.COMPLETED }
        },
        _sum: { qty: true, sellTotal: true },
        orderBy: { _sum: { sellTotal: 'desc' } },
        take: limit,
      });

      return {
        success: true,
        data: topProducts.map(p => ({
          productId: p.productId,
          productName: p.productName,
          totalQty: Number(p._sum.qty || 0),
          revenue: Number(p._sum.sellTotal || 0)
        }))
      };
    } catch (error) {
      logger.error({ error }, 'Error in getTopSellingProducts');
      return { success: false, error: 'Cannot fetch top selling products' };
    }
  }

  /**
   * Tổng quan tình trạng Công nợ
   */
  async getDebtSummary() {
    try {
      const debts = await prisma.customerDebt.groupBy({
        by: ['type', 'status', 'agingBucket'],
        where: { status: { in: ['PENDING', 'PARTIAL'] } },
        _sum: { currentAmount: true }
      });

      const summary = {
        receivable: { current: 0, overdue: 0, total: 0 },
        payable: { current: 0, overdue: 0, total: 0 }
      };

      for (const d of debts) {
        const amount = Number(d._sum.currentAmount || 0);
        const group = d.type === 'RECEIVABLE' ? summary.receivable : summary.payable;
        
        group.total += amount;
        if (d.agingBucket === 'CURRENT') {
          group.current += amount;
        } else {
          group.overdue += amount;
        }
      }

      return { success: true, data: summary };
    } catch (error) {
      logger.error({ error }, 'Error in getDebtSummary');
      return { success: false, error: 'Cannot fetch debt summary' };
    }
  }
}

export const dashboardService = new DashboardService();
