import { Injectable } from '@nestjs/common';
import { Prisma, StatusCorrida } from '@prisma/client';
import { PrismaService } from 'src/shared/infra/database/prisma.service';
import { Run, runWithRelationsSelect } from '../interface/run';

@Injectable()
export class RunDispatchRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createRun(
    status: StatusCorrida,
    deliveryDriverId: number,
    tx?: Prisma.TransactionClient,
  ): Promise<Run> {
    const prismaClient = tx || this.prisma;
    const run = await prismaClient.corrida.create({
      data: {
        status,
        entregadorId: deliveryDriverId,
      },
      select: runWithRelationsSelect,
    });

    return run;
  }

  async findAllRuns(startDate?: Date, endDate?: Date): Promise<Run[]> {
    const where: Prisma.CorridaWhereInput = {};

    if (startDate || endDate) {
      where.createdAt = {};

      if (startDate) {
        where.createdAt.gte = startDate;
      }

      if (endDate) {
        where.createdAt.lt = endDate;
      }
    }

    const runs = await this.prisma.corrida.findMany({
      where,
      select: runWithRelationsSelect,
    });

    return runs;
  }

  async findAllRunsByDeliveryDriver(
    deliveryDriverId: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<Run[]> {
    const where: Prisma.CorridaWhereInput = {
      entregadorId: deliveryDriverId,
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lt = endDate;
      }
    }

    const runs = await this.prisma.corrida.findMany({
      where,
      select: runWithRelationsSelect,
    });

    return runs;
  }

  async findRunById(
    runId: number,
    tx?: Prisma.TransactionClient,
  ): Promise<Run | null> {
    const prismaClient = tx || this.prisma;
    const run = await prismaClient.corrida.findUnique({
      where: { id: runId },
      select: runWithRelationsSelect,
    });

    return run;
  }
}
