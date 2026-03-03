import { BadRequestException } from '@nestjs/common';

export class InsufficientBalanceException extends BadRequestException {
  constructor() {
    super({
      error: 'insufficient_balance',
      message: 'Insufficient balance to complete this swap.',
    });
  }
}
