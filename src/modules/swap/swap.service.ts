import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CoinGeckoService } from '../coingecko/coingecko.service';
import { Prisma, Token } from '@prisma/client';
import { QuoteSwapDto } from './dto/request/quote-swap.schema';
import { ExecuteSwapDto } from './dto/request/execute-swap.schema';
import { QuoteResponseDTO } from './dto/response/quote-response.dto';
import { ExecuteResponseDTO } from './dto/response/execute-response.dto';
import { WalletNotFoundException } from 'src/common/exceptions/wallet-not-found.exception';
import { InsufficientBalanceException } from 'src/common/exceptions/insufficient-balance.exception';
import { SameTokenException } from 'src/common/exceptions/same-token.exception';

const FEE_RATE = new Prisma.Decimal('0.015'); // 1.5%

@Injectable()
export class SwapService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coinGecko: CoinGeckoService,
  ) {}

  async quote(dto: QuoteSwapDto): Promise<QuoteResponseDTO> {
    if (dto.fromToken === dto.toToken) throw new SameTokenException();

    const rate = await this.coinGecko.getRate(
      dto.fromToken as Token,
      dto.toToken as Token,
    );

    const amount = new Prisma.Decimal(dto.amount);
    const fee = amount.mul(FEE_RATE);
    const toAmount = amount.mul(new Prisma.Decimal(rate));

    return {
      fromToken: dto.fromToken,
      toToken: dto.toToken,
      amount: amount.toString(),
      toAmount: toAmount.toDecimalPlaces(8).toString(),
      fee: fee.toDecimalPlaces(8).toString(),
      rate: rate.toString(),
    };
  }

  async execute(
    userId: string,
    dto: ExecuteSwapDto,
  ): Promise<ExecuteResponseDTO> {
    if (dto.fromToken === dto.toToken) throw new SameTokenException();

    const rate = await this.coinGecko.getRate(
      dto.fromToken as Token,
      dto.toToken as Token,
    );

    const amount = new Prisma.Decimal(dto.amount);
    const fee = amount.mul(FEE_RATE);
    const totalDeducted = amount.plus(fee);
    const toAmount = amount.mul(new Prisma.Decimal(rate));

    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new WalletNotFoundException();

      // valid balance
      const lastEntry = await tx.ledgerEntry.findFirst({
        where: { walletId: wallet.id, token: dto.fromToken as Token },
        orderBy: { createdAt: 'desc' },
      });
      const currentBalance = lastEntry
        ? new Prisma.Decimal(lastEntry.balanceAfter)
        : new Prisma.Decimal(0);

      if (currentBalance.lt(totalDeducted))
        throw new InsufficientBalanceException();

      // new transaction
      const transaction = await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'SWAP',
          fromToken: dto.fromToken as Token,
          toToken: dto.toToken as Token,
          amount,
          fee,
        },
      });

      const fromBalanceBefore = currentBalance;
      const fromBalanceAfterSwap = fromBalanceBefore.minus(amount);
      const fromBalanceAfterFee = fromBalanceAfterSwap.minus(fee);

      // SWAP_OUT
      await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          transactionId: transaction.id,
          type: 'SWAP_OUT',
          token: dto.fromToken as Token,
          amount,
          balanceBefore: fromBalanceBefore,
          balanceAfter: fromBalanceAfterSwap,
        },
      });

      // SWAP_FEE
      await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          transactionId: transaction.id,
          type: 'SWAP_FEE',
          token: dto.fromToken as Token,
          amount: fee,
          balanceBefore: fromBalanceAfterSwap,
          balanceAfter: fromBalanceAfterFee,
        },
      });

      // SWAP_IN
      const toLastEntry = await tx.ledgerEntry.findFirst({
        where: { walletId: wallet.id, token: dto.toToken as Token },
        orderBy: { createdAt: 'desc' },
      });
      const toBalanceBefore = toLastEntry
        ? new Prisma.Decimal(toLastEntry.balanceAfter)
        : new Prisma.Decimal(0);
      const toBalanceAfter = toBalanceBefore.plus(toAmount);

      await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          transactionId: transaction.id,
          type: 'SWAP_IN',
          token: dto.toToken as Token,
          amount: toAmount,
          balanceBefore: toBalanceBefore,
          balanceAfter: toBalanceAfter,
        },
      });

      return {
        success: true,
        fromToken: dto.fromToken,
        toToken: dto.toToken,
        fromAmount: totalDeducted.toDecimalPlaces(8).toString(),
        toAmount: toAmount.toDecimalPlaces(8).toString(),
        fee: fee.toDecimalPlaces(8).toString(),
        rate: rate.toString(),
      };
    });
  }
}
