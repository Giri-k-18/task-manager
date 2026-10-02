const jwt = require('jsonwebtoken')

function getJwtSecret() {
  const secret = process.env.JWT_SECRET

  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
    const error = new Error('JWT_SECRET must be configured with at least 32 bytes')
    error.code = 'AUTH_CONFIG'
    throw error
  }

  return secret
}

function createAccessToken(userId) {
  return jwt.sign({ sub: userId }, getJwtSecret(), { expiresIn: '1h' })
}

function verifyAccessToken(token) {
  return jwt.verify(token, getJwtSecret())
}

module.exports = { createAccessToken, getJwtSecret, verifyAccessToken }