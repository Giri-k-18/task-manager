const assert = require('node:assert/strict')
const test = require('node:test')
const { getTaskThumbnailUrl } = require('./cloudinary.service')

test('task thumbnails use the owned Cloudinary image transformation', () => {
  const keys = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']
  const previousValues = Object.fromEntries(keys.map((key) => [key, process.env[key]]))
  process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud'
  process.env.CLOUDINARY_API_KEY = 'test-key'
  process.env.CLOUDINARY_API_SECRET = 'test-secret'

  try {
    const thumbnailUrl = getTaskThumbnailUrl(
      'https://res.cloudinary.com/test-cloud/image/upload/v123/task-manager/user-1/task.webp',
      'user-1',
    )

    assert.match(thumbnailUrl, /^https:\/\/res\.cloudinary\.com\/test-cloud\/image\/upload\//)
    assert.match(thumbnailUrl, /c_fill/)
    assert.match(thumbnailUrl, /w_150/)
    assert.match(thumbnailUrl, /h_150/)
  } finally {
    keys.forEach((key) => {
      if (previousValues[key] === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = previousValues[key]
      }
    })
  }
})

test('task thumbnails are not generated for another user image', () => {
  assert.equal(
    getTaskThumbnailUrl(
      'https://res.cloudinary.com/test-cloud/image/upload/v123/task-manager/user-1/task.webp',
      'user-2',
    ),
    null,
  )
})