const cors = require('cors')
const express = require('express')
const prisma = require('./config/prisma')

const authRoutes = require('./routes/auth.routes')
const taskRoutes = require('./routes/task.routes')
const uploadRoutes = require('./routes/upload.routes')
const cronRoutes = require('./routes/cron.routes')
const errorHandler = require('./middleware/errorHandler')

const app = express()

// ------------------------------------
// CORS CONFIGURATION
// ------------------------------------

const configuredOrigins = (process.env.FRONTEND_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean)

const defaultOrigins = [
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://localhost:5173',
  'http://localhost:5174',
]

const allowedOrigins = new Set([
  ...configuredOrigins,
  ...defaultOrigins,
])

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests without Origin
      // Example: Postman, server-to-server requests
      if (!origin) {
        return callback(null, true)
      }

      const normalizedOrigin = origin.replace(/\/$/, '')

      if (allowedOrigins.has(normalizedOrigin)) {
        return callback(null, true)
      }

      console.log('CORS blocked origin:', origin)

      return callback(new Error('Not allowed by CORS'))
    },

    credentials: true,

    methods: [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS',
    ],

    allowedHeaders: [
      'Content-Type',
      'Authorization',
    ],
  }),
)

app.use(express.json())

// ------------------------------------
// HEALTH CHECK
// ------------------------------------

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

// ------------------------------------
// ROUTES
// ------------------------------------

app.use(authRoutes)
app.use('/api/auth', authRoutes)

app.use('/tasks', taskRoutes)
app.use('/api/tasks', taskRoutes)

app.use('/uploads', uploadRoutes)
app.use('/api/uploads', uploadRoutes)

app.use('/api/cron', cronRoutes)

// ------------------------------------
// ERROR HANDLER
// ------------------------------------

app.use(errorHandler)

module.exports = app