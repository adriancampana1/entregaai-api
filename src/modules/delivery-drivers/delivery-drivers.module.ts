import { Module } from '@nestjs/common';
import { DeliveryDriverController } from './controller/delivery-driver.controller';
import { DeliveryDriverRepository } from './repository/delivery-driver.repository';
import { DeliveryDriverService } from './service/delivery-driver.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [DeliveryDriverController],
  providers: [DeliveryDriverRepository, DeliveryDriverService],
  exports: [DeliveryDriverService],
})
export class DeliveryDriversModule {}
