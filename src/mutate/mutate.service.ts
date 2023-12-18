import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { catchError, firstValueFrom } from 'rxjs';
import { observe, generate } from 'fast-json-patch';
import { Buffer } from 'buffer';
import {
  AdmissionDto,
  AffinityDto,
  AdmissionResponseDto,
  ContainerDto,
} from './dto/mutate.dto';
import { Logger } from 'nestjs-pino';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class MutateService {
  constructor(
    private readonly httpService: HttpService,
    private readonly loggerService: Logger,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) { }

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
    } else if (body.request.object.spec.affinity.nodeAffinity?.requiredDuringSchedulingIgnoredDuringExecution?.nodeSelectorTerms?.length > 0) {
      body.request.object.spec.affinity.nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution.nodeSelectorTerms.push(affinity.nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution.nodeSelectorTerms[0])
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
    this.loggerService.log(`Searching architectures for ${image}:${tag}`);
    let result;

    try {
      result = await this.cacheManager.get(container.image);
    } catch (err) {
      this.loggerService.error(
        `Failed to retrieve cache for ${image}:${tag}`,
        err,
      );
    }

    if (!result) {
      const { data } = await firstValueFrom(
        this.httpService
          .get<any>(
            `https://hub.docker.com/v2/repositories/${image}/tags?name=${tag}`,
          )
          .pipe(
            catchError(() => {
              this.loggerService.error(
                `Failed to retrieve image ${image}:${tag}`,
              );
              return [];
            }),
          ),
      );
      result = data.results
        .find((t: any) => t.name === tag)
        ?.images.map((i: any) => i.architecture);
    }
    try {
      await this.cacheManager.set(container.image, result);
    } catch (err) {
      this.loggerService.error(`Failed to set cache for ${image}:${tag}`, err);
    }
    return result;
  }

  async mutate(body: AdmissionDto): Promise<AdmissionResponseDto> {
    try {
      const archies = await Promise.all(
        body.request.object.spec.containers.map((arch) =>
          this.getArchies(arch),
        ),
      );
      const filtered = archies.filter((arch) => arch.length > 0);
      const result = Array.from(
        new Set(
          filtered
            .reduce((prev, curr) => {
              return prev.filter((val) => curr.includes(val));
            }, filtered[0])
            .filter((val) => val != 'unknown'),
        ),
      );

      const observer = observe(body.request.object);
      body = this.buildAffinity(body, result);
      this.loggerService.log(`Architectures found: ${result}`);
      return new AdmissionResponseDto(
        body.request?.uid,
        Buffer.from(JSON.stringify(generate(observer))).toString('base64'),
      );
    } catch (err) {
      this.loggerService.error(`Failed to mutate ${err.message ?? err}`);
      return new AdmissionResponseDto(body.request?.uid);
    }
  }
}
