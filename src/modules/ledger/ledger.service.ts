import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { WalletNotFoundException } from 'src/common/exceptions/wallet-not-found.exception';
import { LedgerResponseDTO } from './dto/response/ledger-response.dto';
import { Prisma } from '@prisma/client';

type TransactionWithLedger = Prisma.TransactionGetPayload<{
  include: { ledger: true };
}>;

@Injectable()
export class LedgerService {
  constructor(private readonly prisma: PrismaService) {}

  async getEntries(
    userId: string,
    page: number,
    limit: number,
  ): Promise<LedgerResponseDTO> {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new WalletNotFoundException();

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { ledger: { orderBy: { createdAt: 'asc' } } },
      }),
      this.prisma.transaction.count({
        where: { walletId: wallet.id },
      }),
    ]);

    return {
      data: (transactions as TransactionWithLedger[]).map((tx) => ({
        transactionId: tx.id,
        type: tx.type,
        createdAt: tx.createdAt,
        entries: tx.ledger.map((entry) => ({
          id: entry.id,
          type: entry.type,
          token: entry.token,
          amount: String(entry.amount),
          balanceBefore: String(entry.balanceBefore),
          balanceAfter: String(entry.balanceAfter),
          createdAt: entry.createdAt,
        })),
      })),
      total,
      page,
      limit,
    };
  }
}
