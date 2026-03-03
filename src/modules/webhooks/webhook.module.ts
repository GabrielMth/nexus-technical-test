import { Module } from '@nestjs/common';
import { WebhooksController } from './webhook.controller';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [WalletModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
