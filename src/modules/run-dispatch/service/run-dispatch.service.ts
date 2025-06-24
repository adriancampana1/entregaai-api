import { BadRequestException, Injectable } from '@nestjs/common';
import { RunDispatchRepository } from '../repository/run-dispatch';
import { CreateRunDispatchDto } from '../dto/create-run-dispatch.dto';
import { Run, RunWithRouteDetails } from '../interface/run';
import { DeliveryDriverService } from 'src/modules/delivery-drivers/service/delivery-driver.service';
import { OrderService } from 'src/modules/orders/service/order.service';
import { PrismaService } from 'src/shared/infra/database/prisma.service';
import { CreateStopDto } from '../dto/create-stop.dto';
import { StatusCorrida, StatusParada, StatusPedido } from '@prisma/client';
import { OrderRepository } from 'src/modules/orders/repository/order.repository';
import { TspSolverService } from '../../tsp-solver/service/tsp-solver.service';
import { TspSolverInput } from 'src/modules/tsp-solver/interface/tsp-solver.interface';
import { RunExecutionRepository } from '../repository/run-execution';
import { FilterRunsDto } from '../dto/filter-runs.dto';

@Injectable()
export class RunDispatchService {
  constructor(
    private readonly runDispatchRepository: RunDispatchRepository,
    private readonly runExecutionRepository: RunExecutionRepository,
    private readonly deliveryDriverService: DeliveryDriverService,
    private readonly tspSolverService: TspSolverService,
    private readonly orderService: OrderService,
    private readonly orderRepository: OrderRepository,
    private readonly prisma: PrismaService,
  ) {}

