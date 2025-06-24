import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RunDispatchService } from '../service/run-dispatch.service';
import { CreateRunDispatchDto } from '../dto/create-run-dispatch.dto';
import { Run, RunWithRouteDetails } from '../interface/run';
import { Roles } from 'src/modules/auth/decorator/roles.decorator';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt.guard';
import { RoleGuard } from 'src/modules/auth/guards/role.guard';
import { FilterRunsDto } from '../dto/filter-runs.dto';

@Controller('run-dispatch')
@UseGuards(JwtAuthGuard, RoleGuard)
export class RunDispatchController {
  constructor(private readonly runDispatchService: RunDispatchService) {}

  @Post()
  @Roles('admin')
  async createRunDispatch(
    @Body() createRunDispatch: CreateRunDispatchDto,
  ): Promise<RunWithRouteDetails> {
    return this.runDispatchService.createRun(createRunDispatch);
  }

  @Get()
  @Roles('admin')
  async findAllRuns(@Query() filterRunsDto: FilterRunsDto): Promise<Run[]> {
    return this.runDispatchService.findAllRuns(filterRunsDto);
  }

  @Get(':deliveryDriver')
  async findAllRunsByDeliveryDriver(
    @Param('deliveryDriver') deliveryDriverId: string,
    @Query() filterRunsDto: FilterRunsDto,
  ): Promise<Run[]> {
    return this.runDispatchService.findAllRunsByDeliveryDriver(
      Number(deliveryDriverId),
      filterRunsDto,
    );
  }

  @Get(':deliveryDriver/:runId')
  async findRunById(@Param('runId') runId: string): Promise<Run> {
    return this.runDispatchService.findRunById(Number(runId));
  }
}
