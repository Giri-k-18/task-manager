require('dotenv').config()

const prisma = require('../config/prisma')
const { upsertDemoUser } = require('../services/demoUser.service')

async function main() {
  if (!process.env.DEMO_EMAIL || !process.env.DEMO_PASSWORD) {
    throw new Error('DEMO_EMAIL and DEMO_PASSWORD must be configured')
  }

  await upsertDemoUser({
    client: prisma,
    email: process.env.DEMO_EMAIL,
    password: process.env.DEMO_PASSWORD,
  })
  console.log('Demo account is ready; keep its credentials in private submission notes.')
}

main()
  .catch(() => {
    console.error('Demo account setup failed; check its environment settings.')
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())