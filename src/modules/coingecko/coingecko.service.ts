import { Injectable, BadRequestException } from '@nestjs/common';
import { Token } from '@prisma/client';
import { RedisService } from 'src/common/cache/redis.service';
import { CoinGeckoIntegrationException } from 'src/common/exceptions/coingecko-integration.exception';
import { RedisIntegrationException } from 'src/common/exceptions/redis-integration.exception';

const COINGECKO_IDS: Partial<Record<Token, string>> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
};

const CACHE_TTL = 60;

@Injectable()
export class CoinGeckoService {
  private readonly baseUrl = 'https://api.coingecko.com/api/v3';

  constructor(private readonly redis: RedisService) {}

  async getRate(fromToken: Token, toToken: Token): Promise<number> {
    if (fromToken === toToken) {
      throw new BadRequestException('Cannot swap same token');
    }

    if (fromToken === Token.BRL) {
      const rate = await this.fetchRate(toToken, 'brl');
      return 1 / rate;
    }

    if (toToken === Token.BRL) {
      return await this.fetchRate(fromToken, 'brl');
    }

    const fromInBrl = await this.fetchRate(fromToken, 'brl');
    const toInBrl = await this.fetchRate(toToken, 'brl');
    return fromInBrl / toInBrl;
  }

  private async fetchRate(token: Token, currency: string): Promise<number> {
    const cacheKey = `rate:${token}:${currency}`;

    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) return Number(cached);
    } catch {
      throw new RedisIntegrationException();
    }

    const id = COINGECKO_IDS[token];
    if (!id) throw new BadRequestException(`Unsupported token: ${token}`);

    try {
      const url = `${this.baseUrl}/simple/price?ids=${id}&vs_currencies=${currency}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error();

      const data = (await response.json()) as Record<
        string,
        Record<string, number>
      >;
      const rate = data[id][currency];

      await this.redis.set(cacheKey, String(rate), CACHE_TTL);
      return rate;
    } catch {
      throw new CoinGeckoIntegrationException();
    }
  }
}
