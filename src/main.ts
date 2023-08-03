import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { readFileSync } from 'fs';
import { Logger, PinoLogger } from 'nestjs-pino';

const certDir = process.env['CERT_DIR'] ?? '/etc/opt';

const httpsOptions = {
  cert: readFileSync(`${certDir}/tls.crt`),
  ca: readFileSync(`${certDir}/ca.crt`),
  key: readFileSync(`${certDir}/tls.key`),
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new Logger(new PinoLogger({}), {}),
    httpsOptions,
  });
  app.useLogger(app.get(Logger));
  await app.listen(443);
}
bootstrap();
