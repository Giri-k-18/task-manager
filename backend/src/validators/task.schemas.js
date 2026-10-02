const { z } = require('zod')

const taskStatusSchema = z.enum(['pending', 'in_progress', 'completed'])
const dueDateSchema = z
  .union([z.iso.datetime({ offset: true }), z.iso.date()])
  .transform((dueDate) => new Date(dueDate))
const imageUrlSchema = z
  .url()
  .refine((value) => {
    const imageUrl = new URL(value)
    return imageUrl.protocol === 'https:' && imageUrl.hostname === 'res.cloudinary.com'
  }, 'Image must be a secure Cloudinary URL')

const createTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(255),
    description: z.string().trim().nullable().optional(),
    status: taskStatusSchema.default('pending'),
    dueDate: dueDateSchema.nullable().optional(),
    imageUrl: imageUrlSchema.nullable().optional(),
  })
  .strict()

const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(255).optional(),
    description: z.string().trim().nullable().optional(),
    status: taskStatusSchema.optional(),
    dueDate: dueDateSchema.nullable().optional(),
    imageUrl: imageUrlSchema.nullable().optional(),
  })
  .strict()
  .refine((task) => Object.keys(task).length > 0, {
    message: 'At least one task field is required',
  })

const taskIdSchema = z.object({ id: z.uuid() })

module.exports = { createTaskSchema, taskIdSchema, updateTaskSchema }