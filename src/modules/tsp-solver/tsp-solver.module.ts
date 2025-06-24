import { Module } from '@nestjs/common';
import { TspSolverService } from './service/tsp-solver.service';

@Module({
  providers: [TspSolverService],
  exports: [TspSolverService],
})
export class TspSolverModule {}
