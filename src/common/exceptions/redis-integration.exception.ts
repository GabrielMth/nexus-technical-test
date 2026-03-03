import { ServiceUnavailableException } from '@nestjs/common';

export class RedisIntegrationException extends ServiceUnavailableException {
  constructor() {
    super({
      error: 'cache_unavailable',
      message: 'Cache service is temporarily unavailable.',
    });
  }
}
