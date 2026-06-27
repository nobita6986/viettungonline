import { Prisma, TransactionType, PurchaseStatus, SaleStatus } from '@prisma/client';
import { BaseService } from './base.service';
import { Decimal } from 'decimal.js';
import { DecimalUtils } from '@/lib/decimal-utils';
import { parseDateSafe } from '@/lib/date-utils';
import { InvalidTransactionError } from '@/domain/errors';
export interface CreateTransactionInput {
  date?: Date | string;
  type: TransactionType;
  amount: number;
  description?: string;
  category?: string;
  categoryId?: string;
  accountId?: string;
  customerId?: string;
}

export interface UpdateTransactionInput {
  date?: Date | string;
  type?: TransactionType;
  amount?: number;
  description?: string;
  category?: string;
  categoryId?: string;
  accountId?: string;
  customerId?: string;
}

export interface TransactionFilter {
  startDate?: Date;
  endDate?: Date;
  type?: TransactionType;
  accountId?: string;
  customerId?: string;
  orderId?: string;
  category?: string;
  categoryId?: string;
  cashFlowGroup?: Prisma.TransactionUncheckedCreateInput['cashFlowGroup'];
}

export interface TransactionSummary {
  totalIncome: Prisma.Decimal;
  totalExpense: Prisma.Decimal;
  profit: Prisma.Decimal;
  transactionCount: number;
}

