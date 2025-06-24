import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { OrderService } from '../service/order.service';
import { Roles } from 'src/modules/auth/decorator/roles.decorator';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt.guard';
import { RoleGuard } from 'src/modules/auth/guards/role.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard, RoleGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @Roles('admin')
  async getAllOrders() {
    return this.orderService.findAllOrders();
  }

  @Get(':id')
  @Roles('admin')
  async getOrderById(@Param('id') id: string) {
    return this.orderService.findOrderById(id);
  }
}
