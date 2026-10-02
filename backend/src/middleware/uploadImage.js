const multer = require('multer')

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_request, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      const error = new Error('Only JPEG, PNG, and WebP images are allowed')
      error.code = 'INVALID_IMAGE_TYPE'
      return callback(error)
    }

    return callback(null, true)
  },
})

module.exports = uploadImage