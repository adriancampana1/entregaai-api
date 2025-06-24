import { BadRequestException, Injectable } from '@nestjs/common';
import { DeliveryDriverRepository } from '../repository/delivery-driver.repository';
import { CreateDeliveryDriverDto } from '../dto/create-delivery-driver.dto';
import { DeliveryDriver } from '../interface/delivery-driver';

@Injectable()
export class DeliveryDriverService {
  constructor(
    private readonly deliveryDriverRepository: DeliveryDriverRepository,
  ) {}

  async createDeliveryDriver(
    createDeliveryDriverDto: CreateDeliveryDriverDto,
  ): Promise<DeliveryDriver> {
    const existingDeliveryDriver =
      await this.deliveryDriverRepository.findByPhone(
        createDeliveryDriverDto.telefone,
      );

    if (existingDeliveryDriver) {
      throw new BadRequestException(
        'Entregador com esse telefone já cadastrado',
      );
    }

    const deliveryDriver = await this.deliveryDriverRepository.create(
      createDeliveryDriverDto,
    );

    if (!deliveryDriver) {
      throw new BadRequestException('Erro ao criar entregador');
    }

    return deliveryDriver;
  }

  async findAllDeliveryDrivers(): Promise<DeliveryDriver[]> {
    const deliveryDrivers = await this.deliveryDriverRepository.findAll();

    return deliveryDrivers;
  }

  async findDeliveryDriverById(
    id: string | number,
  ): Promise<DeliveryDriver | null> {
    const deliveryDriver = await this.deliveryDriverRepository.findById(
      Number(id),
    );

    if (!deliveryDriver) {
      throw new BadRequestException('Nenhum entregador encontrado');
    }

    return deliveryDriver;
  }
}
