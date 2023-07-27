import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { observe, generate } from 'fast-json-patch';
import { Buffer } from 'buffer';
import {
  AdmissionDto,
  AffinityDto,
  AdmissionResponseDto,
  ContainerDto,
} from './adminission.dto';

@Injectable()
export class AppService {
  constructor(private readonly httpService: HttpService) {}

  buildAffinity(body: AdmissionDto, arch: string[]): AdmissionDto {
    if (arch.length == 0) {
      return body;
    }

    const affinity: AffinityDto = {
      nodeAffinity: {
        requiredDuringSchedulingIgnoredDuringExecution: {
          nodeSelectorTerms: [
            {
              matchExpressions: [
                {
                  key: 'kubernetes.io/arch',
                  operator: 'In',
                  values: arch,
                },
              ],
            },
          ],
        },
      },
    };

    if (!body.request.object.spec.affinity) {
      body.request.object.spec.affinity = affinity;
    } else {
      body.request.object.spec.affinity = Object.assign(
        body.request.object.spec.affinity,
        affinity,
      );
    }

    return body;
  }

  async getArchies(container: ContainerDto): Promise<string[]> {
    let [image, tag] = container.image.split(':');
    if (!tag) {
      tag = 'latest';
    }
    const { data } = await firstValueFrom(
      this.httpService
        .get<any>(
          `https://hub.docker.com/v2/repositories/${image}/tags?name=${tag}`,
        )
        .pipe(
          catchError(() => {
            return [];
          }),
        ),
    );
    return data.results
      .find((t: any) => t.name === tag)
      ?.images.map((i: any) => i.architecture);
  }

  async mutate(body: AdmissionDto): Promise<AdmissionResponseDto> {
    try {
      const archies = await Promise.all(
        body.request.object.spec.containers.map((arch) =>
          this.getArchies(arch),
        ),
      );
      const filtered = archies.filter((arch) => arch.length > 0);
      const result = filtered.reduce((prev, curr) => {
        return prev.filter((val) => curr.includes(val));
      }, filtered[0]);

      const observer = observe(body.request.object);
      body = this.buildAffinity(body, result);

      return new AdmissionResponseDto(
        body.request.uid,
        Buffer.from(JSON.stringify(generate(observer))).toString('base64'),
      );
    } catch (err) {
      return new AdmissionResponseDto(body.request.uid);
    }
  }
}
