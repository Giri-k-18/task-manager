const express = require('express')
const requireAuth = require('../middleware/requireAuth')
const uploadImage = require('../middleware/uploadImage')
const { uploadTaskImageController } = require('../controllers/upload.controller')

const router = express.Router()

router.post('/task-image', requireAuth, uploadImage.single('image'), uploadTaskImageController)

module.exports = router