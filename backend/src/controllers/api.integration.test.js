const assert = require('node:assert/strict')
const { after, before, test } = require('node:test')
const jwt = require('jsonwebtoken')
const prisma = require('../config/prisma')
const app = require('../app')

const testUserId = '11111111-1111-4111-8111-111111111111'
const testTaskId = '22222222-2222-4222-8222-222222222222'
const testSecret = 'api-integration-test-secret-at-least-32-bytes'
const environmentKeys = ['JWT_SECRET', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'EMAIL_FROM']
const previousEnvironment = Object.fromEntries(environmentKeys.map((key) => [key, process.env[key]]))
let server
let baseUrl

before(async () => {
  process.env.JWT_SECRET = testSecret
  for (const key of environmentKeys.slice(1)) delete process.env[key]

  server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  server.closeAllConnections()
  await new Promise((resolve) => server.close(resolve))

  for (const key of environmentKeys) {
    if (previousEnvironment[key] === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = previousEnvironment[key]
    }
  }
})

function createToken(userId = testUserId) {
  return jwt.sign({ sub: userId }, testSecret, { expiresIn: '5m' })
}

async function callApi(path, { method = 'GET', body, token } = {}) {
  const headers = {}
  if (body !== undefined) headers['content-type'] = 'application/json'
  if (token) headers.authorization = `Bearer ${token}`

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  return {
    status: response.status,
    body: response.status === 204 ? null : await response.json(),
  }
}

function stubDelegate(context, modelName, methodName, implementation) {
  const delegate = prisma[modelName]
  const originalMethod = delegate[methodName]
  delegate[methodName] = implementation
  context.after(() => { delegate[methodName] = originalMethod })
}

test('protected task endpoint rejects requests without a JWT', async () => {
  const response = await callApi('/api/tasks')

  assert.equal(response.status, 401)
  assert.equal(response.body.error, 'Authentication required')
})

test('registration validates input, hashes the password, and returns a token', async (context) => {
  let createdUser
  stubDelegate(context, 'user', 'create', async ({ data }) => {
    createdUser = data
    return { id: testUserId, email: data.email }
  })

  const response = await callApi('/api/auth/register', {
    method: 'POST',
    body: { email: 'Person@Example.com', password: 'correct horse battery' },
  })

  assert.equal(response.status, 201)
  assert.equal(createdUser.email, 'person@example.com')
  assert.notEqual(createdUser.passwordHash, 'correct horse battery')
  assert.equal(jwt.verify(response.body.token, testSecret).sub, testUserId)
})

test('task list query is scoped to the JWT user', async (context) => {
  let query
  stubDelegate(context, 'task', 'findMany', async (args) => {
    query = args
    return []
  })

  const response = await callApi('/api/tasks', { token: createToken() })

  assert.equal(response.status, 200)
  assert.deepEqual(query.where, { ownerId: testUserId })
  assert.deepEqual(response.body.tasks, [])
})

test('task creation assigns ownership from the JWT, not the request body', async (context) => {
  let createData
  stubDelegate(context, 'task', 'create', async ({ data }) => {
    createData = data
    return { id: testTaskId, ...data, dueDate: null, imageUrl: null }
  })

  const response = await callApi('/api/tasks', {
    method: 'POST',
    token: createToken(),
    body: { title: 'Endpoint test task', ownerId: '33333333-3333-4333-8333-333333333333' },
  })

  assert.equal(response.status, 400)
  assert.equal(createData, undefined)
})

test('task creation stores the authenticated owner', async (context) => {
  let createData
  stubDelegate(context, 'task', 'create', async ({ data }) => {
    createData = data
    return { id: testTaskId, ...data, dueDate: null, imageUrl: null }
  })

  const response = await callApi('/api/tasks', {
    method: 'POST',
    token: createToken(),
    body: { title: 'Endpoint test task' },
  })

  assert.equal(response.status, 201)
  assert.equal(createData.ownerId, testUserId)
  assert.equal(response.body.task.id, testTaskId)
})

test('task read returns 404 within the authenticated owner scope', async (context) => {
  let query
  stubDelegate(context, 'task', 'findFirst', async (args) => {
    query = args
    return null
  })

  const response = await callApi(`/api/tasks/${testTaskId}`, { token: createToken() })

  assert.equal(response.status, 404)
  assert.deepEqual(query.where, { id: testTaskId, ownerId: testUserId })
})

test('task update and deletion both enforce owner scope', async (context) => {
  const taskQueries = []
  let findCount = 0
  stubDelegate(context, 'task', 'findFirst', async (args) => {
    taskQueries.push(args.where)
    findCount += 1
    if (findCount === 1) return { imageUrl: null, dueDate: null }
    if (findCount === 2) {
      return { id: testTaskId, title: 'Endpoint test task', description: null, status: 'completed', dueDate: null, imageUrl: null }
    }
    return { imageUrl: null }
  })
  stubDelegate(context, 'task', 'updateMany', async () => ({ count: 1 }))

  const updated = await callApi(`/api/tasks/${testTaskId}`, {
    method: 'PATCH',
    token: createToken(),
    body: { status: 'completed' },
  })

  assert.equal(updated.status, 200)
  assert.deepEqual(taskQueries[0], { id: testTaskId, ownerId: testUserId })
  assert.deepEqual(taskQueries[1], { id: testTaskId, ownerId: testUserId })

  stubDelegate(context, 'task', 'deleteMany', async () => ({ count: 1 }))

  const deleted = await callApi(`/api/tasks/${testTaskId}`, {
    method: 'DELETE',
    token: createToken(),
  })

  assert.equal(deleted.status, 204)
  assert.deepEqual(taskQueries[2], { id: testTaskId, ownerId: testUserId })
})