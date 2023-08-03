import { LoggerService, Module } from '@nestjs/common';
import * as CacheManager from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';
import { LoggerModule } from '../logger/logger.module';
import StaticLogger from '../logger/logger.static';

@Module({
  imports: [
    CacheManager.CacheModule.registerAsync({
      imports: [ConfigModule, LoggerModule],
      inject: [ConfigService],
      useFactory: (
        configService: ConfigService,
        loggerService: LoggerService,
      ) => ({
        store:
          configService.get('REDIS_ENABLED') === 'true' ? redisStore : 'memory',
        host: configService.get('REDIS_HOST'),
        port: configService.get('REDIS_PORT'),
        ttl: 3,
        retry_strategy: (options): number => {
          loggerService.error({ context: 'CacheModule', ...options });

          if (options.attempt > 4) {
            StaticLogger.logAndExit('CacheModule', options);
          }
          return options.attempt * 1000;
        },
      }) as any,
    }),
  ],
  exports: [CacheModule, CacheManager.CacheModule],
})
export class CacheModule {}
