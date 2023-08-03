import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { CacheModule } from '../cache/cache.module';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  imports: [CacheModule, TerminusModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
