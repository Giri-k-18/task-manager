import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:4000'
const AUTH_STORAGE_KEY = 'task-manager-auth'
const THEME_STORAGE_KEY = 'task-manager-theme'
const EMPTY_FORM = {
  title: '',
  description: '',
  status: 'pending',
  dueDate: '',
  imageUrl: '',
}

const statusOptions = ['all', 'pending', 'in_progress', 'completed']

function formatDate(value) {
  if (!value) return 'No due date'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'No due date'

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
  }).format(date)
}

function readStoredSession() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    if (!parsed?.token || !parsed?.user) return null

    return parsed
  } catch {
    return null
  }
}

function App() {
  const [session, setSession] = useState(() => readStoredSession())
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState({ email: 'demo@example.com', password: 'Demo@123' })
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [tasks, setTasks] = useState([])
  const [taskFilter, setTaskFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isDark, setIsDark] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) === 'dark')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [taskForm, setTaskForm] = useState(EMPTY_FORM)
  const [taskError, setTaskError] = useState('')
  const [taskLoading, setTaskLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    document.body.dataset.theme = isDark ? 'dark' : 'light'
    localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light')
  }, [isDark])

  useEffect(() => {
    if (!session?.token) {
      setTasks([])
      return
    }

    const fetchTasks = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/tasks`, {
          headers: {
            Authorization: `Bearer ${session.token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Unable to fetch tasks')
        }

        const payload = await response.json()
        setTasks(payload.tasks || [])
      } catch (error) {
        setTaskError(error.message)
      }
    }

    fetchTasks()
  }, [session])

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesFilter = taskFilter === 'all' || task.status === taskFilter
      const haystack = `${task.title} ${task.description || ''}`.toLowerCase()
      const matchesSearch = haystack.includes(searchTerm.toLowerCase())
      return matchesFilter && matchesSearch
    })
  }, [tasks, taskFilter, searchTerm])

  const taskStats = useMemo(() => {
    return {
      total: tasks.length,
      pending: tasks.filter((task) => task.status === 'pending').length,
      inProgress: tasks.filter((task) => task.status === 'in_progress').length,
      completed: tasks.filter((task) => task.status === 'completed').length,
    }
  }, [tasks])

  const saveSession = (authData) => {
    const nextSession = {
      token: authData.token,
      user: authData.user,
    }

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextSession))
    setSession(nextSession)
  }

  const handleAuthSubmit = async (event) => {
    event.preventDefault()
    setAuthError('')
    setAuthLoading(true)

    try {
      const response = await fetch(`${API_BASE}/api/auth/${authMode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(authForm),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Authentication failed')
      }

      saveSession(payload)
      setAuthForm({ email: '', password: '' })
    } catch (error) {
      setAuthError(error.message)
    } finally {
      setAuthLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    setSession(null)
    setTasks([])
  }

  const openCreateModal = () => {
    setEditingTask(null)
    setTaskForm(EMPTY_FORM)
    setTaskError('')
    setIsModalOpen(true)
  }

  const openEditModal = (task) => {
    setEditingTask(task)
    setTaskForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '',
      imageUrl: task.imageUrl || '',
    })
    setTaskError('')
    setIsModalOpen(true)
  }

  const handleTaskInput = (event) => {
    const { name, value } = event.target
    setTaskForm((current) => ({ ...current, [name]: value }))
  }

  const uploadImage = async (file) => {
    if (!file) return ''

    const formData = new FormData()
    formData.append('image', file)

    setUploadingImage(true)
    try {
      const response = await fetch(`${API_BASE}/api/uploads/task-image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
        body: formData,
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error || 'Image upload failed')
      }

      return payload.imageUrl || ''
    } catch (error) {
      throw new Error(error.message)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleTaskSubmit = async (event) => {
    event.preventDefault()
    setTaskError('')
    setTaskLoading(true)

    try {
      let imageUrl = taskForm.imageUrl
      const file = event.target.elements.image.files?.[0]

      if (file) {
        imageUrl = await uploadImage(file)
      }

      const payload = {
        title: taskForm.title.trim(),
        description: taskForm.description.trim() || null,
        status: taskForm.status,
        dueDate: taskForm.dueDate ? new Date(taskForm.dueDate).toISOString() : null,
        imageUrl: imageUrl || null,
      }

      const url = editingTask
        ? `${API_BASE}/api/tasks/${editingTask.id}`
        : `${API_BASE}/api/tasks`
      const method = editingTask ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Unable to save task')
      }

      const updatedList = editingTask
        ? tasks.map((task) => (task.id === result.task.id ? result.task : task))
        : [result.task, ...tasks]

      setTasks(updatedList)
      setIsModalOpen(false)
      setTaskForm(EMPTY_FORM)
      setEditingTask(null)
    } catch (error) {
      setTaskError(error.message)
    } finally {
      setTaskLoading(false)
    }
  }

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return

    try {
      const response = await fetch(`${API_BASE}/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || 'Unable to delete task')
      }

      setTasks((current) => current.filter((task) => task.id !== taskId))
    } catch (error) {
      setTaskError(error.message)
    }
  }

  const changeTaskStatus = async (taskId, nextStatus) => {
    try {
      const response = await fetch(`${API_BASE}/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to update task status')
      }

      setTasks((current) =>
        current.map((task) => (task.id === taskId ? payload.task : task)),
      )
    } catch (error) {
      setTaskError(error.message)
    }
  }

  if (!session) {
    return (
      <div className="auth-shell">
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />
        <div className="auth-card reveal-card">
          <div className="brand-row">
            <div className="brand-mark">T</div>
            <div>
              <p className="eyebrow">Task Manager</p>
              <h1>Welcome back</h1>
            </div>
          </div>

          <div className="auth-toggle" role="tablist" aria-label="Authentication mode">
            <button
              type="button"
              className={authMode === 'login' ? 'mode active' : 'mode'}
              onClick={() => setAuthMode('login')}
            >
              Login
            </button>
            <button
              type="button"
              className={authMode === 'register' ? 'mode active' : 'mode'}
              onClick={() => setAuthMode('register')}
            >
              Register
            </button>
          </div>

          <form className="auth-form" onSubmit={handleAuthSubmit}>
            <label>
              Email
              <input
                type="email"
                value={authForm.email}
                onChange={(event) => setAuthForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="you@example.com"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={authForm.password}
                onChange={(event) => setAuthForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="Enter your password"
                required
              />
            </label>

            {authError ? <p className="form-error">{authError}</p> : null}

            <button type="submit" className="primary-button" disabled={authLoading}>
              {authLoading ? 'Please wait...' : authMode === 'login' ? 'Login' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <header className="topbar reveal-card">
        <div className="brand-row">
          <div className="brand-mark">T</div>
          <div>
            <p className="eyebrow">Task Manager</p>
            <h2>Dashboard</h2>
          </div>
        </div>

        <div className="topbar-actions">
          <input
            type="search"
            className="search-input"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search tasks"
            aria-label="Search tasks"
          />

          <button type="button" className="secondary-button" onClick={() => setIsDark((value) => !value)}>
            {isDark ? 'Light mode' : 'Dark mode'}
          </button>
          <button type="button" className="ghost-button" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <main className="content-panel">
        <section className="stats-grid">
          <article className="stat-card reveal-card">
            <span>Total</span>
            <strong>{taskStats.total}</strong>
          </article>
          <article className="stat-card muted reveal-card">
            <span>Pending</span>
            <strong>{taskStats.pending}</strong>
          </article>
          <article className="stat-card accent reveal-card">
            <span>In progress</span>
            <strong>{taskStats.inProgress}</strong>
          </article>
          <article className="stat-card success reveal-card">
            <span>Completed</span>
            <strong>{taskStats.completed}</strong>
          </article>
        </section>

        <div className="toolbar">
          <div className="filter-group" aria-label="Task status filters">
            {statusOptions.map((option) => (
              <button
                key={option}
                type="button"
                className={taskFilter === option ? 'filter active' : 'filter'}
                onClick={() => setTaskFilter(option)}
              >
                {option === 'all' ? 'All' : option.replace('_', ' ')}
              </button>
            ))}
          </div>

          <button type="button" className="primary-button" onClick={openCreateModal}>
            + New task
          </button>
        </div>

        {taskError ? <p className="form-error wide-error">{taskError}</p> : null}

        <section className="task-list">
          {filteredTasks.length === 0 ? (
            <div className="empty-state">
              <h3>No tasks match this view</h3>
              <p>Create a new task to get started.</p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <article key={task.id} className="task-card reveal-card">
                {task.imageUrl ? (
                  <img src={task.imageUrl} alt={task.title} className="task-image" />
                ) : null}

                <div className="task-content">
                  <div className="task-header">
                    <div>
                      <h3>{task.title}</h3>
                      <p className="task-date">Due: {formatDate(task.dueDate)}</p>
                    </div>
                    <span className={`status-badge ${task.status}`}>
                      {task.status === 'in_progress' ? 'In progress' : task.status}
                    </span>
                  </div>

                  <p className="task-description">{task.description || 'No description provided.'}</p>

                  <div className="task-actions">
                    <select
                      value={task.status}
                      onChange={(event) => changeTaskStatus(task.id, event.target.value)}
                      aria-label={`Update status for ${task.title}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In progress</option>
                      <option value="completed">Completed</option>
                    </select>

                    <div className="inline-actions">
                      <button type="button" className="secondary-button" onClick={() => openEditModal(task)}>
                        Edit
                      </button>
                      <button type="button" className="ghost-button danger" onClick={() => handleDeleteTask(task.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      </main>

      {isModalOpen ? (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="task-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingTask ? 'Edit task' : 'Create task'}</h3>
              <button type="button" className="icon-close" onClick={() => setIsModalOpen(false)} aria-label="Close task form">
                ×
              </button>
            </div>

            <form onSubmit={handleTaskSubmit} className="task-form">
              <label>
                Title
                <input
                  type="text"
                  name="title"
                  required
                  value={taskForm.title}
                  onChange={handleTaskInput}
                  placeholder="Task title"
                />
              </label>

              <label>
                Description
                <textarea
                  name="description"
                  rows="4"
                  value={taskForm.description}
                  onChange={handleTaskInput}
                  placeholder="Add more details"
                />
              </label>

              <div className="two-column">
                <label>
                  Status
                  <select name="status" value={taskForm.status} onChange={handleTaskInput}>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </label>

                <label>
                  Due date
                  <input
                    type="date"
                    name="dueDate"
                    value={taskForm.dueDate}
                    onChange={handleTaskInput}
                  />
                </label>
              </div>

              <label>
                Task image
                <input type="file" name="image" accept="image/*" />
              </label>

              {taskForm.imageUrl ? (
                <div className="image-preview-wrap">
                  <img src={taskForm.imageUrl} alt="Task preview" className="image-preview" />
                </div>
              ) : null}

              {taskError ? <p className="form-error">{taskError}</p> : null}

              <div className="modal-actions">
                <button type="button" className="ghost-button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={taskLoading || uploadingImage}>
                  {taskLoading || uploadingImage ? 'Saving...' : editingTask ? 'Update task' : 'Create task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default App
