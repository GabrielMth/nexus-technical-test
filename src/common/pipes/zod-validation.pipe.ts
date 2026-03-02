import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import type { ZodType } from 'zod';

@Injectable()
export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const messages: string[] = [];

      const formatted = result.error.format() as Record<
        string,
        { _errors?: string[] }
      >;

      Object.values(formatted).forEach((field) => {
        if (field._errors && field._errors.length > 0) {
          messages.push(...field._errors);
        }
      });

      throw new BadRequestException(messages);
    }

    return result.data;
  }
}
