import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/infra/database/prisma.service';
import { CreateDeliveryDriverDto } from '../dto/create-delivery-driver.dto';
import {
  DeliveryDriver,
  deliveryDriverWithRelationsSelect,
} from '../interface/delivery-driver';

@Injectable()
export class DeliveryDriverRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createDeliveryDriverDto: CreateDeliveryDriverDto,
  ): Promise<DeliveryDriver> {
    const entregador = await this.prisma.entregador.create({
      data: {
        nome: createDeliveryDriverDto.nome,
        telefone: createDeliveryDriverDto.telefone,
      },
      select: deliveryDriverWithRelationsSelect,
    });

    return entregador;
  }

  async findAll(): Promise<DeliveryDriver[]> {
    const entregadores = await this.prisma.entregador.findMany({
      select: deliveryDriverWithRelationsSelect,
    });

    return entregadores;
  }

  async findByPhone(telefone: string): Promise<DeliveryDriver | null> {
    const entregador = await this.prisma.entregador.findUnique({
      where: { telefone },
      select: deliveryDriverWithRelationsSelect,
    });

    return entregador;
  }

  async findById(id: number): Promise<DeliveryDriver | null> {
    const entregador = await this.prisma.entregador.findUnique({
      where: { id },
      select: deliveryDriverWithRelationsSelect,
    });

    return entregador;
  }
}
