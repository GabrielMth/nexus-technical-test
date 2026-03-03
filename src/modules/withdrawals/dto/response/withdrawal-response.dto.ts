import { Token } from '@prisma/client';

export class WithdrawalResponseDTO {
  success: boolean;
  token: Token;
  amount: string;
  balanceAfter: string;
}
