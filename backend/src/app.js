const cors = require('cors')
const express = require('express')
const prisma = require('./config/prisma')
const authRoutes = require('./routes/auth.routes')
const taskRoutes = require('./routes/task.routes')
const uploadRoutes = require('./routes/upload.routes')
const errorHandler = require('./middleware/errorHandler')

const app = express()
const configuredOrigins = (process.env.FRONTEND_ORIGIN || 'http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
const defaultOrigins = [
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://localhost:5173',
  'http://localhost:5174',
]
const allowedOrigins = new Set([...configuredOrigins, ...defaultOrigins])

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true)
      }

      return callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
  }),
)
app.use(express.json())

app.get('/api/health', async (_request, response) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    response.status(200).json({
      status: 'ok',
      service: 'task-manager-api',
      database: 'connected',
    })
  } catch {
    response.status(503).json({
      status: 'error',
      service: 'task-manager-api',
      database: 'unavailable',
    })
  }
})

app.use(authRoutes)
app.use('/api/auth', authRoutes)
app.use('/tasks', taskRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/uploads', uploadRoutes)
app.use('/api/uploads', uploadRoutes)
app.use(errorHandler)

module.exports = app