const { timingSafeEqual } = require('node:crypto')

module.exports = (request, response, next) => {
  const expectedSecret = process.env.CRON_SECRET
  if (!expectedSecret) {
    return response.status(503).json({ error: 'Scheduled reminders are not configured' })
  }

  const authorization = request.get('authorization') || ''
  const match = authorization.match(/^Bearer\s+([^\s]+)$/i)
  if (!match) {
    return response.status(401).json({ error: 'Authentication required' })
  }

  const provided = Buffer.from(match[1])
  const expected = Buffer.from(expectedSecret)
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return response.status(401).json({ error: 'Invalid cron authorization' })
  }

  return next()
}