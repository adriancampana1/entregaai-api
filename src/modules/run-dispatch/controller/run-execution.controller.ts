import { Body, Controller, Post } from '@nestjs/common';
import { RunExecutionService } from '../service/run-execution.service';
import { CompleteStopDto } from '../dto/complete-stop.dto';

@Controller('run-execution')
export class RunExecutionController {
  constructor(private readonly runExecutionService: RunExecutionService) {}

  @Post('complete-stop')
  async completeStop(@Body() completeStopDto: CompleteStopDto) {
    return this.runExecutionService.completeStop(completeStopDto);
  }
}
