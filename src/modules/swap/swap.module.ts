import { Module } from '@nestjs/common';
import { SwapController } from './swap.controller';
import { SwapService } from './swap.service';
import { CoinGeckoModule } from '../coingecko/coingecko.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [CoinGeckoModule, PrismaModule],
  controllers: [SwapController],
  providers: [SwapService],
})
export class SwapModule {}
