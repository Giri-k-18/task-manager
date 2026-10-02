const assert = require('node:assert/strict')
const test = require('node:test')
const { createDueDateReminderEmail, createWelcomeEmail } = require('./emailTemplates')

test('welcome email includes a safe dashboard link and inline styling', () => {
  const email = createWelcomeEmail({ appUrl: 'https://tasks.example.com/' })

  assert.equal(email.subject, 'Welcome to Task Manager')
  assert.match(email.html, /href="https:\/\/tasks\.example\.com"/)
  assert.match(email.html, /style="/)
  assert.match(email.text, /https:\/\/tasks\.example\.com/)
})

test('due-date reminder escapes task content and removes subject newlines', () => {
  const email = createDueDateReminderEmail({
    taskTitle: '<script>alert("x")</script>\nNext & task',
    dueDate: '2026-10-03T10:00:00.000Z',
    appUrl: 'https://tasks.example.com',
  })

  assert.match(email.subject, /Task due soon: <script>alert\("x"\)<\/script> Next & task/)
  assert.doesNotMatch(email.subject, /\r|\n/)
  assert.match(email.html, /&lt;script&gt;/)
  assert.match(email.html, /&amp; task/)
  assert.doesNotMatch(email.html, /<script>/)
  assert.match(email.text, /3 Oct 2026/)
})

test('invalid app URLs fall back to a local dashboard URL', () => {
  const email = createWelcomeEmail({ appUrl: 'javascript:alert(1)' })

  assert.match(email.html, /href="http:\/\/localhost:5173"/)
})

test('due-date reminder rejects invalid dates', () => {
  assert.throws(
    () => createDueDateReminderEmail({ taskTitle: 'Task', dueDate: 'not-a-date' }),
    { name: 'TypeError', message: 'A valid due date is required' },
  )
})