import { Module } from '@nestjs/common';
import * as CacheManager from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';

@Module({
  imports: [
    CacheManager.CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (
        configService: ConfigService,
      ) => ({
        store:
          configService.get('REDIS_ENABLED') === 'true'
            ? await redisStore({
              url: `redis://${configService.get(
                'REDIS_HOST',
              )}:${configService.get('REDIS_PORT')}`,
              ttl: configService.get('CACHE_TTL'),
            })
            : 'memory',
        ttl: configService.get('CACHE_TTL'),
      }),
    }),
  ],
  exports: [CacheModule, CacheManager.CacheModule],
})
export class CacheModule { }
