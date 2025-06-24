import { Controller, Param, Post } from '@nestjs/common';
import { AnotaAiService } from '../service/anota-ai.service';

@Controller('anota-ai')
export class AnotaAiController {
  constructor(private readonly anotaAiService: AnotaAiService) {}

  @Post('list')
  async listOrders(@Param('page') page: number) {
    return this.anotaAiService.fetchAllOrders(page);
  }
}
