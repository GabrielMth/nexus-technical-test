import { BadRequestException } from '@nestjs/common';

export class InvalidDepositAmountException extends BadRequestException {
  constructor() {
    super({
      error: 'invalid_deposit_amount',
      message: 'Deposit amount must be greater than zero.',
    });
  }
}
