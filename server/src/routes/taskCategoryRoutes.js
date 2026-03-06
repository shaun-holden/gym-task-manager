const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { getCategories, createCategory, deleteCategory } = require('../controllers/taskCategoryController');

const router = Router();

router.use(authenticate);

router.get('/', getCategories);
router.post(
  '/',
  authorize('ADMIN', 'SUPERVISOR'),
  [body('name').trim().notEmpty().withMessage('Category name is required.')],
  validate,
  createCategory
);
router.delete('/:id', authorize('ADMIN', 'SUPERVISOR'), deleteCategory);

module.exports = router;
