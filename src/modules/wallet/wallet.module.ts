import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { AuthMiddleware } from '../../common/middleware/auth.middleware';

@Module({
  controllers: [WalletController],
  providers: [WalletService],
})
export class WalletModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(WalletController);
  }
}
