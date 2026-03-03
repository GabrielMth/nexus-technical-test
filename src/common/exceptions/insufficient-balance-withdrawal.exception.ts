import { BadRequestException } from '@nestjs/common';

export class InsufficientBalanceWithdrawalException extends BadRequestException {
  constructor() {
    super({
      error: 'insufficient_balance',
      message: 'Insufficient balance to complete this withdrawal.',
    });
  }
}
