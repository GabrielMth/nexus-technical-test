import { Module } from '@nestjs/common';
import { CoinGeckoService } from './coingecko.service';
import { RedisModule } from 'src/common/cache/redis.module';

@Module({
  imports: [RedisModule],
  providers: [CoinGeckoService],
  exports: [CoinGeckoService],
})
export class CoinGeckoModule {}
