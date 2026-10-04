const { Resend } = require('resend')

const {
  createDueDateReminderEmail,
  createWelcomeEmail,
} = require('./emailTemplates')

const resend = new Resend(process.env.RESEND_API_KEY)

function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY)
}

async function sendEmail(to, message) {
  if (!isEmailConfigured()) {
    console.warn('Resend is not configured')
    return false
  }

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'Task Manager <onboarding@resend.dev>',
    to: [to],
    subject: message.subject,
    html: message.html,
  })

  if (error) {
    console.error('Resend email error:', error)
    return false
  }

  console.log('Email sent successfully:', data?.id)

  return true
}

function sendWelcomeEmail(to) {
  return sendEmail(
    to,
    createWelcomeEmail({
      appUrl: process.env.APP_URL,
    }),
  )
}

function sendDueDateReminderEmail(to, task) {
  return sendEmail(
    to,
    createDueDateReminderEmail({
      taskTitle: task.title,
      dueDate: task.dueDate,
      appUrl: process.env.APP_URL,
    }),
  )
}

module.exports = {
  isEmailConfigured,
  sendDueDateReminderEmail,
  sendWelcomeEmail,
}