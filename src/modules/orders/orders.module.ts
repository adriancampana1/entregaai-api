import { Module } from '@nestjs/common';
import { OrderRepository } from './repository/order.repository';
import { OrderService } from './service/order.service';
import { OrderController } from './controller/order.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [OrderController],
  providers: [OrderRepository, OrderService],
  exports: [OrderService, OrderRepository],
})
export class OrdersModule {}