export class TransactionService extends BaseService {
  /**
   * Get all transactions with filtering and pagination
   */
  async getTransactions(
    filter: TransactionFilter = {},
    page = 1,
    limit = 50,
    sortBy?: string,
    sortOrder: 'asc' | 'desc' = 'desc'
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.TransactionWhereInput = {};

    if (filter.startDate || filter.endDate) {
      where.date = {};
      if (filter.startDate) {
        where.date.gte = filter.startDate;
      }
      if (filter.endDate) {
        where.date.lte = filter.endDate;
      }
    }

    if (filter.type) {
      where.type = filter.type;
    }

    if (filter.accountId) {
      where.accountId = filter.accountId;
    }

    if (filter.customerId) {
      where.customerId = filter.customerId;
    }

    if (filter.orderId) {
      where.orderTransactions = {
        some: { orderId: filter.orderId }
      };
    }

    if (filter.category) {
      where.category = filter.category;
    }

    if (filter.categoryId) {
      where.categoryId = filter.categoryId;
    }

    if (filter.cashFlowGroup) {
      where.cashFlowGroup = filter.cashFlowGroup;
    }

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: {
          account: { select: { id: true, name: true, code: true } },
          customer: { select: { id: true, name: true } },
          orderTransactions: { include: { order: { select: { id: true, orderCode: true } } } },
          categoryRef: { select: { id: true, name: true } },
        },
        orderBy: sortBy 
          ? (sortBy === 'account' ? { account: { name: sortOrder } } : { [sortBy]: sortOrder })
          : { date: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(id: string) {
    return this.prisma.transaction.findUnique({
      where: { id },
      include: {
        account: true,
        customer: true,
        orderTransactions: { include: { order: true } },
      },
    });
  }

  /**
   * Create a new transaction
   */
  async createTransaction(data: CreateTransactionInput) {
    const transactionDate = data.date
      ? (typeof data.date === 'string' ? parseDateSafe(data.date) || new Date() : data.date)
      : new Date();

    // Tự động gán danh mục nếu là dòng tiền từ đơn hàng
    let finalCategory = data.category;
    // Chú ý: orderId đã bị loại bỏ khỏi CreateTransactionInput, logic auto-category này có thể được điều chỉnh ở cấp cao hơn.

    return this.prisma.$transaction(async (tx) => {
      // Validate Account existence if accountId is provided
      if (data.accountId) {
        const account = await tx.account.findUnique({ where: { id: data.accountId } });
        if (!account) throw new InvalidTransactionError('Không tìm thấy tài khoản (Account) liên kết');
      }

      // Create transaction
      const transaction = await tx.transaction.create({
        data: {
          date: transactionDate,
          type: data.type,
          amount: DecimalUtils.toDecimal(data.amount),
          description: data.description,
          category: finalCategory,
          categoryId: data.categoryId,
          accountId: data.accountId,
          customerId: data.customerId,
        },
        include: {
          account: true,
          customer: true,
        },
      });

      // Update account balance
      if (data.accountId) {
        const balanceChange =
          data.type === TransactionType.INCOME || data.type === TransactionType.PROFIT
            ? DecimalUtils.toDecimal(data.amount)
            : DecimalUtils.toDecimal(data.amount).negated();

        await tx.account.update({
          where: { id: data.accountId },
          data: {
            balance: {
              increment: balanceChange,
            },
          },
        });
      }

      return transaction;
    });
  }

  /**
   * Update a transaction
   */
  async updateTransaction(id: string, data: UpdateTransactionInput) {
    const existing = await this.prisma.transaction.findUnique({ where: { id } });
    if (!existing) return null;

    return this.withTransaction(async (tx) => {
      // Validate Account existence if changing accountId
      if (data.accountId && data.accountId !== existing.accountId) {
        const account = await tx.account.findUnique({ where: { id: data.accountId } });
        if (!account) throw new InvalidTransactionError('Không tìm thấy tài khoản mới (Account) để chuyển đổi');
      }

      // Reverse old balance change
      if (existing.accountId) {
        const oldChange =
          existing.type === TransactionType.INCOME || existing.type === TransactionType.PROFIT
            ? DecimalUtils.toDecimal(existing.amount)
            : DecimalUtils.toDecimal(existing.amount).negated();

        await tx.account.update({
          where: { id: existing.accountId },
          data: {
            balance: {
              decrement: oldChange,
            },
          },
        });
      }

      // Update transaction
      const updateData: Prisma.TransactionUncheckedUpdateInput = {};
      if (data.date !== undefined) {
        updateData.date =
          typeof data.date === 'string'
            ? parseDateSafe(data.date) || new Date()
            : data.date;
      }
      if (data.type !== undefined) updateData.type = data.type;
      if (data.amount !== undefined) updateData.amount = DecimalUtils.toDecimal(data.amount);
      if (data.description !== undefined) updateData.description = data.description;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
      if (data.accountId !== undefined) updateData.accountId = data.accountId;
      if (data.customerId !== undefined) updateData.customerId = data.customerId;

      const updated = await tx.transaction.update({
        where: { id },
        data: updateData,
        include: {
          account: true,
          customer: true,
        },
      });

      // Apply new balance change
      const newType = data.type || existing.type;
      const newAmount = data.amount ?? Number(existing.amount);
      const accountId = data.accountId || existing.accountId;

      if (accountId) {
        const newChange =
          newType === TransactionType.INCOME || newType === TransactionType.PROFIT
            ? DecimalUtils.toDecimal(newAmount)
            : DecimalUtils.toDecimal(newAmount).negated();

        await tx.account.update({
          where: { id: accountId },
          data: {
            balance: {
              increment: newChange,
            },
          },
        });
      }

      return updated;
    });
  }

  /**
   * Delete a transaction
   */
  async deleteTransaction(id: string) {
    const existing = await this.prisma.transaction.findUnique({ where: { id } });
    if (!existing) return null;

    return this.withTransaction(async (tx) => {
      // Reverse balance change
      if (existing.accountId) {
        const change =
          existing.type === TransactionType.INCOME || existing.type === TransactionType.PROFIT
            ? DecimalUtils.toDecimal(existing.amount)
            : DecimalUtils.toDecimal(existing.amount).negated();

        await tx.account.update({
          where: { id: existing.accountId },
          data: {
            balance: {
              decrement: change,
            },
          },
        });
      }

      return tx.transaction.delete({ where: { id } });
    });
  }

  /**
   * Get transaction summary for a period
   */
  async getSummary(startDate: Date, endDate: Date): Promise<TransactionSummary> {
    const aggregateResult = await this.prisma.transaction.groupBy({
      by: ['type'],
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      }
    });

    let totalIncome = DecimalUtils.toDecimal(0);
    let totalExpense = DecimalUtils.toDecimal(0);
    let transactionCount = 0;

    for (const group of aggregateResult) {
      const amount = DecimalUtils.toDecimal(group._sum.amount);
      transactionCount += group._count.id;
      if (group.type === TransactionType.INCOME || group.type === TransactionType.PROFIT) {
        totalIncome = DecimalUtils.add(totalIncome, amount);
      } else {
        totalExpense = DecimalUtils.add(totalExpense, amount);
      }
    }

    return {
      totalIncome,
      totalExpense,
      profit: DecimalUtils.subtract(totalIncome, totalExpense),
      transactionCount,
    };
  }

  /**
   * Get daily breakdown for charts
   */
  async getDailyBreakdown(startDate: Date, endDate: Date) {
    const rawData = await this.prisma.$queryRaw<any[]>`
      SELECT 
        DATE_TRUNC('day', date) as "dateKey",
        COALESCE(SUM(CASE WHEN type IN ('${TransactionType.INCOME}', '${TransactionType.PROFIT}', '${TransactionType.RECEIPT}') THEN amount ELSE 0 END), 0)::numeric as income,
        COALESCE(SUM(CASE WHEN type IN ('${TransactionType.EXPENSE}', '${TransactionType.COST}') THEN amount ELSE 0 END), 0)::numeric as expense
      FROM transactions
      WHERE date >= ${startDate} AND date <= ${endDate}
      GROUP BY DATE_TRUNC('day', date)
      ORDER BY "dateKey" ASC
    `;

    return rawData.map(row => ({
      date: new Date(row.dateKey).toISOString().split('T')[0],
      income: DecimalUtils.toNumber(row.income),
      expense: DecimalUtils.toNumber(row.expense)
    }));
  }

  /**
   * Đồng bộ các đơn hàng đã hoàn thành/đã thanh toán vào sổ quỹ
   */
  async syncOrderTransactions() {
    return this.prisma.$transaction(async (tx) => {
      let syncedSales = 0;
      let syncedPurchases = 0;

      // Lấy các đơn hàng có doanh thu bán (saleStatus = PAID hoặc paymentStatus = PAID) mà chưa có Transaction INCOME
      const saleOrders = await tx.order.findMany({
        where: {
          OR: [{ saleStatus: SaleStatus.PAID }, { paymentStatus: 'PAID' }],
          orderTransactions: { none: { transaction: { type: TransactionType.INCOME } } }
        }
      });

      // Xử lý Sales Orders (Batch Insert)
      const salesDataToInsert = saleOrders
        .map(order => {
          const amount = Number(order.paidAmount) > 0 ? Number(order.paidAmount) : Number(order.salePrice);
          if (amount <= 0) return null;
          return {
            date: order.saleDate || order.updatedAt,
            type: TransactionType.INCOME,
            amount: DecimalUtils.toDecimal(amount),
            customerId: order.customerId || undefined,
            description: `Thu tiền bán hàng ${order.orderCode}`,
            category: 'Doanh thu bán hàng'
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      if (salesDataToInsert.length > 0) {
        // Tối ưu Batch Insert & Tránh N+1 (Thay thế createMany bằng bọc create trong $transaction nếu cần ID, 
        // ở đây ta minh họa cách dùng mảng Promise để có thể lấy ID xử lý logic tiếp theo)
        await Promise.all(salesDataToInsert.map(data => tx.transaction.create({ data })));
        syncedSales = salesDataToInsert.length;
      }

      // Lấy các đơn hàng có chi phí mua (purchaseStatus = PAID) mà chưa có Transaction EXPENSE
      const purchaseOrders = await tx.order.findMany({
        where: {
          OR: [{ purchaseStatus: PurchaseStatus.PAID }, { type: 'PURCHASE', paymentStatus: 'PAID' }],
          orderTransactions: { none: { transaction: { type: TransactionType.EXPENSE } } }
        }
      });

      // Xử lý Purchase Orders (Batch Insert)
      const purchasesDataToInsert = purchaseOrders
        .map(order => {
          const amount = (order.type === 'PURCHASE' && Number(order.paidAmount) > 0) ? Number(order.paidAmount) : Number(order.purchasePrice);
          if (amount <= 0) return null;
          return {
            date: order.purchaseDate || order.updatedAt,
            type: TransactionType.EXPENSE,
            amount: DecimalUtils.toDecimal(amount),
            customerId: order.supplierId || undefined,
            description: `Thanh toán nhập hàng ${order.orderCode}`,
            category: 'Giá vốn hàng bán'
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      if (purchasesDataToInsert.length > 0) {
        await Promise.all(purchasesDataToInsert.map(data => tx.transaction.create({ data })));
        syncedPurchases = purchasesDataToInsert.length;
      }

      return { success: true, syncedSales, syncedPurchases };
    });
  }
}
