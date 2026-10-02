module.exports = (schema) => (request, response, next) => {
  const result = schema.safeParse(request.body)

  if (!result.success) {
    return response.status(400).json({
      error: 'Invalid request body',
      details: result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    })
  }

  request.validatedBody = result.data
  next()
}