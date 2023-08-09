import { mustBe, a, validate } from 'joi-decorator';
import StaticLogger from '../logger/logger.static';

export class EnvironmentVariables {
  @mustBe(a.string().case('lower').default('dev'))
  NODE_ENV: string;

  @mustBe(a.number().integer().min(1).max(65535).default(443))
  HTTPS_PORT: number;

  @mustBe(a.boolean().default(false))
  REDIS_ENABLED: boolean;

  @mustBe(
    a
      .string()
      .hostname()
      .when(a.ref('REDIS_ENABLED'), {
        is: a.boolean().valid(true),
        then: a.required(),
      }),
  )
  REDIS_HOST: string | undefined;

  @mustBe(
    a
      .number()
      .integer()
      .min(1)
      .max(65535)
      .default(6379)
      .when(a.ref('REDIS_ENABLED'), {
        is: a.boolean().valid(true),
        then: a.required(),
      }),
  )
  REDIS_PORT: number | undefined;

  @mustBe(a.number().integer().min(1).default(3600))
  CACHE_TTL: number;

  constructor() {
    Object.keys(process.env).forEach((key: string) => {
      this[key] = process.env[key];
    });
    try {
      validate(this, EnvironmentVariables, { allowUnknown: true });
    } catch (err: unknown) {
      StaticLogger.logAndExit(this.constructor.name, err);
    }
  }
}

export default (): EnvironmentVariables => {
  return new EnvironmentVariables();
};
