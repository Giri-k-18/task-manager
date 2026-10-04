const { processDueDateReminders } = require('../services/dueReminder.service')

async function sendDueDateReminders(_request, response, next) {
  try {
    await processDueDateReminders()

    return response.status(200).json({
      success: true,
      message: 'Due reminders processed successfully'
    })
  } catch (error) {
    if (error.code === 'EMAIL_CONFIG') {
      return response.status(503).json({
        success: false,
        error: 'Email service is not configured'
      })
    }

    return next(error)
  }
}

module.exports = { sendDueDateReminders }