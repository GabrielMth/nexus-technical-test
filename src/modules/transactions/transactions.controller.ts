import { Controller, Get, Query, Req } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import type { AuthRequest } from 'src/common/interfaces/auth-request.interface';
import { TransactionsListResponseDTO } from './dto/response/transaction-response.dto';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  async getTransactions(
    @Req() req: AuthRequest,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ): Promise<TransactionsListResponseDTO> {
    return this.transactionsService.getTransactions(
      req.user.sub,
      Number(page),
      Number(limit),
    );
  }
}
