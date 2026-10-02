function getUtcDate(value) {
  if (!value) return ''

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10)
}

export function filterTasks(tasks, { status = 'all', searchTerm = '', dueDate = '' } = {}) {
  const normalizedSearch = searchTerm.toLowerCase()

  return tasks.filter((task) => {
    const matchesStatus = status === 'all' || task.status === status
    const content = `${task.title} ${task.description || ''}`.toLowerCase()
    const matchesSearch = content.includes(normalizedSearch)
    const matchesDueDate = !dueDate || getUtcDate(task.dueDate) === dueDate

    return matchesStatus && matchesSearch && matchesDueDate
  })
}