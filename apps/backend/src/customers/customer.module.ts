import { Module } from '@nestjs/common';
import { CustomerController } from './customer.controller';
import { CustomerService } from '../services/customer.service';
import { prisma } from '@viettung/database';

@Module({
  controllers: [CustomerController],
  providers: [
    {
      provide: CustomerService,
      useFactory: () => {
        return new CustomerService(prisma as any);
      },
    },
  ],
  exports: [CustomerService]
})
export class CustomerModule {}
