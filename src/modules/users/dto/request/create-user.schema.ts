import { z } from 'zod';

export const CreateUserSchema = z.object({
  email: z.string().email({ message: 'E-mail format invalid!' }),
  password: z
    .string()
    .min(6, { message: 'The password must be at least 6 digits long.' }),
});

export type CreateUserDto = z.infer<typeof CreateUserSchema>;
