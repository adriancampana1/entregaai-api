import { Module } from '@nestjs/common';
import { StatisticsController } from './controller/statistics.controller';
import { StatisticsService } from './service/statistics.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [StatisticsController],
  providers: [StatisticsService],
})
export class StatisticsModule {}
