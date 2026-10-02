const express = require('express')
const authController = require('../controllers/auth.controller')
const validateBody = require('../middleware/validateBody')
const { credentialsSchema } = require('../validators/auth.schemas')

const router = express.Router()

router.post('/register', validateBody(credentialsSchema), authController.register)
router.post('/login', validateBody(credentialsSchema), authController.login)

module.exports = router