const bcrypt = require('bcryptjs')
const prisma = require('../config/prisma')
const { createAccessToken, getJwtSecret } = require('../config/jwt')

async function register(request, response, next) {
  try {
    getJwtSecret()

    const { email, password } = request.validatedBody
    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true },
    })

    return response.status(201).json({
      message: 'Registration successful',
      user,
      token: createAccessToken(user.id),
    })
  } catch (error) {
    if (error.code === 'P2002') {
      return response.status(409).json({ error: 'An account with this email already exists' })
    }

    if (error.code === 'AUTH_CONFIG') {
      return response.status(500).json({ error: 'Authentication is not configured' })
    }

    return next(error)
  }
}

async function login(request, response, next) {
  try {
    getJwtSecret()

    const { email, password } = request.validatedBody
    const user = await prisma.user.findUnique({ where: { email } })
    const passwordMatches = user && (await bcrypt.compare(password, user.passwordHash))

    if (!passwordMatches) {
      return response.status(401).json({ error: 'Invalid email or password' })
    }

    return response.status(200).json({
      message: 'Login successful',
      user: { id: user.id, email: user.email },
      token: createAccessToken(user.id),
    })
  } catch (error) {
    if (error.code === 'AUTH_CONFIG') {
      return response.status(500).json({ error: 'Authentication is not configured' })
    }

    return next(error)
  }
}

module.exports = { login, register }