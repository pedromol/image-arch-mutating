import { Module } from '@nestjs/common';
import { MutateController } from './mutate.controller';
import { MutateService } from './mutate.service';
import { HttpModule } from '@nestjs/axios';
import { LoggerModule } from 'src/logger/logger.module';
import { CacheModule } from 'src/cache/cache.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [LoggerModule, CacheModule, HttpModule, ConfigModule],
  controllers: [MutateController],
  providers: [MutateService],
})
export class MutateModule { }
