const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const {
  getTemplates, getTemplate, createTemplate, updateTemplate,
  submitEod, getSubmissions, getSubmission, getMissingEods,
} = require('../controllers/eodController');

const router = Router();

router.use(authenticate);

// Templates
router.get('/templates', getTemplates);
router.get('/templates/:id', getTemplate);
router.post(
  '/templates',
  authorize('ADMIN', 'SUPERVISOR'),
  [
    body('title').trim().notEmpty().withMessage('Title is required.'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required.'),
    body('items.*.question').trim().notEmpty().withMessage('Question is required.'),
    body('items.*.type').optional().isIn(['TEXT', 'CHECKBOX', 'NUMBER', 'RATING', 'DATE', 'ATTACHMENT']).withMessage('Invalid item type.'),
    body('items.*.isRequired').optional().isBoolean().withMessage('isRequired must be a boolean.'),
  ],
  validate,
  createTemplate
);
router.put(
  '/templates/:id',
  authorize('ADMIN', 'SUPERVISOR'),
  [body('title').optional().trim().notEmpty().withMessage('Title cannot be empty.')],
  validate,
  updateTemplate
);

// Submissions
router.post(
  '/submissions',
  [
    body('templateId').isUUID().withMessage('Valid template is required.'),
    body('employeeId').optional().isUUID().withMessage('Valid employee ID is required.'),
    body('responses').isArray({ min: 1 }).withMessage('At least one response is required.'),
    body('responses.*.templateItemId').isUUID().withMessage('Valid template item is required.'),
    body('responses.*.response').exists().withMessage('Response is required.'),
    body('notes').optional().isString(),
    body('mood').optional().isInt({ min: 1, max: 5 }).withMessage('Mood must be between 1 and 5.'),
  ],
  validate,
  submitEod
);
router.get('/submissions', getSubmissions);
router.get('/submissions/:id', getSubmission);
router.get('/missing', authorize('ADMIN', 'SUPERVISOR'), getMissingEods);

module.exports = router;
