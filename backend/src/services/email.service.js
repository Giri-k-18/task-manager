const nodemailer = require('nodemailer')
const { createDueDateReminderEmail, createWelcomeEmail } = require('./emailTemplates')

function isEmailConfigured() {
  const requiredValues = [
    process.env.SMTP_HOST,
    process.env.SMTP_PORT,
    process.env.SMTP_USER,
    process.env.SMTP_PASSWORD,
    process.env.EMAIL_FROM,
  ]
  const port = Number(process.env.SMTP_PORT)

  return requiredValues.every((value) => Boolean(value)) && Number.isInteger(port) && port > 0 && port < 65536
}

function createEmailTransport() {
  const port = Number(process.env.SMTP_PORT)
  const secure = process.env.SMTP_SECURE
    ? process.env.SMTP_SECURE === 'true'
    : port === 465

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 10_000,
  })
}

async function sendEmail(to, message) {
  if (!isEmailConfigured()) return false

  const transport = createEmailTransport()
  await transport.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    ...message,
  })
  return true
}

function sendWelcomeEmail(to) {
  return sendEmail(to, createWelcomeEmail({ appUrl: process.env.APP_URL }))
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

module.exports = { isEmailConfigured, sendDueDateReminderEmail, sendWelcomeEmail }