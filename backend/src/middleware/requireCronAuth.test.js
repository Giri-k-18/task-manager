const assert = require('node:assert/strict')
const test = require('node:test')
const requireCronAuth = require('./requireCronAuth')

function invokeMiddleware(authorization, secret) {
  const previousSecret = process.env.CRON_SECRET
  if (secret === undefined) {
    delete process.env.CRON_SECRET
  } else {
    process.env.CRON_SECRET = secret
  }

  const result = { status: null, body: null, continued: false }
  const response = {
    status(status) {
      result.status = status
      return this
    },
    json(body) {
      result.body = body
      return this
    },
  }

  try {
    requireCronAuth(
      { get: () => authorization },
      response,
      () => { result.continued = true },
    )
  } finally {
    if (previousSecret === undefined) {
      delete process.env.CRON_SECRET
    } else {
      process.env.CRON_SECRET = previousSecret
    }
  }

  return result
}

test('rejects scheduled requests when the cron secret is missing', () => {
  const result = invokeMiddleware('Bearer cron-secret', undefined)

  assert.equal(result.status, 503)
  assert.equal(result.continued, false)
})

test('requires a matching bearer secret for scheduled requests', () => {
  assert.equal(invokeMiddleware('', 'cron-secret').status, 401)
  assert.equal(invokeMiddleware('Bearer wrong-secret', 'cron-secret').status, 401)
  assert.equal(invokeMiddleware('Bearer cron-secret', 'cron-secret').continued, true)
})