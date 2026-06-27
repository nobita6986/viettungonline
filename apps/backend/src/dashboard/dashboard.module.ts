import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from '../services/dashboard.service';
import { prisma } from '@viettung/database';

@Module({
  controllers: [DashboardController],
  providers: [
    {
      provide: DashboardService,
      useFactory: () => {
        return new DashboardService();
      },
    },
  ],
  exports: [DashboardService]
})
export class DashboardModule {}
