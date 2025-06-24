import { Module } from '@nestjs/common';
import { AnotaAiController } from './controller/anota-ai.controller';
import { AnotaAiService } from './service/anota-ai.service';
import { HttpModule } from '@nestjs/axios';
import { OrdersModule } from '../orders/orders.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [HttpModule, OrdersModule, AuthModule],
  controllers: [AnotaAiController],
  providers: [AnotaAiService],
})
export class AnotaAiModule {}
