const assert = require('node:assert/strict')
const test = require('node:test')
const { isEmailConfigured, sendWelcomeEmail } = require('./email.service')

const smtpKeys = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'EMAIL_FROM']

test('email delivery is disabled when SMTP settings are absent', async () => {
  const previousValues = Object.fromEntries(smtpKeys.map((key) => [key, process.env[key]]))
  smtpKeys.forEach((key) => delete process.env[key])

  try {
    assert.equal(isEmailConfigured(), false)
    assert.equal(await sendWelcomeEmail('person@example.com'), false)
  } finally {
    smtpKeys.forEach((key) => {
      if (previousValues[key] === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = previousValues[key]
      }
    })
  }
})