import { Module } from '@nestjs/common';
import { IncomingMessage } from 'http';
import * as Pino from 'nestjs-pino';
import { Logger } from 'nestjs-pino';

@Module({
  imports: [
    Pino.LoggerModule.forRoot({
      pinoHttp: {
        autoLogging: {
          ignore: (req: IncomingMessage) => req?.url == '/health',
        },
      },
    }),
  ],
  providers: [Logger],
  exports: [Logger],
})
export class LoggerModule {}
