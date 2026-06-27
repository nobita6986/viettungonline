import { Module } from '@nestjs/common';
import { DebtController } from './debt.controller';
import { DebtService } from '../services/debt.service';
import { prisma } from '@viettung/database';

@Module({
  controllers: [DebtController],
  providers: [
    {
      provide: DebtService,
      useFactory: () => {
        return new DebtService();
      },
    },
  ],
  exports: [DebtService]
})
export class DebtModule {}
