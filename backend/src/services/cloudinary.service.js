const { randomUUID } = require('node:crypto')
const { getCloudinary } = require('../config/cloudinary')

function detectImageMime(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg'
  }

  if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return 'image/png'
  }

  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp'
  }

  return null
}

function getOwnedPublicId(imageUrl, userId) {
  try {
    const parsedUrl = new URL(imageUrl)
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME

    if (
      !cloudName ||
      parsedUrl.protocol !== 'https:' ||
      parsedUrl.hostname !== 'res.cloudinary.com'
    ) {
      return null
    }

    const pathSegments = parsedUrl.pathname.split('/').filter(Boolean).map(decodeURIComponent)
    if (
      pathSegments[0] !== cloudName ||
      pathSegments[1] !== 'image' ||
      pathSegments[2] !== 'upload'
    ) {
      return null
    }

    const publicIdSegments = pathSegments.slice(3)
    if (/^v\d+$/.test(publicIdSegments[0] || '')) {
      publicIdSegments.shift()
    }

    const lastSegment = publicIdSegments.at(-1)
    if (!lastSegment || !lastSegment.includes('.')) {
      return null
    }
    publicIdSegments[publicIdSegments.length - 1] = lastSegment.slice(0, lastSegment.lastIndexOf('.'))

    const publicId = publicIdSegments.join('/')
    const userFolder = `task-manager/${userId}/`

    return publicId?.startsWith(userFolder) ? publicId : null
  } catch {
    return null
  }
}

function createThumbnailUrl(cloudinary, publicId) {
  return cloudinary.url(publicId, {
    secure: true,
    transformation: [{ width: 150, height: 150, crop: 'fill', quality: 'auto', fetch_format: 'auto' }],
  })
}

function getTaskThumbnailUrl(imageUrl, userId) {
  const publicId = getOwnedPublicId(imageUrl, userId)
  if (!publicId) return null

  try {
    return createThumbnailUrl(getCloudinary(), publicId)
  } catch {
    return null
  }
}

function uploadTaskImage(buffer, userId) {
  const cloudinary = getCloudinary()
  const publicId = `task-manager/${userId}/${randomUUID()}`

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: 'image',
        format: 'webp',
      },
      (error, result) => {
        if (error) {
          return reject(error)
        }

        const thumbnailUrl = createThumbnailUrl(cloudinary, result.public_id)

        return resolve({ imageUrl: result.secure_url, thumbnailUrl })
      },
    )

    stream.end(buffer)
  })
}

async function deleteTaskImage(imageUrl, userId) {
  const cloudinary = getCloudinary()
  const publicId = getOwnedPublicId(imageUrl, userId)

  if (!publicId) {
    const error = new Error('Cloudinary image does not belong to this user')
    error.code = 'IMAGE_OWNERSHIP'
    throw error
  }

  const result = await cloudinary.uploader.destroy(publicId, {
    invalidate: true,
    resource_type: 'image',
  })

  if (result.result !== 'ok' && result.result !== 'not found') {
    const error = new Error('Cloudinary could not delete the image')
    error.code = 'CLOUDINARY_DELETE'
    throw error
  }
}

module.exports = {
  deleteTaskImage,
  detectImageMime,
  getOwnedPublicId,
  getTaskThumbnailUrl,
  uploadTaskImage,
}