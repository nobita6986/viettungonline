import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrderService } from '../services/order.service';
import { prisma } from '@viettung/database';

@Module({
  controllers: [OrdersController],
  providers: [
    {
      provide: OrderService,
      useFactory: () => {
        // Khởi tạo service bằng instance prisma từ package database
        // Điều này giữ nguyên logic của class BaseService cũ mà không cần sửa code service
        return new OrderService(prisma as any);
      },
    },
  ],
  exports: [OrderService]
})
export class OrdersModule {}
