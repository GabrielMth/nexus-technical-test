import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Token } from '@prisma/client';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async getBalances(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const tokens = Object.values(Token);

    const balances = await Promise.all(
      tokens.map(async (token) => {
        const lastEntry = await this.prisma.ledgerEntry.findFirst({
          where: {
            walletId: wallet.id,
            token,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        return {
          token,
          balance: lastEntry ? lastEntry.balanceAfter.toString() : '0',
        };
      }),
    );

    return { balances };
  }
}
