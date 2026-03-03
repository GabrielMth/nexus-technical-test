import { ServiceUnavailableException } from '@nestjs/common';

export class CoinGeckoIntegrationException extends ServiceUnavailableException {
  constructor() {
    super({
      error: 'coingecko_unavailable',
      message: 'Failed to fetch price from CoinGecko. Please try again later.',
    });
  }
}
