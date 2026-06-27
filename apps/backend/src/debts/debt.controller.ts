import { Controller, Get } from '@nestjs/common';
import { DebtService } from '../services/debt.service';

@Controller('debts')
export class DebtController {
  constructor(private readonly debtService: DebtService) {}

  @Get('aging-report')
  async getAgingReport() {
    const data = await this.debtService.getAgingReport();
    return { success: true, data };
  }
}
