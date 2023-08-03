import { Module } from '@nestjs/common';
import { MutateModule } from './mutate/mutate.module';
import { LoggerModule } from './logger/logger.module';
import { ConfigModule } from './config/config.module';
import { HealthModule } from './health/health.module';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [ConfigModule, LoggerModule, HealthModule, MutateModule, PrometheusModule.register()],
})
export class AppModule { }
