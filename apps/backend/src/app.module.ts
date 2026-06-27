import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrdersModule } from './orders/orders.module';
import { TransactionModule } from './transactions/transaction.module';
import { InventoryModule } from './inventory/inventory.module';
import { CustomerModule } from './customers/customer.module';
import { UserModule } from './users/user.module';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DebtModule } from './debts/debt.module';

@Module({
  imports: [
    OrdersModule, TransactionModule, InventoryModule, 
    CustomerModule, UserModule, AuthModule, 
    DashboardModule, DebtModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
