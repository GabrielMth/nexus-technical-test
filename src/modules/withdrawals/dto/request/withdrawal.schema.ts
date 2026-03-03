import { z } from 'zod';
import { Token } from '@prisma/client';

export const WithdrawalSchema = z.object({
  token: z.enum(Object.values(Token) as [string, ...string[]]),
  amount: z.string().refine((val) => Number(val) > 0, {
    message: 'Amount must be greater than 0',
  }),
});

export type WithdrawalDto = z.infer<typeof WithdrawalSchema>;
