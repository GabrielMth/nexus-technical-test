import { NotFoundException } from '@nestjs/common';

export class UserNotFoundException extends NotFoundException {
  constructor(email: string) {
    super(`Usuário com email "${email}" não encontrado`);
  }
}
