import { z } from 'zod';
import { Token } from '@prisma/client';

export const DepositWebhookSchema = z.object({
  userId: z.uuid(),

  token: z.enum(Token),

  amount: z
    .string()
    .refine((val) => !isNaN(Number(val)), 'Amount must be a valid number'),

  idempotencyKey: z.string().min(1),
});

export type DepositWebhookDto = z.infer<typeof DepositWebhookSchema>;
