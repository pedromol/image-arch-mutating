import { Test, TestingModule } from '@nestjs/testing';
import { MutateService } from './mutate.service';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';

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
    }).compile();

    mutateService = app.get<MutateService>(MutateService);
  });

  describe('Service', () => {
    it('should return a single arch', async () => {
      mockedResponse = () => ({
        data: {
          results: [
            { name: 'focal', images: [{ architecture: 'mockedArch' }] },
          ],
        },
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

    it('should return two arch', async () => {
      mockedResponse = (input: string) => {
        if (input.includes('focal')) {
          return {
            data: {
              results: [
                {
                  name: 'focal',
                  images: [
                    { architecture: 'mockedArch' },
                    { architecture: 'mockedArch2' },
                  ],
                },
              ],
            },
          };
        } else {
          return {
            data: {
              results: [
                {
                  name: 'bookworm',
                  images: [
                    { architecture: 'mockedArch' },
                    { architecture: 'mockedArch3' },
                  ],
                },
              ],
            },
          };
        }
      };
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
      const expected = expectedResponse([
        {
          op: 'remove',
          path: '/spec/affinity/nodeAffinity/requiredDuringSchedulingIgnoredDuringExecution/nodeSelectorTerms/1',
        },
        {
          op: 'replace',
          path: '/spec/affinity/nodeAffinity/requiredDuringSchedulingIgnoredDuringExecution/nodeSelectorTerms/0/matchExpressions/0/values',
          value: ['mockedArch'],
        },
      ]);
      return expect(
        mutateService.mutate(
          require('../../test/mockAdmissionWithAffinity.json'),
        ),
      ).resolves.toStrictEqual(expected);
    });
  });
});
