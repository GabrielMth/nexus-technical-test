import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { WalletNotFoundException } from 'src/common/exceptions/wallet-not-found.exception';
import { TransactionsListResponseDTO } from './dto/response/transaction-response.dto';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTransactions(
    userId: string,
    page: number,
    limit: number,
  ): Promise<TransactionsListResponseDTO> {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new WalletNotFoundException();

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({
        where: { walletId: wallet.id },
      }),
    ]);

    return {
      data: transactions.map((tx) => ({
        id: String(tx.id),
        type: String(tx.type),
        fromToken: tx.fromToken ? String(tx.fromToken) : undefined,
        toToken: tx.toToken ? String(tx.toToken) : undefined,
        amount: tx.amount ? String(tx.amount) : undefined,
        fee: tx.fee ? String(tx.fee) : undefined,
        createdAt: tx.createdAt,
      })),
      total,
      page,
      limit,
    };
  }
}
