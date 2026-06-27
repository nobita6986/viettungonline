import { BaseService } from './base.service';
import { Prisma, TransactionType, EmployeeTxType, EmployeeTxStatus } from '@prisma/client';

export interface CreateEmployeeTxInput {
  userId: string;
  categoryId: string;
  amount: number;
  type: EmployeeTxType;
  description?: string;
  orderId?: string;
}

export class EmployeeTransactionService extends BaseService {
  async getCategories() {
    let categories = await this.prisma.transactionCategory.findMany({
      orderBy: { name: 'asc' },
    });

    if (categories.length === 0) {
      await this.prisma.transactionCategory.createMany({
        data: [
          { code: 'ADVANCE_SALARY', name: 'Ứng lương', type: 'EXPENSE' },
          { code: 'MEAL', name: 'Phụ cấp ăn uống', type: 'EXPENSE' },
          { code: 'GAS', name: 'Phụ cấp đổ xăng', type: 'EXPENSE' },
          { code: 'COLLECTION', name: 'Thu tiền khách hàng hộ', type: 'COLLECTION' },
        ]
      });
      categories = await this.prisma.transactionCategory.findMany({
        orderBy: { name: 'asc' },
      });
    }

    return categories;
  }

  async getTransactions(filters?: { userId?: string; status?: EmployeeTxStatus }, page: number = 1, limit: number = 50, sortBy?: string, sortOrder: 'asc' | 'desc' = 'desc') {
    const where: Prisma.EmployeeTransactionWhereInput = {};
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.status) where.status = filters.status;

    const skip = (page - 1) * limit;

    let orderBy: Prisma.EmployeeTransactionOrderByWithRelationInput = { createdAt: 'desc' };
    if (sortBy) {
      if (sortBy === 'user') orderBy = { user: { name: sortOrder } };
      else if (sortBy === 'category') orderBy = { category: { name: sortOrder } };
      else orderBy = { [sortBy]: sortOrder };
    }

