import { Controller, Get } from '@nestjs/common';
import { CustomerService } from '../services/customer.service';

@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  async getCustomers() {
    // Gọi phương thức từ CustomerService đã được chép qua
    const customers = await this.customerService.getCustomers();
    return { success: true, data: customers };
  }
}
