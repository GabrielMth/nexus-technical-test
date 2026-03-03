import {
  Module,
  MiddlewareConsumer,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from './modules/users/users.module';
import { AuthMiddleware } from './common/middleware/auth.middleware';
import { WalletModule } from './modules/wallet/wallet.module';
import { WebhooksModule } from './modules/webhooks/webhook.module';
import { RedisModule } from './common/cache/redis.module';
import { SwapModule } from './modules/swap/swap.module';
import { WithdrawalsModule } from './modules/withdrawals/withdrawals.module';

@Module({
  imports: [
    WithdrawalsModule,
    RedisModule,
    UsersModule,
    WalletModule,
    WebhooksModule,
    SwapModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret_key',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: 'users/register', method: RequestMethod.POST },
        { path: 'users/login', method: RequestMethod.POST },
        { path: 'webhooks/deposit', method: RequestMethod.POST }, // permiti pois como é webhook o usuário não terá registro localmente.
      )
      .forRoutes('*');
  }
}
