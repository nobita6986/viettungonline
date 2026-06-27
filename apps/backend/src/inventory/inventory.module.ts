import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from '../services/inventory.service';
import { prisma } from '@viettung/database';

@Module({
  controllers: [InventoryController],
  providers: [
    {
      provide: InventoryService,
      useFactory: () => {
        return new InventoryService(prisma as any);
      },
    },
  ],
  exports: [InventoryService]
})
export class InventoryModule {}
