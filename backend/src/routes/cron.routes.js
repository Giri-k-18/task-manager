const express = require('express')
const requireCronAuth = require('../middleware/requireCronAuth')
const { sendDueDateReminders } = require('../controllers/cron.controller')

const router = express.Router()

router.get('/due-reminders', requireCronAuth, sendDueDateReminders)

module.exports = router