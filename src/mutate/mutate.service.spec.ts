import { Test, TestingModule } from '@nestjs/testing';
import { MutateService } from './mutate.service';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { LoggerModule } from '../logger/logger.module';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';

describe('MutateService', () => {
  let mutateService: MutateService;
  let mockedResponse;

  const httpMock = {
    get: jest.fn().mockImplementation((i) => of(mockedResponse(i))),
  };

  function expectedResponse(patch: any): any {
    return {
      apiVersion: 'admission.k8s.io/v1',
      kind: 'AdmissionReview',
      response: {
        allowed: true,
        patch: Buffer.from(JSON.stringify(patch)).toString('base64'),
        patchType: 'JSONPatch',
        uid: 'c4a40740-b74b-43e4-a401-fbef12c7d2fc',
      },
    };
  }

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [{ provide: HttpService, useValue: httpMock }, MutateService],
      imports: [LoggerModule, CacheModule.register({}), ConfigModule],
    }).compile();

    mutateService = app.get<MutateService>(MutateService);
  });

  describe('Service', () => {
    it('should return a single arch', async () => {
      mockedResponse = () => ({
        data: { architectures: ['linux/mockedArch'] },
      });
      const expected = expectedResponse([
        {
          op: 'add',
          path: '/spec/affinity',
          value: {
            nodeAffinity: {
              requiredDuringSchedulingIgnoredDuringExecution: {
                nodeSelectorTerms: [
                  {
                    matchExpressions: [
                      {
                        key: 'kubernetes.io/arch',
                        operator: 'In',
                        values: ['mockedArch'],
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
      ]);
      return expect(
        mutateService.mutate(require('../../test/mockAdmissionSingle.json')),
      ).resolves.toStrictEqual(expected);
    });

    it('should return no patch', async () => {
      mockedResponse = () => ({});
      const expected = {
        apiVersion: 'admission.k8s.io/v1',
        kind: 'AdmissionReview',
        response: {
          allowed: true,
          uid: 'c4a40740-b74b-43e4-a401-fbef12c7d2fc',
        },
      };
      return expect(
        mutateService.mutate(require('../../test/mockAdmissionSingle.json')),
      ).resolves.toStrictEqual(expected);
    });

    it('should return architectures in common for all containers', async () => {
      mockedResponse = (input: string) => {
        if (input.includes('focal')) {
          return { data: { architectures: ['linux/mockedArch', 'linux/mockedArch2', 'windows/mockedArchN'] } };
        } else {
          return { data: { architectures: ['linux/mockedArch', 'linux/mockedArch3', 'windows/mockedArchN'] } }
        };
      }
      const expected = expectedResponse([
        {
          op: 'add',
          path: '/spec/affinity',
          value: {
            nodeAffinity: {
              requiredDuringSchedulingIgnoredDuringExecution: {
                nodeSelectorTerms: [
                  {
                    matchExpressions: [
                      {
                        key: 'kubernetes.io/arch',
                        operator: 'In',
                        values: ['mockedArch'],
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
      ]);
      return expect(
        mutateService.mutate(require('../../test/mockAdmissionMulti.json')),
      ).resolves.toStrictEqual(expected);
    });

    it('should return with original affinity', async () => {
      mockedResponse = () => ({
        data: {
          results: [
            { name: 'focal', images: [{ architecture: 'mockedArch' }] },
          ],
        },
      });
      const expected = expectedResponse([]);
      delete expected.response.patch;
      delete expected.response.patchType;
      return expect(
        mutateService.mutate(
          require('../../test/mockAdmissionWithAffinity.json'),
        ),
      ).resolves.toStrictEqual(expected);
    });
  });
});
