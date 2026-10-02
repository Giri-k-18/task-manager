const { z } = require('zod')

const credentialsSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .email()
    .transform((email) => email.toLowerCase()),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .refine((password) => Buffer.byteLength(password, 'utf8') <= 72, {
      message: 'Password must be at most 72 bytes',
    }),
})

module.exports = { credentialsSchema }