import { z } from 'zod'

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  role: z.enum(['buyer', 'seller', 'realtor', 'broker_admin']),
})
export type RegisterDto = z.infer<typeof RegisterSchema>

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})
export type LoginDto = z.infer<typeof LoginSchema>
