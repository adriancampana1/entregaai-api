import { BadRequestException, Injectable } from '@nestjs/common';
import { RunExecutionRepository } from '../repository/run-execution';
import { StatusCorrida, StatusParada, StatusPedido } from '@prisma/client';
import { StopRun } from '../interface/stop';
import { RunDispatchService } from './run-dispatch.service';
import { OrderRepository } from 'src/modules/orders/repository/order.repository';
import { PrismaService } from 'src/shared/infra/database/prisma.service';
import { Run } from '../interface/run';
import { CompleteStopDto } from '../dto/complete-stop.dto';

@Injectable()
export class RunExecutionService {
  constructor(
    private readonly runExecutionRepository: RunExecutionRepository,
    private readonly orderRepository: OrderRepository,
    private readonly runDispatchService: RunDispatchService,
    private readonly prisma: PrismaService,
  ) {}

  async completeStop(completeStopDto: CompleteStopDto): Promise<Run | StopRun> {
    return this.prisma.$transaction(async (tx) => {
      const { runId, stopId, deliveryDriverId } = completeStopDto;

      const run = await this.runDispatchService.findRunById(runId);

      if (run.entregadorId !== deliveryDriverId) {
        throw new BadRequestException(
          'Você não tem permissão para completar esta corrida.',
        );
      }

      const stopToUpdate = run.paradas.find((stop) => stop.id === stopId);

      if (!stopToUpdate) {
        throw new BadRequestException(
          `Parada com ID ${stopId} não encontrada na corrida com ID ${runId}.`,
        );
      }

      if (stopToUpdate?.status !== StatusParada.PENDENTE) {
        throw new BadRequestException(
          `A parada com ID ${stopId} não está pendente e não pode ser concluída.`,
        );
      }

      const updatedStop =
        await this.runExecutionRepository.completeStop(stopId);

      if (!updatedStop) {
        throw new Error(
          `Parada com ID ${stopId} não encontrada ou não atualizada.`,
        );
      }

      await this.orderRepository.updateOrderStatuses(
        [stopToUpdate.pedidoId],
        StatusPedido.CONCLUIDO,
        tx,
      );

      const updatedRun = await this.runDispatchService.findRunById(runId);

      const allStopsCompleted = updatedRun.paradas.every(
        (stop) => stop.status === StatusParada.CONCLUIDA,
      );

      if (allStopsCompleted) {
        await tx.corrida.update({
          where: { id: runId },
          data: { status: StatusCorrida.FINALIZADA },
        });

        const finalizedRun = await this.runDispatchService.findRunById(runId);
        return finalizedRun;
      }

      return updatedStop;
    });
  }
}
