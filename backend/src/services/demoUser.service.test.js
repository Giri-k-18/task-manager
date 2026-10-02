const assert = require('node:assert/strict')
const bcrypt = require('bcryptjs')
const test = require('node:test')
const { upsertDemoUser } = require('./demoUser.service')

test('upserts a normalized demo account with a bcrypt password hash', async () => {
  let query
  const user = { id: 'demo-user-id', email: 'demo@example.com' }
  const client = {
    user: {
      upsert: async (args) => {
        query = args
        return user
      },
    },
  }

  const result = await upsertDemoUser({
    client,
    email: 'Demo@Example.com',
    password: 'unique-demo-password',
  })

  assert.deepEqual(result, user)
  assert.equal(query.where.email, 'demo@example.com')
  assert.equal(query.create.email, 'demo@example.com')
  assert.notEqual(query.create.passwordHash, 'unique-demo-password')
  assert.equal(await bcrypt.compare('unique-demo-password', query.create.passwordHash), true)
  assert.equal(query.update.passwordHash, query.create.passwordHash)
})

test('rejects invalid demo credentials without writing to the database', async () => {
  let called = false
  const client = { user: { upsert: async () => { called = true } } }

  await assert.rejects(
    upsertDemoUser({ client, email: 'invalid', password: 'short' }),
    { name: 'TypeError' },
  )
  assert.equal(called, false)
})