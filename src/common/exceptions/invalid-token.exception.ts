import { BadRequestException } from '@nestjs/common';

export class InvalidTokenException extends BadRequestException {
  constructor() {
    super({
      error: 'invalid_token',
      message: 'The provided token is not supported/ invalid token!',
    });
  }
}
