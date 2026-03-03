import { Token } from '@prisma/client';

export class BalanceItemDTO {
  token: Token;
  balance: string;
}

export class WalletBalanceResponseDTO {
  balances: BalanceItemDTO[];
}
