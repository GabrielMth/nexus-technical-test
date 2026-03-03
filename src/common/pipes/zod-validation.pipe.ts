import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import type { ZodType } from 'zod';
import { InvalidTokenException } from '../exceptions/invalid-token.exception';

@Injectable()
export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const isInvalidToken = result.error.issues.some(
        (issue) =>
          issue.path.includes('token') && issue.code === 'invalid_value',
      );

      if (isInvalidToken) throw new InvalidTokenException();

      const messages = result.error.issues.map((issue) => issue.message);

      throw new BadRequestException(messages);
    }

    return result.data;
  }
}
