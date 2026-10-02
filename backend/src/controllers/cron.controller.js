const { processDueDateReminders } = require('../services/dueReminder.service')

async function sendDueDateReminders(_request, response, next) {
  try {
    const result = await processDueDateReminders()
    return response.status(200).json(result)
  } catch (error) {
    if (error.code === 'EMAIL_CONFIG') {
      return response.status(503).json({ error: 'Email service is not configured' })
    }

    return next(error)
  }
}

module.exports = { sendDueDateReminders }