const { verifyAccessToken } = require('../config/jwt')

module.exports = (request, response, next) => {
  const authorization = request.get('authorization') || ''
  const match = authorization.match(/^Bearer\s+([^\s]+)$/i)

  if (!match) {
    return response.status(401).json({ error: 'Authentication required' })
  }

  try {
    const claims = verifyAccessToken(match[1])

    if (typeof claims.sub !== 'string' || claims.sub.length === 0) {
      return response.status(401).json({ error: 'Invalid or expired token' })
    }

    request.user = { id: claims.sub }
    next()
  } catch (error) {
    if (error.code === 'AUTH_CONFIG') {
      return response.status(500).json({ error: 'Authentication is not configured' })
    }

    return response.status(401).json({ error: 'Invalid or expired token' })
  }
}