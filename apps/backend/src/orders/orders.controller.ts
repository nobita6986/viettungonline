import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { OrderService, CreateOrderInput, UpdateOrderInput, OrderFilter } from '../services/order.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  async getOrders(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder: 'asc' | 'desc' = 'desc'
  ) {
    // Note: Mở rộng thêm lấy OrderFilter từ query parameters
    const filter: OrderFilter = {}; 
    const result = await this.orderService.getOrders(filter, Number(page), Number(limit), sortBy, sortOrder);
    return { success: true, data: result };
  }

  @Get(':id')
  async getOrderById(@Param('id') id: string) {
    const order = await this.orderService.getOrderById(id);
    return { success: true, data: order };
  }

  @Post()
  async createOrder(@Body() createOrderDto: CreateOrderInput) {
    const order = await this.orderService.createOrder(createOrderDto);
    return { success: true, data: order };
  }

  @Put(':id')
  async updateOrder(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderInput) {
    const order = await this.orderService.updateOrder(id, updateOrderDto);
    return { success: true, data: order };
  }

  @Delete(':id')
  async deleteOrder(@Param('id') id: string, @Body('userId') userId: string) {
    const result = await this.orderService.deleteOrder(id, userId);
    return { success: true, data: result };
  }
}
