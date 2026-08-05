import { z } from 'zod';

// Mirrors the field-level validation LoginScreen used to do by hand: an
// email is required and must look like an email, a password is only
// required (the backend is the source of truth for password strength/
// correctness - see auth.ts's "Invalid email or password" error).
export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required.').email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
