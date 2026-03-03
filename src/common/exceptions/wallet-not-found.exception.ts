import { NotFoundException } from '@nestjs/common';

export class WalletNotFoundException extends NotFoundException {
  constructor() {
    super({
      error: 'wallet_not_found',
      message: 'Wallet for the provided user does not exist.',
    });
  }
}
