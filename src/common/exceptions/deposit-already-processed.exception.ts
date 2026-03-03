import { ConflictException } from '@nestjs/common';

export class DepositAlreadyProcessedException extends ConflictException {
  constructor() {
    super({
      error: 'deposit_already_processed',
      message: 'This deposit has already been processed.',
    });
  }
}
