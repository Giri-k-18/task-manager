const { z } = require('zod')

const credentialsSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .max(255, 'Email is too long')
    .email('Enter a valid email address')
    .refine(
      (email) => email.toLowerCase().endsWith('@gmail.com'),
      'Only Gmail addresses are allowed'
    )
    .transform((email) => email.toLowerCase()),

  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .refine(
      (password) => Buffer.byteLength(password, 'utf8') <= 72,
      {
        message: 'Password must be at most 72 bytes',
      }
    ),
})

module.exports = { credentialsSchema }