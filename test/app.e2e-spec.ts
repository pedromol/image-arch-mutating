import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      // providers: [{ provide: HttpService, useValue: httpMock }],
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/mutate (POST)', () => {
    return request(app.getHttpServer())
      .post('/mutate')
      .send(require('./mockAdmissionSingle.json'))
      .expect(201)
      .expect(
        '{"apiVersion":"admission.k8s.io/v1","kind":"AdmissionReview","response":{"uid":"c4a40740-b74b-43e4-a401-fbef12c7d2fc","allowed":true}}',
      );
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer()).get('/health').expect(200);
  });
});
