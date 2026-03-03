import { Controller, Get, HttpCode, Req } from '@nestjs/common';
import { WalletService } from './wallet.service';
import type { AuthRequest } from '../../common/interfaces/auth-request.interface';
import { WalletBalanceResponseDTO } from './dto/response/wallet-balance-response.dto';

@Controller('wallet')
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Get('balance')
  @HttpCode(200)
  async getBalance(@Req() req: AuthRequest): Promise<WalletBalanceResponseDTO> {
    return this.walletService.getBalances(req.user.sub);
  }
}
