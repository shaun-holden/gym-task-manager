const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { getResources, createResource, updateResource, deleteResource } = require('../controllers/resourceController');

const router = Router();

router.use(authenticate);

router.get('/', getResources);

router.post(
  '/',
  authorize('ADMIN', 'SUPERVISOR'),
  [
    body('title').trim().notEmpty().withMessage('Title is required.'),
    body('url').trim().isURL().withMessage('Valid URL is required.'),
    body('description').optional().isString(),
    body('category').optional().isString(),
  ],
  validate,
  createResource
);

router.put(
  '/:id',
  authorize('ADMIN', 'SUPERVISOR'),
  [
    body('title').trim().notEmpty().withMessage('Title is required.'),
    body('url').trim().isURL().withMessage('Valid URL is required.'),
    body('description').optional().isString(),
    body('category').optional().isString(),
  ],
  validate,
  updateResource
);

router.delete('/:id', authorize('ADMIN', 'SUPERVISOR'), deleteResource);

module.exports = router;
