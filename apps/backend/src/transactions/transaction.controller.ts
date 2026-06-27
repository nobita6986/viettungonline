import { Controller, Post, Body } from '@nestjs/common';
import { TransactionService } from './transaction.service';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post('reconcile')
  async reconcile(@Body() body: { transactionId: string, orderIds: string[] }) {
    return this.transactionService.reconcileTransactionsWithOrders(
      body.transactionId, 
      body.orderIds
    );
  }
}
