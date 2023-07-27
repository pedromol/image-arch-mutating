import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { readFileSync } from 'fs';

const certDir = process.env['CERT_DIR'];

const httpsOptions = {
  cert: readFileSync(`${certDir}/tls.crt`),
  ca: readFileSync(`${certDir}/ca.crt`),
  key: readFileSync(`${certDir}/tls.key`),
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { httpsOptions });
  await app.listen(443);
}
bootstrap();
