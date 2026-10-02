const express = require('express')
const taskController = require('../controllers/task.controller')
const requireAuth = require('../middleware/requireAuth')
const validateBody = require('../middleware/validateBody')
const validateParams = require('../middleware/validateParams')
const {
  createTaskSchema,
  taskIdSchema,
  updateTaskSchema,
} = require('../validators/task.schemas')

const router = express.Router()

router.use(requireAuth)
router.get('/', taskController.listTasks)
router.post('/', validateBody(createTaskSchema), taskController.createTask)
router.get('/:id', validateParams(taskIdSchema), taskController.getTask)
router.put(
  '/:id',
  validateParams(taskIdSchema),
  validateBody(updateTaskSchema),
  taskController.updateTask,
)
router.patch(
  '/:id',
  validateParams(taskIdSchema),
  validateBody(updateTaskSchema),
  taskController.updateTask,
)
router.delete('/:id', validateParams(taskIdSchema), taskController.deleteTask)

module.exports = router