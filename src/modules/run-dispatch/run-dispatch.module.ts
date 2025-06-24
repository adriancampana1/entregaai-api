import { Module } from '@nestjs/common';
import { RunDispatchRepository } from './repository/run-dispatch';
import { RunDispatchService } from './service/run-dispatch.service';
import { RunDispatchController } from './controller/run-dispatch.controller';
import { DeliveryDriversModule } from '../delivery-drivers/delivery-drivers.module';
import { OrdersModule } from '../orders/orders.module';
import { TspSolverModule } from '../tsp-solver/tsp-solver.module';
import { RunExecutionRepository } from './repository/run-execution';
import { RunExecutionService } from './service/run-execution.service';
import { RunExecutionController } from './controller/run-execution.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DeliveryDriversModule, OrdersModule, TspSolverModule, AuthModule],
  providers: [
    RunDispatchRepository,
    RunDispatchService,
    RunExecutionRepository,
    RunExecutionService,
  ],
  controllers: [RunDispatchController, RunExecutionController],
  exports: [],
})
export class RunDispatchModule {}
