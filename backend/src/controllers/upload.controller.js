const { isCloudinaryConfigured } = require('../config/cloudinary')
const { detectImageMime, uploadTaskImage } = require('../services/cloudinary.service')

async function uploadTaskImageController(request, response, next) {
  if (!request.file) {
    return response.status(400).json({ error: 'An image file is required' })
  }

  if (detectImageMime(request.file.buffer) !== request.file.mimetype) {
    return response.status(400).json({ error: 'The uploaded file is not a valid supported image' })
  }

  if (!isCloudinaryConfigured()) {
    return response.status(503).json({ error: 'Image uploads are not configured' })
  }

  try {
    const image = await uploadTaskImage(request.file.buffer, request.user.id)
    return response.status(201).json(image)
  } catch (error) {
    error.code = 'CLOUDINARY_UPLOAD'
    return next(error)
  }
}

module.exports = { uploadTaskImageController }