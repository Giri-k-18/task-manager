const prisma = require('../config/prisma')
const {
  deleteTaskImage,
  getOwnedPublicId,
  getTaskThumbnailUrl,
} = require('../services/cloudinary.service')

const taskSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  dueDate: true,
  imageUrl: true,
  createdAt: true,
  updatedAt: true,
}

function serializeTask(task, userId) {
  return {
    ...task,
    thumbnailUrl: task.imageUrl ? getTaskThumbnailUrl(task.imageUrl, userId) : null,
  }
}

async function listTasks(request, response, next) {
  try {
    const tasks = await prisma.task.findMany({
      where: { ownerId: request.user.id },
      orderBy: { createdAt: 'desc' },
      select: taskSelect,
    })

    return response.status(200).json({
      tasks: tasks.map((task) => serializeTask(task, request.user.id)),
    })
  } catch (error) {
    return next(error)
  }
}

async function createTask(request, response, next) {
  try {
    if (
      request.validatedBody.imageUrl &&
      !getOwnedPublicId(request.validatedBody.imageUrl, request.user.id)
    ) {
      return response.status(400).json({ error: 'Image must belong to the authenticated user' })
    }

    const task = await prisma.task.create({
      data: { ...request.validatedBody, ownerId: request.user.id },
      select: taskSelect,
    })

    return response.status(201).json({ task: serializeTask(task, request.user.id) })
  } catch (error) {
    return next(error)
  }
}

async function getTask(request, response, next) {
  try {
    const task = await prisma.task.findFirst({
      where: { id: request.validatedParams.id, ownerId: request.user.id },
      select: taskSelect,
    })

    if (!task) {
      return response.status(404).json({ error: 'Task not found' })
    }

    return response.status(200).json({ task: serializeTask(task, request.user.id) })
  } catch (error) {
    return next(error)
  }
}

async function updateTask(request, response, next) {
  try {
    const where = { id: request.validatedParams.id, ownerId: request.user.id }
    const existingTask = await prisma.task.findFirst({
      where,
      select: { dueDate: true, imageUrl: true },
    })

    if (!existingTask) {
      return response.status(404).json({ error: 'Task not found' })
    }

    if (
      request.validatedBody.imageUrl &&
      !getOwnedPublicId(request.validatedBody.imageUrl, request.user.id)
    ) {
      return response.status(400).json({ error: 'Image must belong to the authenticated user' })
    }

    const previousDueDate = existingTask.dueDate?.getTime() ?? null
    const nextDueDate = request.validatedBody.dueDate === undefined
      ? previousDueDate
      : request.validatedBody.dueDate?.getTime() ?? null
    const dueDateChanged = previousDueDate !== nextDueDate
    const result = await prisma.task.updateMany({
      where,
      data: {
        ...request.validatedBody,
        ...(dueDateChanged ? { reminderClaimedAt: null, reminderSentAt: null } : {}),
      },
    })

    if (result.count === 0) {
      return response.status(404).json({ error: 'Task not found' })
    }

    const task = await prisma.task.findFirst({ where, select: taskSelect })

    if (
      existingTask.imageUrl &&
      request.validatedBody.imageUrl !== undefined &&
      existingTask.imageUrl !== request.validatedBody.imageUrl
    ) {
      try {
        await deleteTaskImage(existingTask.imageUrl, request.user.id)
      } catch {
        console.error('Failed to clean up replaced Cloudinary image')
      }
    }

    return response.status(200).json({ task: serializeTask(task, request.user.id) })
  } catch (error) {
    return next(error)
  }
}

async function deleteTask(request, response, next) {
  try {
    const where = { id: request.validatedParams.id, ownerId: request.user.id }
    const task = await prisma.task.findFirst({ where, select: { imageUrl: true } })

    if (!task) {
      return response.status(404).json({ error: 'Task not found' })
    }

    if (task.imageUrl) {
      try {
        await deleteTaskImage(task.imageUrl, request.user.id)
      } catch {
        return response.status(502).json({ error: 'Could not delete the task image; task was not removed' })
      }
    }

    const result = await prisma.task.deleteMany({
      where,
    })

    if (result.count === 0) {
      return response.status(404).json({ error: 'Task not found' })
    }

    return response.status(204).send()
  } catch (error) {
    return next(error)
  }
}

module.exports = { createTask, deleteTask, getTask, listTasks, updateTask }