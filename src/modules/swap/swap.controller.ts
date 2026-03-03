import {
  Body,
  Controller,
  Post,
  Get,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SwapService } from './swap.service';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { QuoteSwapSchema } from './dto/request/quote-swap.schema';
import { ExecuteSwapSchema } from './dto/request/execute-swap.schema';
import type { QuoteSwapDto } from './dto/request/quote-swap.schema';
import type { ExecuteSwapDto } from './dto/request/execute-swap.schema';
import { QuoteResponseDTO } from './dto/response/quote-response.dto';
import { ExecuteResponseDTO } from './dto/response/execute-response.dto';
import type { AuthRequest } from 'src/common/interfaces/auth-request.interface';
import { Req } from '@nestjs/common';

@Controller('swap')
export class SwapController {
  constructor(private readonly swapService: SwapService) {}

  @Get('quote')
  async quote(
    @Query(new ZodValidationPipe(QuoteSwapSchema)) dto: QuoteSwapDto,
  ): Promise<QuoteResponseDTO> {
    return this.swapService.quote(dto);
  }

  @Post('execute')
  @HttpCode(HttpStatus.OK)
  async execute(
    @Req() req: AuthRequest,
    @Body(new ZodValidationPipe(ExecuteSwapSchema)) dto: ExecuteSwapDto,
  ): Promise<ExecuteResponseDTO> {
    return this.swapService.execute(req.user.sub, dto);
  }
}
