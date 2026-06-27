import { Prisma, CustomerType } from '@prisma/client';
import { BaseService } from './base.service';

export interface CreateCustomerInput {
  name: string;
  phone?: string;
  address?: string;
  email?: string;
  type: CustomerType;
  isActive?: boolean;
}

export interface UpdateCustomerInput {
  name?: string;
  phone?: string;
  address?: string;
  email?: string;
  type?: CustomerType;
  isActive?: boolean;
}

export class CustomerService extends BaseService {
  async getCustomers(type?: CustomerType, search?: string) {
    const where: Prisma.CustomerWhereInput = {};
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { customerOrders: true, supplierOrders: true },
        },
      },
    });
  }

  async getCustomerById(id: string) {
    return this.prisma.customer.findUnique({
      where: { id },
    });
  }

  async createCustomer(data: CreateCustomerInput) {
    return this.prisma.customer.create({
      data,
    });
  }

  async updateCustomer(id: string, data: UpdateCustomerInput) {
    return this.prisma.customer.update({
      where: { id },
      data,
    });
  }

  async deleteCustomer(id: string) {
    return this.prisma.customer.delete({
      where: { id },
    });
  }
}
