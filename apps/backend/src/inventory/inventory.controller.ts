import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { InventoryService, ImportStockInput, AdjustStockInput } from '../services/inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('import')
  async importStock(@Body() data: ImportStockInput) {
    const order = await this.inventoryService.importStock(data);
    return { success: true, data: order };
  }

  @Post('adjust')
  async adjustStock(@Body() data: AdjustStockInput) {
    const product = await this.inventoryService.adjustStock(data);
    return { success: true, data: product };
  }

  @Get('history/:productId')
  async getInventoryHistory(@Param('productId') productId: string) {
    const history = await this.inventoryService.getInventoryHistory(productId);
    return { success: true, data: history };
  }
}
