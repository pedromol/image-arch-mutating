import { LoggerService, Module } from '@nestjs/common';
import * as CacheManager from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';
import { LoggerModule } from '../logger/logger.module';
import StaticLogger from '../logger/logger.static';

@Module({
  imports: [
    CacheManager.CacheModule.registerAsync({
      imports: [ConfigModule, LoggerModule],
      inject: [ConfigService],
      useFactory: async (
        configService: ConfigService,
        loggerService: LoggerService,
      ) =>
        ({
          store:
            configService.get('REDIS_ENABLED') === 'true'
              ? await redisStore({
                url: `redis://${configService.get('REDIS_HOST')}:${configService.get('REDIS_PORT')}`,
                ttl: configService.get('CACHE_TTL'),
              })
              : 'memory',
          ttl: configService.get('CACHE_TTL'),
        }),
    }),
  ],
  exports: [CacheModule, CacheManager.CacheModule],
})
export class CacheModule {}
