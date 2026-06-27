import { Controller, Get } from '@nestjs/common';
import { DashboardService } from '../services/dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  async getSummary() {
    // Gọi phương thức từ DashboardService đã được chép qua
    const data = await this.dashboardService.getRevenueAndExpenseSummary();
    return { success: true, data };
  }
}
