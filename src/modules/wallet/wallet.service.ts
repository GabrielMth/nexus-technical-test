import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Token } from '@prisma/client';
import { WalletNotFoundException } from 'src/common/exceptions/wallet-not-found.exception';
import { DepositAlreadyProcessedException } from 'src/common/exceptions/deposit-already-processed.exception';
import { InvalidDepositAmountException } from 'src/common/exceptions/invalid-deposit-amount.exception';
import { DepositWebhookDto } from '../webhooks/dto/request/deposit-webhook.schema';
import { Prisma } from '@prisma/client';
import { DepositResponseDTO } from '../webhooks/dto/response/deposit-response.dto';

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

  async processDeposit(dto: DepositWebhookDto): Promise<DepositResponseDTO> {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await this.getWalletOrThrow(tx, dto.userId);
      await this.ensureUniqueDeposit(tx, wallet.id, dto.idempotencyKey);

      const balanceBefore = await this.getLastBalance(tx, wallet.id, dto.token);
      const amount = new Prisma.Decimal(dto.amount);
      if (amount.lte(0)) throw new InvalidDepositAmountException();

      const balanceAfter = balanceBefore.plus(amount);

      const transaction = await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'DEPOSIT',
          fromToken: dto.token,
          amount,
        },
      });

      await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          type: 'DEPOSIT',
          token: dto.token,
          amount,
          balanceBefore,
          balanceAfter,
          transactionId: transaction.id,
        },
      });

      return {
        success: true,
        token: dto.token,
        balance: balanceAfter.toString(),
      };
    });
  }

  private async getWalletOrThrow(tx: Prisma.TransactionClient, userId: string) {
    const wallet = await tx.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new WalletNotFoundException();
    return wallet;
  }

  private async ensureUniqueDeposit(
    tx: Prisma.TransactionClient,
    walletId: string,
    key: string,
  ) {
    try {
      await tx.idempotencyKey.create({
        data: { key, wallet: { connect: { id: walletId } } },
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new DepositAlreadyProcessedException();
      }
      throw error;
    }
  }

  private async getLastBalance(
    tx: Prisma.TransactionClient,
    walletId: string,
    token: Token,
  ) {
    const lastEntry = await tx.ledgerEntry.findFirst({
      where: { walletId, token },
      orderBy: { createdAt: 'desc' },
    });
    return lastEntry
      ? new Prisma.Decimal(lastEntry.balanceAfter)
      : new Prisma.Decimal(0);
  }
}
