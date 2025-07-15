import { Injectable, Logger } from '@nestjs/common';
import { RoutesClient } from '@googlemaps/routing';
import { GoogleAuth } from 'google-auth-library';
import {
  TspSolverInput,
  TspSolverOutput,
} from '../interface/tsp-solver.interface';
import * as dayjs from 'dayjs';

interface RouteMatrixElementStatus {
  code: number;
  message?: string;
}

interface RouteMatrixDuration {
  seconds: string;
}

interface RouteMatrixElement {
  originIndex: number;
  destinationIndex: number;
  distanceMeters: number;
  duration?: RouteMatrixDuration;
  status?: RouteMatrixElementStatus;
  isLate: boolean;
}

interface RouteResult {
  originIndex: number;
  destinationIndex: number;
  distanceMeters: number | null;
  durationSeconds: number | null;
  timeMax?: string;
  error?: string;
}

@Injectable()
export class TspSolverService {
  private readonly logger = new Logger(TspSolverService.name);
  private readonly routesClient: RoutesClient;
  private readonly origin: TspSolverInput = {
    waypoints: [
      {
        orderId: 0,
        lat: -23.265772537179835,
        lng: -51.05287288263555,
        timeMax: '',
      },
    ],
  };

  constructor() {
    // Configurar autenticação do Google Cloud se as credenciais estiverem disponíveis
    let auth: GoogleAuth | undefined = undefined;

    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      try {
        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
        auth = new GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        });
      } catch (error) {
        this.logger.warn('Erro ao parsear GOOGLE_SERVICE_ACCOUNT_KEY:', error);
      }
    }

    this.routesClient = new RoutesClient({
      key: process.env.GOOGLE_MAPS_API_KEY,
      auth: auth,
    });
  }

  async calculateRoute(tspInput: TspSolverInput): Promise<TspSolverOutput> {
    /**
     * Adiciona a coordenada do ponto de partida (pizzaria) no início e final da lista de waypoints
     */
    const { waypoints } = tspInput;
    waypoints.unshift(this.origin.waypoints[0]);
    waypoints.push(this.origin.waypoints[0]);

    /**
     * Calcula a matriz de distância e tempo entre as paradas
     */
    const distanceAndTimeMatrix =
      await this.getDistanceAndTimeMatrix(waypoints);
    this.logger.log(
      `Matriz de distância e tempo calculada com sucesso. Total de elementos: ${distanceAndTimeMatrix.length}`,
    );

    /**
     *  Resolve o problema do caixeiro viajante (TSP) usando a matriz de distância e tempo para encontrar a rota mais rápida
     *  entre os pontos de parada, incluindo o ponto de partida (pizzaria) no início e no final da rota
     *  O resultado é uma lista de índices que representam a ordem das paradas otimizadas
     */
    const tspResult = this.solveTsp(distanceAndTimeMatrix, waypoints);
    const optimizedRoutes = tspResult.path.map((routeIndex) =>
      routeIndex === waypoints.length
        ? this.origin.waypoints[0]
        : waypoints[routeIndex],
    );

    return {
      optimizedRoute: tspResult.path,
      optimizedWaypoints: optimizedRoutes,
      totalDistance: tspResult.distance,
      totalDuration: tspResult.duration,
    };
  }

  async getDistanceAndTimeMatrix(waypoints: TspSolverInput['waypoints']) {
    const origins = waypoints.map((point) => ({
      waypoint: {
        location: {
          latLng: {
            latitude: point.lat,
            longitude: point.lng,
          },
        },
      },
    }));
    this.logger.log(
      `Calculando matriz de distância e tempo para ${origins.length} pontos`,
    );

    const destinations = origins.map((origin) => ({
      waypoint: origin.waypoint,
    }));

    try {
      const response = await new Promise<RouteMatrixElement[]>(
        (resolve, reject) => {
          const stream = this.routesClient.computeRouteMatrix(
            {
              origins,
              destinations,
            },
            {
              otherArgs: {
                headers: {
                  'X-Goog-FieldMask': '*',
                },
              },
            },
          );

          const data: RouteMatrixElement[] = [];

          stream.on('data', (chunk) => {
            data.push(chunk);
          });

          stream.on('end', () => {
            resolve(data);
            this.logger.log(
              `Cálculo da matriz de distância e tempo concluído. Total de elementos: ${data.length}`,
            );
          });

          stream.on('error', (err) => {
            reject(err);
          });
        },
      );

      if (!response || !response.length) {
        this.logger.error('Resposta vazia da API de rotas');
        return [];
      }

      const results: RouteResult[] = response.map((element) => {
        const destinationWaypoint = waypoints[element.destinationIndex];

        if (element && element.status && element.status.code === 0) {
          return {
            originIndex: element.originIndex,
            destinationIndex: element.destinationIndex,
            distanceMeters: element.distanceMeters,
            durationSeconds: element.duration
              ? parseInt(element.duration.seconds || '0', 10)
              : 0,
            timeMax: destinationWaypoint.timeMax,
          };
        } else {
          return {
            originIndex: element?.originIndex,
            destinationIndex: element?.destinationIndex,
            distanceMeters: null,
            durationSeconds: null,
            error:
              element?.status?.message || 'Erro ao calcular distância e tempo',
            timeMax: destinationWaypoint.timeMax,
          };
        }
      });
      this.logger.log(
        `Matriz de distância e tempo calculada com sucesso. Total de elementos: ${results.length}`,
      );
      return results;
    } catch (error) {
      this.logger.error(
        'Erro ao calcular a matriz de distância e tempo:',
        error,
      );
      throw new Error('Erro ao calcular a matriz de distância e tempo');
    }
  }

  solveTsp(
    matrixResult: RouteResult[],
    waypoints: TspSolverInput['waypoints'],
  ) {
    const returnPointIndex = 0; // Índice do ponto de partida (pizzaria)
    const LATE_PRIORITY_FACTOR = 0.5; // Fator de prioridade para pedidos atrasados

    let currentIndex = returnPointIndex;
    const tour = [currentIndex];
    const unvisited = new Set<number>();

    for (let i = 0; i < waypoints.length; i++) {
      unvisited.add(i);
    }
    unvisited.delete(currentIndex);

    while (unvisited.size > 0) {
      let bestNext = -1;
      let bestDuration = Infinity;

      for (const candidateIndex of unvisited) {
        const routeElement = matrixResult.find(
          (element) =>
            element.originIndex === currentIndex &&
            element.destinationIndex === candidateIndex,
        );

        if (!routeElement || routeElement.durationSeconds === null) {
          console.warn(
            `Rota não encontrada entre os pontos ${currentIndex} e ${candidateIndex}`,
          );
          continue; // Pula para o próximo candidato se a rota não existir
        }

        let duration = routeElement?.durationSeconds;

        if (dayjs(routeElement.timeMax).isBefore(dayjs())) {
          duration *= LATE_PRIORITY_FACTOR; // Aplica fator de prioridade se o pedido estiver atrasado
        }

        if (duration < bestDuration) {
          bestDuration = duration;
          bestNext = candidateIndex;
        }
      }

      if (bestNext === -1) {
        console.warn(
          `Nenhum próximo ponto encontrado a partir do ponto ${currentIndex}. Pontos não visitados: ${Array.from(unvisited).join(', ')}`,
        );
        break; // Se não houver próximo ponto, sai do loop
      }

      tour.push(bestNext);
      unvisited.delete(bestNext);
      currentIndex = bestNext;
    }

    tour.push(returnPointIndex); // Retorna ao ponto de partida

    const optimizedTour = this.apply2Optimum(tour, matrixResult);

    let totalDistance = 0;
    let totalDuration = 0;

    for (let i = 0; i < optimizedTour.length - 1; i++) {
      const from = optimizedTour[i];
      const to = optimizedTour[i + 1];

      const routeElement = matrixResult.find(
        (element) =>
          element.originIndex === from && element.destinationIndex === to,
      );

      if (routeElement && routeElement.durationSeconds !== null) {
        totalDuration += routeElement.durationSeconds;
      }

      if (routeElement && routeElement.distanceMeters !== null) {
        totalDistance += routeElement.distanceMeters;
      }
    }

    return {
      path: tour,
      distance: totalDistance,
      duration: Number(totalDuration / 60).toFixed(2), // Convertendo segundos para minutos
    };
  }

  apply2Optimum(tour: number[], matrixResult: RouteResult[]) {
    let improved = true;

    const getDuration = (fromIndex: number, toIndex: number): number => {
      const route = matrixResult.find(
        (r) => r.originIndex === fromIndex && r.destinationIndex === toIndex,
      );
      // If route doesn't exist or duration is null, return Infinity to penalize this path
      return route?.durationSeconds ?? Infinity;
    };

    while (improved) {
      improved = false;

      for (let i = 1; i < tour.length - 1; i++) {
        for (let j = i + 1; j < tour.length; j++) {
          const costBeforeSwap =
            getDuration(tour[i], tour[i + 1]) +
            getDuration(tour[j], tour[j + 1]);

          const costAfterSwap =
            getDuration(tour[i], tour[j]) +
            getDuration(tour[i + 1], tour[j + 1]);

          if (costAfterSwap < costBeforeSwap) {
            const segmentToReverse = tour.slice(i + 1, j + 1);
            segmentToReverse.reverse();
            tour.splice(i + 1, segmentToReverse.length, ...segmentToReverse);
            improved = true;
          }
        }
      }
    }
    return tour;
  }
}

/**
 * Exemplo de resposta da API de rotas do Google Maps
 *
 * [
 *   {
 *     originIndex: 0,
 *     destinationIndex: 0,
 *     distanceMeters: 0,
 *     durationSeconds: 0
 *   },
 *   {
 *     originIndex: 1,
 *     destinationIndex: 1,
 *     distanceMeters: 0,
 *     durationSeconds: 0
 *   },
 *   {
 *     originIndex: 1,
 *     destinationIndex: 0,
 *     distanceMeters: 2548,
 *     durationSeconds: 356
 *   },
 *   {
 *     originIndex: 0,
 *     destinationIndex: 1,
 *     distanceMeters: 2687,
 *     durationSeconds: 344
 *   }
 * ]
 */
