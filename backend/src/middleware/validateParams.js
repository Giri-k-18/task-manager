module.exports = (schema) => (request, response, next) => {
  const result = schema.safeParse(request.params)

  if (!result.success) {
    return response.status(400).json({
      error: 'Invalid route parameter',
      details: result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    })
  }

  request.validatedParams = result.data
  next()
}