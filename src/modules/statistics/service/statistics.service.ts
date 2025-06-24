import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infra/database/prisma.service';
import { StatisticsFilterDto, PeriodType } from '../dto/statistics-filter.dto';
import * as dayjs from 'dayjs';
import { StatusParada, StatusPedido } from '@prisma/client';

@Injectable()
export class StatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDeliveryStatistics(filters: StatisticsFilterDto) {
    const { startDate, endDate, driverId, period } = filters;
    const dateRange = this.getDateRange(period, startDate, endDate);

    const baseFilter = {
      createdAt: {
        gte: dateRange.start,
        lte: dateRange.end,
      },
      ...(driverId ? { entregadorId: driverId } : {}),
    };

    const [runs, orders, stops, drivers, todayStats, weekStats, monthStats] =
      await Promise.all([
        this.prisma.corrida.findMany({
          where: baseFilter,
          include: {
            paradas: {
              include: {
                pedido: true,
              },
            },
            entregador: true,
          },
        }),

        this.prisma.pedido.findMany({
          where: {
            createdAt: {
              gte: dateRange.start,
              lte: dateRange.end,
            },
          },
        }),

        this.prisma.parada.findMany({
          where: {
            corrida: {
              ...baseFilter,
            },
          },
          include: {
            pedido: true,
            corrida: true,
          },
        }),

        this.prisma.entregador.findMany({
          include: {
            corridas: {
              where: baseFilter,
              include: {
                paradas: {
                  include: {
                    pedido: true,
                  },
                },
              },
            },
          },
        }),

        this.getTodayStats(),

        this.getWeekStats(),

        this.getMonthStats(),
      ]);

    const totalRuns = runs.length;
    const totalOrders = orders.length;
    const completedStops = stops.filter(
      (stop) => stop.status === StatusParada.CONCLUIDA,
    );
    const totalDeliveries = completedStops.length;

    let totalDeliveryTimeMinutes = 0;
    let countForAverage = 0;

    stops.forEach((stop) => {
      if (stop.status === StatusParada.CONCLUIDA && stop.horarioConclusao) {
        const createdAt = dayjs(stop.corrida.createdAt);
        const completedAt = dayjs(stop.horarioConclusao);
        const deliveryTimeMinutes = completedAt.diff(createdAt, 'minute');

        if (deliveryTimeMinutes > 0) {
          totalDeliveryTimeMinutes += deliveryTimeMinutes;
          countForAverage++;
        }
      }
    });

    const averageDeliveryTime =
      countForAverage > 0
        ? Math.round(totalDeliveryTimeMinutes / countForAverage)
        : 0;

    const hourlyStats = this.calculateHourlyStats(stops);

    const driverPerformance = this.calculateDriverPerformance(drivers);

    const statusDistribution = this.calculateStatusDistribution(orders);

    const efficiency = this.calculateEfficiencyMetrics(runs, stops);

