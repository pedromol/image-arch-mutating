import { Module } from '@nestjs/common';
import * as Pino from 'nestjs-pino';
import { Logger } from 'nestjs-pino';

@Module({
  imports: [Pino.LoggerModule.forRoot()],
  providers: [Logger],
  exports: [Logger],
})
export class LoggerModule {}
