import { Controller, Get, Query, Req } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import type { AuthRequest } from 'src/common/interfaces/auth-request.interface';
import { LedgerResponseDTO } from './dto/response/ledger-response.dto';

@Controller('ledger')
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Get()
  async getEntries(
    @Req() req: AuthRequest,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ): Promise<LedgerResponseDTO> {
    return this.ledgerService.getEntries(
      req.user.sub,
      Number(page),
      Number(limit),
    );
  }
}
