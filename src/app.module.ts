import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './shared/infra/database/prisma.module';
import { AnotaAiModule } from './modules/anota-ai/anota-ai.module';
import { DeliveryDriversModule } from './modules/delivery-drivers/delivery-drivers.module';
import { OrdersModule } from './modules/orders/orders.module';
import { RunDispatchModule } from './modules/run-dispatch/run-dispatch.module';
import { TspSolverModule } from './modules/tsp-solver/tsp-solver.module';
import { LoggerModule } from 'pino-nestjs';
import { AuthModule } from './modules/auth/auth.module';
import { StatisticsModule } from './modules/statistics/statistics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
            singleLine: true,
          },
        },
        level: process.env.LOG_LEVEL ?? 'info',
      },
    }),
    PrismaModule,
    AnotaAiModule,
    OrdersModule,
    DeliveryDriversModule,
    RunDispatchModule,
    TspSolverModule,
    AuthModule,
    StatisticsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
