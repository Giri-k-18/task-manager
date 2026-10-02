const assert = require('node:assert/strict')
const test = require('node:test')
const { processDueDateReminders } = require('./dueReminder.service')

const now = new Date('2026-10-02T10:00:00.000Z')
const task = {
  id: 'task-1',
  title: 'Review release',
  dueDate: new Date('2026-10-03T09:00:00.000Z'),
  owner: { email: 'person@example.com' },
}

test('reminders require configured email before querying tasks', async () => {
  let queried = false
  const client = { task: { findMany: async () => { queried = true; return [] } } }

  await assert.rejects(
    processDueDateReminders({ client, isConfigured: () => false, now }),
    { code: 'EMAIL_CONFIG' },
  )
  assert.equal(queried, false)
})

test('claims and marks a due task after sending one reminder', async () => {
  const updates = []
  let query
  let deliveredTo
  const client = {
    task: {
      findMany: async (args) => { query = args; return [task] },
      updateMany: async (args) => { updates.push(args); return { count: 1 } },
    },
  }

  const result = await processDueDateReminders({
    client,
    isConfigured: () => true,
    sendEmail: async (to) => { deliveredTo = to; return true },
    now,
  })

  assert.equal(query.where.dueDate.gt, now)
  assert.equal(query.where.dueDate.lte.getTime(), now.getTime() + 24 * 60 * 60 * 1000)
  assert.deepEqual(query.where.status, { not: 'completed' })
  assert.equal(deliveredTo, task.owner.email)
  assert.equal(updates.length, 2)
  assert.equal(updates[0].data.reminderClaimedAt, now)
  assert.equal(updates[1].data.reminderSentAt, now)
  assert.deepEqual(result, { checked: 1, sent: 1, failed: 0, skipped: 0 })
})

test('skips a reminder already claimed by another invocation', async () => {
  let sendCount = 0
  let updateCount = 0
  const client = {
    task: {
      findMany: async () => [task],
      updateMany: async () => { updateCount += 1; return { count: 0 } },
    },
  }

  const result = await processDueDateReminders({
    client,
    isConfigured: () => true,
    sendEmail: async () => { sendCount += 1; return true },
    now,
  })

  assert.equal(updateCount, 1)
  assert.equal(sendCount, 0)
  assert.deepEqual(result, { checked: 1, sent: 0, failed: 0, skipped: 1 })
})

test('releases a reminder claim when email delivery fails', async () => {
  const updates = []
  const client = {
    task: {
      findMany: async () => [task],
      updateMany: async (args) => { updates.push(args); return { count: 1 } },
    },
  }

  const result = await processDueDateReminders({
    client,
    isConfigured: () => true,
    sendEmail: async () => { throw new Error('SMTP unavailable') },
    now,
  })

  assert.equal(updates.length, 2)
  assert.equal(updates[1].data.reminderClaimedAt, null)
  assert.deepEqual(result, { checked: 1, sent: 0, failed: 1, skipped: 0 })
})