const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const {
  getTasks, getTask, createTask, updateTask, toggleComplete, deleteTask,
} = require('../controllers/taskController');

const router = Router();

router.use(authenticate);

const taskValidation = [
  body('title').trim().notEmpty().withMessage('Title is required.'),
  body('category').trim().notEmpty().withMessage('Category is required.'),
  body('assignedToId').isUUID().withMessage('Valid assignee is required.'),
  body('startDate').optional({ nullable: true }).isISO8601().withMessage('Invalid start date.'),
  body('dueDate').optional({ nullable: true }).isISO8601().withMessage('Invalid due date.'),
];

router.get('/', getTasks);
router.post('/', authorize('ADMIN', 'SUPERVISOR'), taskValidation, validate, createTask);
router.get('/:id', getTask);
router.put('/:id', authorize('ADMIN', 'SUPERVISOR'), taskValidation, validate, updateTask);
router.patch('/:id/complete', toggleComplete);
router.delete('/:id', authorize('ADMIN', 'SUPERVISOR'), deleteTask);

module.exports = router;