    const [data, total] = await Promise.all([
      this.prisma.employeeTransaction.findMany({
        where,
        include: {
          user: true,
          category: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.employeeTransaction.count({ where })
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async createTransaction(data: CreateEmployeeTxInput) {
    return this.prisma.$transaction(async (tx) => {
      return tx.employeeTransaction.create({
        data: {
          userId: data.userId,
          categoryId: data.categoryId,
          amount: data.amount,
          type: data.type,
          description: data.description,
          orderId: data.orderId || null,
          status: EmployeeTxStatus.PENDING,
        },
        include: {
          category: true,
          user: true,
        }
      });
    });
  }

  async approveTransaction(id: string, approvedById: string, cashFlowGroup: 'OPERATIONAL' | 'TRADING', categoryId: string) {
    return this.withTransaction(async (tx) => {
      const empTx = await tx.employeeTransaction.findUnique({
        where: { id },
        include: { category: true }
      });

      if (!empTx) throw new Error('Không tìm thấy giao dịch nhân viên');
      if (empTx.status !== EmployeeTxStatus.PENDING) throw new Error('Giao dịch đã được xử lý');

      // Lấy danh mục mới (do admin chọn)
      const newCategory = await tx.transactionCategory.findUnique({ where: { id: categoryId } });
      if (!newCategory) throw new Error('Danh mục không hợp lệ');

      const transactionType = newCategory.type as TransactionType;
      
      const newTx = await tx.transaction.create({
        data: {
          date: new Date(),
          type: transactionType,
          amount: empTx.amount,
          description: `[Duyệt phiếu NV] ${empTx.description || newCategory.name}`,
          category: newCategory.name,
          categoryId: newCategory.id,
          cashFlowGroup: cashFlowGroup,
          ...(empTx.orderId ? { orderTransactions: { create: { orderId: empTx.orderId, appliedAmount: empTx.amount } } } : {}),
          createdBy: approvedById,
        }
      });

      // Update EmployeeTransaction
      const updatedEmpTx = await tx.employeeTransaction.update({
        where: { id },
        data: {
          status: EmployeeTxStatus.APPROVED,
          approvedById,
          approvedAt: new Date(),
          transactionId: newTx.id,
        },
        include: {
          category: true,
          user: true,
        }
      });

      // Log action
      await tx.auditLog.create({
        data: {
          userId: approvedById,
          action: 'APPROVE_EMPLOYEE_TX',
          entityType: 'EmployeeTransaction',
          entityId: id,
          newValues: { status: 'APPROVED', transactionId: newTx.id } as Prisma.JsonObject,
        }
      });

      return updatedEmpTx;
    });
  }

  async approveMultipleTransactions(ids: string[], approvedById: string, cashFlowGroup: 'OPERATIONAL' | 'TRADING', categoryId: string) {
    const results: any[] = [];
    for (const id of ids) {
      try {
        const result = await this.approveTransaction(id, approvedById, cashFlowGroup, categoryId);
        results.push({ id, success: true, data: result });
      } catch (error: any) {
        results.push({ id, success: false, error: error.message });
      }
    }
    return results;
  }

  async rejectTransaction(id: string, approvedById: string) {
    return this.withTransaction(async (tx) => {
      const empTx = await tx.employeeTransaction.findUnique({ where: { id } });
      if (!empTx) throw new Error('Không tìm thấy giao dịch');
      if (empTx.status !== EmployeeTxStatus.PENDING) throw new Error('Giao dịch đã được xử lý');

      const updated = await tx.employeeTransaction.update({
        where: { id },
        data: {
          status: EmployeeTxStatus.REJECTED,
          approvedById,
          approvedAt: new Date(),
        },
        include: {
          category: true,
          user: true,
        }
      });

      await tx.auditLog.create({
        data: {
          userId: approvedById,
          action: 'REJECT_EMPLOYEE_TX',
          entityType: 'EmployeeTransaction',
          entityId: id,
          newValues: { status: 'REJECTED' } as Prisma.JsonObject,
        }
      });

      return updated;
    });
  }

  async updateTransaction(id: string, data: Partial<CreateEmployeeTxInput>, userId: string) {
    return this.withTransaction(async (tx) => {
      const empTx = await tx.employeeTransaction.findUnique({ where: { id } });
      if (!empTx) throw new Error('Không tìm thấy giao dịch');
      
      const oldValues = {
        amount: empTx.amount,
        type: empTx.type,
        categoryId: empTx.categoryId,
        description: empTx.description,
      };

      const updated = await tx.employeeTransaction.update({
        where: { id },
        data: {
          ...(data.amount !== undefined && { amount: data.amount }),
          ...(data.type !== undefined && { type: data.type }),
          ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
          ...(data.description !== undefined && { description: data.description }),
        },
        include: { category: true, user: true }
      });

      // Nếu giao dịch đã được duyệt, đồng bộ lại sang bảng Transaction (Sổ quỹ)
      if (empTx.status === EmployeeTxStatus.APPROVED && empTx.transactionId) {
        const transactionType = updated.category.type as TransactionType;
        await tx.transaction.update({
          where: { id: empTx.transactionId },
          data: {
            amount: updated.amount,
            type: transactionType,
            category: updated.category.name,
            description: `[Duyệt phiếu NV] ${updated.description || updated.category.name}`
          }
        });
      }

      await tx.auditLog.create({
        data: {
          userId,
          action: 'UPDATE_EMPLOYEE_TX',
          entityType: 'EmployeeTransaction',
          entityId: id,
          oldValues: oldValues as any,
          newValues: data as any,
        }
      });

      return updated;
    });
  }

  async deleteTransaction(id: string, userId: string) {
    return this.withTransaction(async (tx) => {
      const empTx = await tx.employeeTransaction.findUnique({ where: { id } });
      if (!empTx) throw new Error('Không tìm thấy giao dịch');

      // Revert/Delete Global Transaction if exists
      if (empTx.transactionId) {
        await tx.transaction.delete({
          where: { id: empTx.transactionId }
        });
      }

      // Xóa giao dịch nhân viên
      await tx.employeeTransaction.delete({
        where: { id }
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'DELETE_EMPLOYEE_TX',
          entityType: 'EmployeeTransaction',
          entityId: id,
          oldValues: empTx as any,
          newValues: { status: 'DELETED' } as any,
        }
      });

      return true;
    });
  }
}