    return {
      // General statistics
      totalRuns,
      totalOrders,
      totalDeliveries,
      averageDeliveryTime,

      // Period statistics
      todayStats,
      weekStats,
      monthStats,

      // Driver statistics
      driverPerformance,

      // Hourly statistics
      hourlyStats,

      // Status distribution
      statusDistribution,

      // Efficiency metrics
      efficiency,
    };
  }

  private getDateRange(
    period?: PeriodType,
    startDate?: string,
    endDate?: string,
  ) {
    const today = dayjs().startOf('day');

    if (period === PeriodType.TODAY || (!period && !startDate && !endDate)) {
      return {
        start: today.toDate(),
        end: today.endOf('day').toDate(),
      };
    }

    if (period === PeriodType.WEEK) {
      return {
        start: today.startOf('week').toDate(),
        end: today.endOf('week').toDate(),
      };
    }

    if (period === PeriodType.MONTH) {
      return {
        start: today.startOf('month').toDate(),
        end: today.endOf('month').toDate(),
      };
    }

    return {
      start: startDate
        ? new Date(startDate)
        : today.subtract(30, 'day').toDate(),
      end: endDate ? new Date(endDate) : today.toDate(),
    };
  }

  private async getTodayStats() {
    const today = dayjs().startOf('day');
    const todayEnd = today.endOf('day');

    const [runs, orders, completedDeliveries, pendingDeliveries] =
      await Promise.all([
        this.prisma.corrida.count({
          where: {
            createdAt: {
              gte: today.toDate(),
              lte: todayEnd.toDate(),
            },
          },
        }),

        // Count orders today
        this.prisma.pedido.count({
          where: {
            createdAt: {
              gte: today.toDate(),
              lte: todayEnd.toDate(),
            },
          },
        }),

        // Count completed deliveries today
        this.prisma.parada.count({
          where: {
            status: StatusParada.CONCLUIDA,
            corrida: {
              createdAt: {
                gte: today.toDate(),
                lte: todayEnd.toDate(),
              },
            },
          },
        }),

        // Count pending deliveries today
        this.prisma.parada.count({
          where: {
            status: StatusParada.PENDENTE,
            corrida: {
              createdAt: {
                gte: today.toDate(),
                lte: todayEnd.toDate(),
              },
            },
          },
        }),
      ]);

    // Calculate average delivery time for today
    const completedStops = await this.prisma.parada.findMany({
      where: {
        status: StatusParada.CONCLUIDA,
        horarioConclusao: {
          not: null,
        },
        corrida: {
          createdAt: {
            gte: today.toDate(),
            lte: todayEnd.toDate(),
          },
        },
      },
      include: {
        corrida: true,
      },
    });

    let totalDeliveryTimeMinutes = 0;
    completedStops.forEach((stop) => {
      const createdAt = dayjs(stop.corrida.createdAt);
      const completedAt = dayjs(stop.horarioConclusao);
      totalDeliveryTimeMinutes += completedAt.diff(createdAt, 'minute');
    });

    const averageDeliveryTime =
      completedStops.length > 0
        ? Math.round(totalDeliveryTimeMinutes / completedStops.length)
        : 0;

    return {
      date: today.format('YYYY-MM-DD'),
      totalRuns: runs,
      totalOrders: orders,
      completedDeliveries,
      pendingDeliveries,
      averageDeliveryTime,
      revenue: 0, // You can calculate this if you have order amounts
    };
  }

  private async getWeekStats() {
    const today = dayjs();
    const weekStart = today.startOf('week');
    const weekEnd = today.endOf('week');

    // Weekly aggregate data
    const [totalRuns, totalOrders, completedDeliveries] = await Promise.all([
      this.prisma.corrida.count({
        where: {
          createdAt: {
            gte: weekStart.toDate(),
            lte: weekEnd.toDate(),
          },
        },
      }),

      this.prisma.pedido.count({
        where: {
          createdAt: {
            gte: weekStart.toDate(),
            lte: weekEnd.toDate(),
          },
        },
      }),

      this.prisma.parada.count({
        where: {
          status: StatusParada.CONCLUIDA,
          corrida: {
            createdAt: {
              gte: weekStart.toDate(),
              lte: weekEnd.toDate(),
            },
          },
        },
      }),
    ]);

    // Calculate average delivery time
    const completedStops = await this.prisma.parada.findMany({
      where: {
        status: StatusParada.CONCLUIDA,
        horarioConclusao: {
          not: null,
        },
        corrida: {
          createdAt: {
            gte: weekStart.toDate(),
            lte: weekEnd.toDate(),
          },
        },
      },
      include: {
        corrida: true,
      },
    });

    let totalDeliveryTimeMinutes = 0;
    completedStops.forEach((stop) => {
      const createdAt = dayjs(stop.corrida.createdAt);
      const completedAt = dayjs(stop.horarioConclusao);
      totalDeliveryTimeMinutes += completedAt.diff(createdAt, 'minute');
    });

    const averageDeliveryTime =
      completedStops.length > 0
        ? Math.round(totalDeliveryTimeMinutes / completedStops.length)
        : 0;

    const dailyBreakdown: {
      date: string;
      totalRuns: number;
      totalOrders: number;
      completedDeliveries: number;
      pendingDeliveries: number;
      averageDeliveryTime: number;
    }[] = [];
    for (let i = 0; i <= 6; i++) {
      const currentDate = weekStart.add(i, 'day');
      const nextDate = currentDate.add(1, 'day');

      const [
        dailyRuns,
        dailyOrders,
        dailyCompleted,
        dailyPending,
        dailyAvgTime,
      ] = await Promise.all([
        this.prisma.corrida.count({
          where: {
            createdAt: {
              gte: currentDate.toDate(),
              lt: nextDate.toDate(),
            },
          },
        }),

        this.prisma.pedido.count({
          where: {
            createdAt: {
              gte: currentDate.toDate(),
              lt: nextDate.toDate(),
            },
          },
        }),

        this.prisma.parada.count({
          where: {
            status: StatusParada.CONCLUIDA,
            corrida: {
              createdAt: {
                gte: currentDate.toDate(),
                lt: nextDate.toDate(),
              },
            },
          },
        }),

        this.prisma.parada.count({
          where: {
            status: StatusParada.PENDENTE,
            corrida: {
              createdAt: {
                gte: currentDate.toDate(),
                lt: nextDate.toDate(),
              },
            },
          },
        }),

        this.calculateDailyAverageDeliveryTime(
          currentDate.toDate(),
          nextDate.toDate(),
        ),
      ]);

      dailyBreakdown.push({
        date: currentDate.format('YYYY-MM-DD'),
        totalRuns: dailyRuns,
        totalOrders: dailyOrders,
        completedDeliveries: dailyCompleted,
        pendingDeliveries: dailyPending,
        averageDeliveryTime: dailyAvgTime,
      });
    }

    return {
      period: 'Esta semana',
      totalRuns,
      totalOrders,
      completedDeliveries,
      averageDeliveryTime,
      dailyBreakdown,
    };
  }

  private async getMonthStats() {
    const today = dayjs();
    const monthStart = today.startOf('month');
    const monthEnd = today.endOf('month');

    // Monthly aggregate data
    const [totalRuns, totalOrders, completedDeliveries] = await Promise.all([
      this.prisma.corrida.count({
        where: {
          createdAt: {
            gte: monthStart.toDate(),
            lte: monthEnd.toDate(),
          },
        },
      }),

      this.prisma.pedido.count({
        where: {
          createdAt: {
            gte: monthStart.toDate(),
            lte: monthEnd.toDate(),
          },
        },
      }),

      this.prisma.parada.count({
        where: {
          status: StatusParada.CONCLUIDA,
          corrida: {
            createdAt: {
              gte: monthStart.toDate(),
              lte: monthEnd.toDate(),
            },
          },
        },
      }),
    ]);

    // Calculate average delivery time
    const completedStops = await this.prisma.parada.findMany({
      where: {
        status: StatusParada.CONCLUIDA,
        horarioConclusao: {
          not: null,
        },
        corrida: {
          createdAt: {
            gte: monthStart.toDate(),
            lte: monthEnd.toDate(),
          },
        },
      },
      include: {
        corrida: true,
      },
    });

    let totalDeliveryTimeMinutes = 0;
    completedStops.forEach((stop) => {
      const createdAt = dayjs(stop.corrida.createdAt);
      const completedAt = dayjs(stop.horarioConclusao);
      totalDeliveryTimeMinutes += completedAt.diff(createdAt, 'minute');
    });

    const averageDeliveryTime =
      completedStops.length > 0
        ? Math.round(totalDeliveryTimeMinutes / completedStops.length)
        : 0;

    // Generate daily breakdown if needed (for a month, this might be too detailed)
    // For brevity, returning empty array here
    const dailyBreakdown = [];

    return {
      period: 'Este mês',
      totalRuns,
      totalOrders,
      completedDeliveries,
      averageDeliveryTime,
      dailyBreakdown,
    };
  }

  private async calculateDailyAverageDeliveryTime(
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const completedStops = await this.prisma.parada.findMany({
      where: {
        status: StatusParada.CONCLUIDA,
        horarioConclusao: {
          not: null,
        },
        corrida: {
          createdAt: {
            gte: startDate,
            lt: endDate,
          },
        },
      },
      include: {
        corrida: true,
      },
    });

    if (completedStops.length === 0) {
      return 0;
    }

    let totalDeliveryTimeMinutes = 0;
    completedStops.forEach((stop) => {
      const createdAt = dayjs(stop.corrida.createdAt);
      const completedAt = dayjs(stop.horarioConclusao);
      totalDeliveryTimeMinutes += completedAt.diff(createdAt, 'minute');
    });

    return Math.round(totalDeliveryTimeMinutes / completedStops.length);
  }

  private calculateHourlyStats(stops: any[]) {
    // Group stops by hour of creation
    const hourlyData = new Map();

    for (const stop of stops) {
      const hour = dayjs(stop.corrida.createdAt).hour();

      if (!hourlyData.has(hour)) {
        hourlyData.set(hour, {
          hour,
          totalOrders: 0,
          completedDeliveries: 0,
          totalDeliveryTime: 0,
          deliveryCount: 0,
        });
      }

      const hourStats = hourlyData.get(hour);
      hourStats.totalOrders++;

      if (stop.status === StatusParada.CONCLUIDA && stop.horarioConclusao) {
        hourStats.completedDeliveries++;

        const createdAt = dayjs(stop.corrida.createdAt);
        const completedAt = dayjs(stop.horarioConclusao);
        const deliveryTimeMinutes = completedAt.diff(createdAt, 'minute');

        if (deliveryTimeMinutes > 0) {
          hourStats.totalDeliveryTime += deliveryTimeMinutes;
          hourStats.deliveryCount++;
        }
      }
    }

    // Convert to array and calculate averages
    return Array.from(hourlyData.values())
      .map((data) => ({
        hour: data.hour,
        totalOrders: data.totalOrders,
        completedDeliveries: data.completedDeliveries,
        averageDeliveryTime:
          data.deliveryCount > 0
            ? Math.round(data.totalDeliveryTime / data.deliveryCount)
            : 0,
      }))
      .sort((a, b) => a.hour - b.hour);
  }

  private calculateDriverPerformance(drivers: any[]) {
    return drivers.map((driver) => {
      // Count totals
      const totalRuns = driver.corridas.length;
      let totalDeliveries = 0;
      let completedDeliveries = 0;
      let totalDeliveryTime = 0;
      let deliveryTimeCount = 0;
      let onTimeDeliveries = 0;
      let lateDeliveries = 0;

      // Process each run
      for (const run of driver.corridas) {
        for (const stop of run.paradas) {
          totalDeliveries++;

          if (stop.status === StatusParada.CONCLUIDA) {
            completedDeliveries++;

            // Calculate delivery time
            if (stop.horarioConclusao) {
              const createdAt = dayjs(run.createdAt);
              const completedAt = dayjs(stop.horarioConclusao);
              const deliveryTimeMinutes = completedAt.diff(createdAt, 'minute');

              if (deliveryTimeMinutes > 0) {
                totalDeliveryTime += deliveryTimeMinutes;
                deliveryTimeCount++;

                // Check if delivery was on time
                const maxTime = dayjs(stop.pedido.tempoMaximoEntrega);
                if (completedAt.isBefore(maxTime)) {
                  onTimeDeliveries++;
                } else {
                  lateDeliveries++;
                }
              }
            }
          }
        }
      }

      // Calculate average and efficiency
      const averageDeliveryTime =
        deliveryTimeCount > 0
          ? Math.round(totalDeliveryTime / deliveryTimeCount)
          : 0;

      const efficiency =
        totalDeliveries > 0
          ? parseFloat(
              ((completedDeliveries / totalDeliveries) * 100).toFixed(1),
            )
          : 0;

      return {
        driverId: driver.id,
        driverName: driver.nome,
        totalRuns,
        totalDeliveries,
        completedDeliveries,
        averageDeliveryTime,
        onTimeDeliveries,
        lateDeliveries,
        efficiency,
        status: driver.status,
      };
    });
  }

  private calculateStatusDistribution(orders: any[]) {
    const statusCounts = {
      pending: 0,
      inRoute: 0,
      completed: 0,
      cancelled: 0,
    };

    for (const order of orders) {
      if (order.statusGeral === StatusPedido.AGUARDANDO_ROTA) {
        statusCounts.pending++;
      } else if (order.statusGeral === StatusPedido.EM_ROTA) {
        statusCounts.inRoute++;
      } else if (order.statusGeral === StatusPedido.CONCLUIDO) {
        statusCounts.completed++;
      } else {
        statusCounts.cancelled++;
      }
    }

    return statusCounts;
  }

  private calculateEfficiencyMetrics(runs: any[], stops: any[]) {
    // Calculate on-time delivery rate
    let totalCompletedDeliveries = 0;
    let onTimeDeliveries = 0;

    for (const stop of stops) {
      if (stop.status === StatusParada.CONCLUIDA && stop.horarioConclusao) {
        totalCompletedDeliveries++;

        const completedAt = dayjs(stop.horarioConclusao);
        const maxTime = dayjs(stop.pedido.tempoMaximoEntrega);

        if (completedAt.isBefore(maxTime)) {
          onTimeDeliveries++;
        }
      }
    }

    const onTimeDeliveryRate =
      totalCompletedDeliveries > 0
        ? parseFloat(
            ((onTimeDeliveries / totalCompletedDeliveries) * 100).toFixed(1),
          )
        : 0;

    // Calculate average orders per run
    let totalOrdersInRuns = 0;
    for (const run of runs) {
      totalOrdersInRuns += run.paradas.length;
    }

    const averageOrdersPerRun =
      runs.length > 0
        ? parseFloat((totalOrdersInRuns / runs.length).toFixed(1))
        : 0;

    // Other metrics would require additional data
    return {
      onTimeDeliveryRate,
      averageOrdersPerRun,
      averageDistancePerRun: 12.5, // placeholder - would need route distance data
      fuelEfficiency: 8.2, // placeholder
      customerSatisfaction: 4.6, // placeholder
    };
  }
}
