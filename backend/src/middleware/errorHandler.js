function redactSecrets(message) {
  let safeMessage = String(message || 'Unknown error')

  for (const key of [
    'DATABASE_URL',
    'JWT_SECRET',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
  ]) {
    const secret = process.env[key]
    if (secret) {
      safeMessage = safeMessage.replaceAll(secret, '[redacted]')
    }
  }

  return safeMessage
    .replace(/(api[_-]?secret\s*[:=]\s*)[^\s,}]+/gi, '$1[redacted]')
    .replace(/(api[_-]?key\s*[:=]\s*)[^\s,}]+/gi, '$1[redacted]')
}

module.exports = (error, request, response, next) => {
  if (response.headersSent) {
    return next(error)
  }

  if (error.type === 'entity.parse.failed') {
    return response.status(400).json({ error: 'Invalid JSON request body' })
  }

  if (error.code === 'LIMIT_FILE_SIZE') {
    return response.status(413).json({ error: 'Image must be 5 MB or smaller' })
  }

  if (error.code === 'INVALID_IMAGE_TYPE') {
    return response.status(400).json({ error: 'Only JPEG, PNG, and WebP images are allowed' })
  }

  const safeMessage = redactSecrets(error.message)
  const details = {
    method: request.method,
    path: request.path,
    name: error.name,
    code: error.code || error.http_code || 'UNKNOWN',
    message: safeMessage,
  }

  if (process.env.NODE_ENV !== 'production' && error.stack) {
    details.stack = redactSecrets(error.stack.split('\n').slice(0, 6).join('\n'))
  }

  console.error('API request failed', details)

  if (error.code === 'CLOUDINARY_UPLOAD') {
    return response.status(502).json({ error: 'Cloudinary upload failed; check the backend terminal for details' })
  }

  return response.status(500).json({ error: 'Internal server error' })
}