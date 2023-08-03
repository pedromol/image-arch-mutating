import { Module } from '@nestjs/common';
import { MutateModule } from './mutate/mutate.module';
import { LoggerModule } from './logger/logger.module';
import { ConfigModule } from './config/config.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [ConfigModule, LoggerModule, HealthModule, MutateModule],
})
export class AppModule { }
