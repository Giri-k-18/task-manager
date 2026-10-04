const { v2: cloudinary } = require('cloudinary')

function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  )
}

function getCloudinary() {
  if (!isCloudinaryConfigured()) {
    const error = new Error('Cloudinary is not configured')
    error.code = 'CLOUDINARY_CONFIG'
    throw error
  }

  cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

  return cloudinary
}

module.exports = { getCloudinary, isCloudinaryConfigured }