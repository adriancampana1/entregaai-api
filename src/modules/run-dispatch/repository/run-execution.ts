import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/infra/database/prisma.service';
import { CreateStopDto } from '../dto/create-stop.dto';
import { Prisma, StatusParada } from '@prisma/client';
import { StopRun, stopRunWithRelationsSelect } from '../interface/stop';

@Injectable()
export class RunExecutionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createStops(
    createStopsDto: CreateStopDto[],
    tx: Prisma.TransactionClient,
  ) {
    const stops = await tx.parada.createMany({
      data: createStopsDto,
    });

    return stops;
  }

  async completeStop(stopId: number): Promise<StopRun> {
    const updatedStop = await this.prisma.parada.update({
      where: { id: stopId },
      data: {
        status: StatusParada.CONCLUIDA,
        horarioConclusao: new Date(),
      },
      select: stopRunWithRelationsSelect,
    });

    return updatedStop;
  }
}
