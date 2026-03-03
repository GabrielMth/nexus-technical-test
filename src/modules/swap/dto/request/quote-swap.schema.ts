import { z } from 'zod';
import { Token } from '@prisma/client';

export const QuoteSwapSchema = z.object({
  fromToken: z.enum(Object.values(Token) as [string, ...string[]]),
  toToken: z.enum(Object.values(Token) as [string, ...string[]]),
  amount: z.string().refine((val) => Number(val) > 0, {
    message: 'Amount must be greater than 0',
  }),
});

export type QuoteSwapDto = z.infer<typeof QuoteSwapSchema>;
