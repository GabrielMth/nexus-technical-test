import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { WalletService } from '../wallet/wallet.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { DepositWebhookSchema } from './dto/request/deposit-webhook.schema';
import type { DepositWebhookDto } from './dto/request/deposit-webhook.schema';
import { DepositResponseDTO } from './dto/response/deposit-response.dto';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly walletService: WalletService) {}

  @Post('deposit')
  @HttpCode(HttpStatus.OK)
  async deposit(
    @Body(new ZodValidationPipe(DepositWebhookSchema))
    dto: DepositWebhookDto,
  ): Promise<DepositResponseDTO> {
    return this.walletService.processDeposit(dto);
  }
}
