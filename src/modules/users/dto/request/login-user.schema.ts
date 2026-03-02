import { z } from 'zod';

export const LoginUserSchema = z.object({
  email: z.string().email({ message: 'Email invalid' }),
  password: z
    .string()
    .min(6, { message: 'The password must be at least 6 digits long.' }),
});

export type LoginUserDto = z.infer<typeof LoginUserSchema>;
