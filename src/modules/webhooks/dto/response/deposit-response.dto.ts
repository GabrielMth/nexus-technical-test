import { Token } from '@prisma/client';

export class DepositResponseDTO {
  success: boolean;
  token: Token;
  balance: string;
  message?: string;
}