  async createRun(
    createRunDispatchDto: CreateRunDispatchDto,
  ): Promise<RunWithRouteDetails> {
    const { deliveryDriverId, orderIds } = createRunDispatchDto;

    const deliveryDriver =
      await this.deliveryDriverService.findDeliveryDriverById(deliveryDriverId);
    if (deliveryDriver?.status !== 'ATIVO') {
      throw new BadRequestException(
        `O entregador com ID ${deliveryDriverId} está inativo.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const run = await this.runDispatchRepository.createRun(
        StatusCorrida.EM_ANDAMENTO,
        deliveryDriverId,
        tx,
      );

      if (!run) {
        throw new BadRequestException('Falha ao criar corrida');
      }

      const orders = await this.orderService.findOrdersByIds(orderIds);

      orders.map((order) => {
        if (order.statusGeral !== StatusPedido.AGUARDANDO_ROTA) {
          throw new BadRequestException(`
            Pedido com ID ${order.id} não está no status adequado para ser adicionado à corrida.`);
        }
      });

      let stopsDto: CreateStopDto[] = [];
      let routeDetails = {
        totalDistance: 0,
        totalDuration: '0',
        optimizedSequence: [] as number[],
      };

      if (orders.length > 0) {
        const tspInputWaypoints: TspSolverInput = {
          waypoints: orders.map((order) => ({
            orderId: order.id,
            lat: order.latitude,
            lng: order.longitude,
            timeMax: order.tempoMaximoEntrega,
          })),
        };

        const optimizedRouteResult =
          await this.tspSolverService.calculateRoute(tspInputWaypoints);

        routeDetails = {
          totalDistance: optimizedRouteResult.totalDistance,
          totalDuration: optimizedRouteResult.totalDuration,
          optimizedSequence: optimizedRouteResult.optimizedRoute
            .slice(1, -1)
            .map((index) => {
              return index > 0 && index < tspInputWaypoints.waypoints.length - 1
                ? tspInputWaypoints.waypoints[index].orderId
                : 0;
            })
            .filter((id) => id !== 0),
        };

        const mutatedWaypointsArray = tspInputWaypoints.waypoints;
        const lengthOfMutatedArray = mutatedWaypointsArray.length;

        const intermediatePathIndices =
          optimizedRouteResult.optimizedRoute.slice(1, -1);

        stopsDto = intermediatePathIndices
          .filter(
            (waypointIndex) =>
              waypointIndex > 0 && waypointIndex < lengthOfMutatedArray - 1,
          )
          .map((actualOrderWaypointIndex, indexInFilteredSequence) => {
            const orderForStop =
              mutatedWaypointsArray[actualOrderWaypointIndex];

            return {
              corridaId: run.id,
              pedidoId: orderForStop.orderId,
              status: StatusParada.PENDENTE,
              ordem: indexInFilteredSequence + 1,
            };
          });
      } else {
        stopsDto = orders.map((order, index) => ({
          corridaId: run.id,
          ordem: index + 1,
          status: StatusParada.PENDENTE,
          pedidoId: order.id,
        }));
      }

      await this.runExecutionRepository.createStops(stopsDto, tx);

      await this.orderRepository.updateOrderStatuses(
        orderIds,
        StatusPedido.EM_ROTA,
        tx,
      );

      const runWithRelations = await this.runDispatchRepository.findRunById(
        run.id,
        tx,
      );

      if (!runWithRelations) {
        throw new BadRequestException('Corrida não encontrada após criação');
      }

      return {
        run: runWithRelations,
        routeDetails,
      };
    });
  }

  async findAllRuns(filterRunsDto?: FilterRunsDto): Promise<Run[]> {
    const { startDate, endDate } = filterRunsDto || {};

    let startDateTime: Date | undefined;
    let endDateTime: Date | undefined;

    // Se não há filtros específicos, usa a lógica do dia atual + próximo até 3h
    if (!startDate && !endDate) {
      const { startDate: defaultStart, endDate: defaultEnd } =
        this.getDateRangeForDailyRuns();
      startDateTime = defaultStart;
      endDateTime = defaultEnd;
    } else {
      if (startDate) {
        startDateTime = new Date(startDate);
      }

      if (endDate) {
        endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
      }
    }

    const runs = await this.runDispatchRepository.findAllRuns(
      startDateTime,
      endDateTime,
    );
    return runs;
  }

  async findAllRunsByDeliveryDriver(
    deliveryDriverId: number,
    filterRunsDto?: FilterRunsDto,
  ): Promise<Run[]> {
    const { startDate, endDate } = filterRunsDto || {};

    let startDateTime: Date | undefined;
    let endDateTime: Date | undefined;

    // Se não há filtros específicos, usa a lógica do dia atual + próximo até 3h
    if (!startDate && !endDate) {
      const { startDate: defaultStart, endDate: defaultEnd } =
        this.getDateRangeForDailyRuns();
      startDateTime = defaultStart;
      endDateTime = defaultEnd;
    } else {
      if (startDate) {
        startDateTime = new Date(startDate);
      }

      if (endDate) {
        endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
      }
    }

    const runs = await this.runDispatchRepository.findAllRunsByDeliveryDriver(
      deliveryDriverId,
      startDateTime,
      endDateTime,
    );

    return runs;
  }

  async findRunById(id: number): Promise<Run> {
    if (!id) {
      throw new BadRequestException('ID da corrida não pode ser vazio.');
    }
    const run = await this.runDispatchRepository.findRunById(id);
    if (!run) {
      throw new BadRequestException(`Corrida com ID ${id} não encontrada.`);
    }
    return run;
  }

  /**
   * Retorna o intervalo de datas para buscar corridas do dia atual e do próximo até as 3h da manhã
   * Exemplo: Se hoje é 23/06, busca corridas de 23/06 00:00 até 24/06 03:00
   */
  private getDateRangeForDailyRuns(): { startDate: Date; endDate: Date } {
    const now = new Date();

    // Se for antes das 3h da manhã, considera que ainda é o "dia anterior"
    // para fins de busca de corridas
    const startDate = new Date();
    if (now.getHours() < 3) {
      // Se são 2h da manhã do dia 24, busca corridas do dia 23
      startDate.setDate(now.getDate() - 1);
    }
    startDate.setHours(0, 0, 0, 0);

    // Data final: próximo dia às 3h da manhã
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);
    endDate.setHours(3, 0, 0, 0);

    return { startDate, endDate };
  }
}
