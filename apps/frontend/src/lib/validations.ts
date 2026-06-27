import { z } from 'zod';

// Status enums - defined locally to avoid Prisma dependency in frontend
export const PurchaseStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  PARTIAL: 'PARTIAL',
  CANCELLED: 'CANCELLED',
} as const;

export const SaleStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  PARTIAL: 'PARTIAL',
  CANCELLED: 'CANCELLED',
} as const;

export const OrderStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  SHIPPING: 'SHIPPING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type TPurchaseStatus = (typeof PurchaseStatus)[keyof typeof PurchaseStatus];
export type TSaleStatus = (typeof SaleStatus)[keyof typeof SaleStatus];
export type TOrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const CreateOrderSchema = z.object({
  productName: z.string().min(1, 'Tên sản phẩm không được để trống'),
  unit: z.string().optional(),
  qty: z.number().positive('Số lượng phải lớn hơn 0').optional(),
  
  purchasePrice: z.number().min(0, 'Giá mua không được âm'),
  purchaseStatus: z.enum(['PENDING', 'PAID', 'PARTIAL', 'CANCELLED']).optional(),
  
  salePrice: z.number().min(0, 'Giá bán không được âm'),
  saleStatus: z.enum(['PENDING', 'PAID', 'PARTIAL', 'CANCELLED']).optional(),
  
  supplierId: z.string().optional(),
  customerId: z.string().optional(),
  notes: z.string().optional(),
});

export const UpdateOrderSchema = CreateOrderSchema.partial().extend({
  status: z.enum(['PENDING', 'CONFIRMED', 'SHIPPING', 'COMPLETED', 'CANCELLED']).optional(),
});
