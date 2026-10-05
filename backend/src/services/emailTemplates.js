const DEFAULT_APP_URL = 'https://task-manager-m9chq5ny1-girikumar123s-projects.vercel.app'

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const replacements = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }

    return replacements[character]
  })
}

function getAppUrl(value) {
  try {
    const url = new URL(value || DEFAULT_APP_URL)

    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password
    ) {
      return DEFAULT_APP_URL
    }

    return `${url.origin}${url.pathname.replace(/\/$/, '')}`
  } catch {
    return DEFAULT_APP_URL
  }
}

function createWelcomeEmail({ appUrl }) {
  const loginUrl = getAppUrl(appUrl)

  return {
    subject: 'Welcome to Task Manager',

    text: `Welcome to Task Manager.

Your account is ready.

Login to your Task Manager:
${loginUrl}`,

    html: `
      <table
        role="presentation"
        width="100%"
        cellpadding="0"
        cellspacing="0"
        style="background:#f1f5f9;padding:32px 12px;font-family:Arial,sans-serif;color:#172033"
      >
        <tr>
          <td align="center">

            <table
              role="presentation"
              width="100%"
              cellpadding="0"
              cellspacing="0"
              style="max-width:560px;background:#ffffff;border:1px solid #dbe2ec;border-radius:12px"
            >

              <tr>
                <td style="padding:32px">

                  <p
                    style="margin:0 0 8px;color:#0f766e;font-size:13px;font-weight:bold;text-transform:uppercase"
                  >
                    Task Manager
                  </p>

                  <h1
                    style="margin:0 0 16px;font-size:26px;line-height:1.25;color:#172033"
                  >
                    Welcome aboard
                  </h1>

                  <p
                    style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#475569"
                  >
                    Your account is ready. Organize your work, track progress,
                    and keep important dates in view.
                  </p>

                  <a
                    href="${escapeHtml(loginUrl)}"
                    style="display:inline-block;padding:13px 20px;border-radius:6px;background:#0f766e;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none"
                  >
                    Login to Task Manager
                  </a>

                  <p
                    style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#64748b"
                  >
                    Click the button above to open the Task Manager login page.
                  </p>

                </td>
              </tr>

            </table>

          </td>
        </tr>
      </table>
    `,
  }
}

function createDueDateReminderEmail({
  taskTitle,
  dueDate,
  appUrl,
}) {
  const date =
    dueDate instanceof Date
      ? dueDate
      : new Date(dueDate)

  if (Number.isNaN(date.getTime())) {
    throw new TypeError('A valid due date is required')
  }

  const title = String(taskTitle || 'Untitled task')

  const formattedDate = new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(date)

  const loginUrl = getAppUrl(appUrl)

  return {
    subject: `Task due soon: ${title.replace(/[\r\n]+/g, ' ')}`,

    text: `Reminder: "${title}" is due on ${formattedDate} UTC.

Login to Task Manager:
${loginUrl}`,

    html: `
      <table
        role="presentation"
        width="100%"
        cellpadding="0"
        cellspacing="0"
        style="background:#f1f5f9;padding:32px 12px;font-family:Arial,sans-serif;color:#172033"
      >

        <tr>
          <td align="center">

            <table
              role="presentation"
              width="100%"
              cellpadding="0"
              cellspacing="0"
              style="max-width:560px;background:#ffffff;border:1px solid #dbe2ec;border-radius:12px"
            >

              <tr>
                <td style="padding:32px">

                  <p
                    style="margin:0 0 8px;color:#b45309;font-size:13px;font-weight:bold;text-transform:uppercase"
                  >
                    Task Reminder
                  </p>

                  <h1
                    style="margin:0 0 16px;font-size:24px;line-height:1.3;color:#172033"
                  >
                    A task is due soon
                  </h1>

                  <p
                    style="margin:0 0 8px;font-size:17px;line-height:1.5;color:#172033"
                  >
                    <strong>${escapeHtml(title)}</strong>
                  </p>

                  <p
                    style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#475569"
                  >
                    Due ${escapeHtml(formattedDate)} UTC
                  </p>

                  <a
                    href="${escapeHtml(loginUrl)}"
                    style="display:inline-block;padding:13px 20px;border-radius:6px;background:#0f766e;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none"
                  >
                    Login & Review Task
                  </a>

                  <p
                    style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#64748b"
                  >
                    Login to your Task Manager account to review this task.
                  </p>

                </td>
              </tr>

            </table>

          </td>
        </tr>

      </table>
    `,
  }
}

module.exports = {
  createDueDateReminderEmail,
  createWelcomeEmail,
}