import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { DeliveryDriverService } from '../service/delivery-driver.service';
import { CreateDeliveryDriverDto } from '../dto/create-delivery-driver.dto';
import { DeliveryDriver } from '../interface/delivery-driver';
import { Roles } from 'src/modules/auth/decorator/roles.decorator';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt.guard';
import { RoleGuard } from 'src/modules/auth/guards/role.guard';

@Controller('delivery-drivers')
export class DeliveryDriverController {
  constructor(private readonly deliveryDriverService: DeliveryDriverService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('admin')
  async createDeliveryDriver(
    @Body() createDeliveryDriverDto: CreateDeliveryDriverDto,
  ): Promise<DeliveryDriver> {
    return this.deliveryDriverService.createDeliveryDriver(
      createDeliveryDriverDto,
    );
  }

  @Get()
  async findAllDeliveryDrivers(): Promise<DeliveryDriver[]> {
    return this.deliveryDriverService.findAllDeliveryDrivers();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findDeliveryDriverById(
    @Param('id') id: string,
  ): Promise<DeliveryDriver | null> {
    return this.deliveryDriverService.findDeliveryDriverById(id);
  }
}
