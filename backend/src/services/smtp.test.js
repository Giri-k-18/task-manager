require('dotenv').config()

const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

async function testSMTP() {
  try {
    console.log('Testing SMTP connection...')

    await transporter.verify()

    console.log('SMTP connection successful')

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: 'task@gmail.com',
      subject: 'Task Manager SMTP Test',
      text: 'This is a real SMTP test email from Task Manager.',
    })

    console.log('Email sent successfully')
    console.log('Message ID:', info.messageId)
    console.log('Response:', info.response)
  } catch (error) {
    console.error('SMTP TEST FAILED')
    console.error(error)
  }
}

testSMTP()