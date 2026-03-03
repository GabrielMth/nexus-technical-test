import { BadRequestException } from '@nestjs/common';

export class SameTokenException extends BadRequestException {
  constructor() {
    super({
      error: 'same_token',
      message: 'fromToken and toToken must be different.',
    });
  }
}
