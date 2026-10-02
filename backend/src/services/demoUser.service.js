const bcrypt = require('bcryptjs')
const { credentialsSchema } = require('../validators/auth.schemas')

async function upsertDemoUser({ client, email, password }) {
  const credentials = credentialsSchema.safeParse({ email, password })
  if (!credentials.success) {
    throw new TypeError('DEMO_EMAIL and DEMO_PASSWORD must be valid credentials')
  }

  const passwordHash = await bcrypt.hash(credentials.data.password, 12)
  return client.user.upsert({
    where: { email: credentials.data.email },
    update: { passwordHash },
    create: { email: credentials.data.email, passwordHash },
    select: { id: true, email: true },
  })
}

module.exports = { upsertDemoUser }