import assert from 'node:assert/strict'
import test from 'node:test'
import { filterTasks } from './taskFilters.js'

const tasks = [
  {
    id: '1',
    title: 'Prepare release',
    description: 'Check the deployment notes',
    status: 'pending',
    dueDate: '2026-10-10T00:00:00.000Z',
  },
  {
    id: '2',
    title: 'Review design',
    description: null,
    status: 'completed',
    dueDate: '2026-10-11T00:00:00.000Z',
  },
  { id: '3', title: 'No deadline', description: '', status: 'pending', dueDate: null },
]

test('filters tasks by keyword and status together', () => {
  assert.deepEqual(
    filterTasks(tasks, { status: 'pending', searchTerm: 'DEPLOYMENT' }).map((task) => task.id),
    ['1'],
  )
})

test('filters an exact UTC calendar due date and excludes undated tasks', () => {
  assert.deepEqual(
    filterTasks(tasks, { dueDate: '2026-10-10' }).map((task) => task.id),
    ['1'],
  )
})

test('returns all tasks when every filter is unset', () => {
  assert.deepEqual(filterTasks(tasks).map((task) => task.id), ['1', '2', '3'])
})