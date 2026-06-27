import { z } from 'zod';
import { PurchaseStatus, SaleStatus, OrderStatus } from '@prisma/client';

export const CreateOrderSchema = z.object({
  productName: z.string().min(1, 'Tên sản phẩm không được để trống'),
  unit: z.string().optional(),
  qty: z.number().positive('Số lượng phải lớn hơn 0').optional(),
  
  purchasePrice: z.number().min(0, 'Giá mua không được âm'),
  purchaseStatus: z.nativeEnum(PurchaseStatus).optional(),
  
  salePrice: z.number().min(0, 'Giá bán không được âm'),
  saleStatus: z.nativeEnum(SaleStatus).optional(),
  
  supplierId: z.string().optional(),
  customerId: z.string().optional(),
  notes: z.string().optional(),
});

export const UpdateOrderSchema = CreateOrderSchema.partial().extend({
  status: z.nativeEnum(OrderStatus).optional(),
});
