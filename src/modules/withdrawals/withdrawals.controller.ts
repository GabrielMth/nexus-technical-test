import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { WithdrawalsService } from './withdrawals.service';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { WithdrawalSchema } from './dto/request/withdrawal.schema';
import type { WithdrawalDto } from './dto/request/withdrawal.schema';
import type { AuthRequest } from 'src/common/interfaces/auth-request.interface';
import { WithdrawalResponseDTO } from './dto/response/withdrawal-response.dto';

@Controller('withdrawals')
export class WithdrawalsController {
  constructor(private readonly withdrawalsService: WithdrawalsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async withdraw(
    @Req() req: AuthRequest,
    @Body(new ZodValidationPipe(WithdrawalSchema)) dto: WithdrawalDto,
  ): Promise<WithdrawalResponseDTO> {
    return this.withdrawalsService.withdraw(req.user.sub, dto);
  }
}
