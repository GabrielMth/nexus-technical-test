import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, Token } from '@prisma/client';
import { WithdrawalDto } from './dto/request/withdrawal.schema';
import { WithdrawalResponseDTO } from './dto/response/withdrawal-response.dto';
import { WalletNotFoundException } from 'src/common/exceptions/wallet-not-found.exception';
import { InsufficientBalanceWithdrawalException } from 'src/common/exceptions/insufficient-balance-withdrawal.exception';

@Injectable()
export class WithdrawalsService {
  constructor(private readonly prisma: PrismaService) {}

  async withdraw(
    userId: string,
    dto: WithdrawalDto,
  ): Promise<WithdrawalResponseDTO> {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new WalletNotFoundException();

      const lastEntry = await tx.ledgerEntry.findFirst({
        where: { walletId: wallet.id, token: dto.token as Token },
        orderBy: { createdAt: 'desc' },
      });
      const currentBalance = lastEntry
        ? new Prisma.Decimal(lastEntry.balanceAfter)
        : new Prisma.Decimal(0);

      const amount = new Prisma.Decimal(dto.amount);
      if (currentBalance.lt(amount))
        throw new InsufficientBalanceWithdrawalException();

      const balanceAfter = currentBalance.minus(amount);

      const transaction = await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'WITHDRAWAL',
          fromToken: dto.token as Token,
          amount,
        },
      });

      await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          transactionId: transaction.id,
          type: 'WITHDRAWAL',
          token: dto.token as Token,
          amount,
          balanceBefore: currentBalance,
          balanceAfter,
        },
      });

      return {
        success: true,
        token: dto.token as Token,
        amount: amount.toString(),
        balanceAfter: balanceAfter.toString(),
      };
    });
  }
}
