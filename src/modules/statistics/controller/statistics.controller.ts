import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { StatisticsService } from '../service/statistics.service';
import { StatisticsFilterDto } from '../dto/statistics-filter.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { RoleGuard } from '../../auth/guards/role.guard';
import { Roles } from '../../auth/decorator/roles.decorator';

@Controller('statistics')
@UseGuards(JwtAuthGuard, RoleGuard)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('delivery')
  @Roles('admin')
  async getDeliveryStatistics(@Query() filter: StatisticsFilterDto) {
    return this.statisticsService.getDeliveryStatistics(filter);
  }
}
