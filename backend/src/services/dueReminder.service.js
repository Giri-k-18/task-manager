const prisma = require('../config/prisma')
const {
  isEmailConfigured,
  sendDueDateReminderEmail,
} = require('./email.service')

const HOUR_IN_MS = 60 * 60 * 1000
const CLAIM_TIMEOUT_IN_MS = 15 * 60 * 1000

async function processDueDateReminders({
  client = prisma,
  isConfigured = isEmailConfigured,
  sendEmail = sendDueDateReminderEmail,
  now = new Date(),
} = {}) {
  // 1. Check email configuration
  if (!isConfigured()) {
    const error = new Error('Email service is not configured')
    error.code = 'EMAIL_CONFIG'
    throw error
  }

  // 2. Find tasks due within the next 24 hours
  const dueBefore = new Date(now.getTime() + 24 * HOUR_IN_MS)

  // 3. Allow old/stuck claims to be processed again
  const staleClaimBefore = new Date(
    now.getTime() - CLAIM_TIMEOUT_IN_MS
  )

  // 4. Get eligible tasks
  const tasks = await client.task.findMany({
    where: {
      dueDate: {
        gt: now,
        lte: dueBefore,
      },
      reminderSentAt: null,
      status: {
        not: 'completed',
      },
    },
    orderBy: {
      dueDate: 'asc',
    },
    select: {
      id: true,
      title: true,
      dueDate: true,
      owner: {
        select: {
          email: true,
        },
      },
    },
  })

  // 5. Small response object for cron-job.org
  const result = {
    checked: tasks.length,
    sent: 0,
    failed: 0,
    skipped: 0,
  }

  // 6. Process each task
  for (const task of tasks) {
    // Claim the task so multiple cron executions
    // don't send duplicate emails
    const claim = await client.task.updateMany({
      where: {
        id: task.id,
        reminderSentAt: null,
        OR: [
          {
            reminderClaimedAt: null,
          },
          {
            reminderClaimedAt: {
              lt: staleClaimBefore,
            },
          },
        ],
      },
      data: {
        reminderClaimedAt: now,
      },
    })

    // Task was already claimed by another process
    if (claim.count === 0) {
      result.skipped += 1
      continue
    }

    try {
      // 7. Send reminder email
      const sent = await sendEmail(
        task.owner.email,
        task
      )

      if (!sent) {
        throw new Error('Email delivery is unavailable')
      }

      // 8. Mark reminder as successfully sent
      const markedSent = await client.task.updateMany({
        where: {
          id: task.id,
          reminderSentAt: null,
          reminderClaimedAt: now,
        },
        data: {
          reminderClaimedAt: null,
          reminderSentAt: now,
        },
      })

      // Another process changed the task
      if (markedSent.count === 0) {
        result.skipped += 1
        continue
      }

      result.sent += 1
    } catch (error) {
      // 9. Release the claim if email failed
      await client.task.updateMany({
        where: {
          id: task.id,
          reminderSentAt: null,
          reminderClaimedAt: now,
        },
        data: {
          reminderClaimedAt: null,
        },
      })

      result.failed += 1

      console.error(
        'Due date reminder delivery failed:',
        error.message
      )
    }
  }

  // 10. Return only a small JSON response
  return result
}

module.exports = {
  processDueDateReminders,
}