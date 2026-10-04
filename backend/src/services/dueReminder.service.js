const prisma = require('../config/prisma')
const { isEmailConfigured, sendDueDateReminderEmail } = require('./email.service')

const HOUR_IN_MS = 60 * 60 * 1000
const CLAIM_TIMEOUT_IN_MS = 15 * 60 * 1000

async function processDueDateReminders({
  client = prisma,
  isConfigured = isEmailConfigured,
  sendEmail = sendDueDateReminderEmail,
  now = new Date(),
} = {}) {
  if (!isConfigured()) {
    const error = new Error('Email service is not configured')
    error.code = 'EMAIL_CONFIG'
    throw error
  }

  const dueBefore = new Date(now.getTime() + 24 * HOUR_IN_MS)
  console.log('========== DUE REMINDER DEBUG ==========')
console.log('Current time:', now.toISOString())
console.log('Due before:', dueBefore.toISOString())
  const staleClaimBefore = new Date(now.getTime() - CLAIM_TIMEOUT_IN_MS)
  const tasks = await client.task.findMany({
    where: {
      dueDate: { gt: now, lte: dueBefore },
      reminderSentAt: null,
      status: { not: 'completed' },
    },
    orderBy: { dueDate: 'asc' },
    select: {
      id: true,
      title: true,
      dueDate: true,
      owner: { select: { email: true } },
    },
  })
  console.log('Tasks found for reminder:', tasks.length)

for (const task of tasks) {
  console.log({
    id: task.id,
    title: task.title,
    dueDate: task.dueDate,
    ownerEmail: task.owner.email,
  })
}

console.log('========================================')

  const result = { checked: tasks.length, sent: 0, failed: 0, skipped: 0 }

  for (const task of tasks) {
    const claim = await client.task.updateMany({
      where: {
        id: task.id,
        reminderSentAt: null,
        OR: [
          { reminderClaimedAt: null },
          { reminderClaimedAt: { lt: staleClaimBefore } },
        ],
      },
      data: { reminderClaimedAt: now },
    })

    if (claim.count === 0) {
      result.skipped += 1
      continue
    }

    try {
      const sent = await sendEmail(task.owner.email, task)
      if (!sent) throw new Error('Email delivery is unavailable')

      const markedSent = await client.task.updateMany({
        where: { id: task.id, reminderSentAt: null, reminderClaimedAt: now },
        data: { reminderClaimedAt: null, reminderSentAt: now },
      })

      if (markedSent.count === 0) {
        result.skipped += 1
        continue
      }

      result.sent += 1
    } catch {
      await client.task.updateMany({
        where: { id: task.id, reminderSentAt: null, reminderClaimedAt: now },
        data: { reminderClaimedAt: null },
      })
      result.failed += 1
      console.error('Due date reminder delivery failed')
    }
  }

  return result
}

module.exports = { processDueDateReminders }