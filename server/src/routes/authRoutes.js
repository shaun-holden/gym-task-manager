const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const prisma = require('../utils/prisma');
const { register, login, getMe } = require('../controllers/authController');

const router = Router();

// Public: search organizations for registration
router.get('/organizations', async (req, res) => {
  const { q } = req.query;
  const where = {};
  if (q) {
    where.name = { contains: q, mode: 'insensitive' };
  }
  const organizations = await prisma.organization.findMany({
    where,
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
    take: 10,
  });
  res.json({ organizations });
});

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required.'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  ],
  validate,
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  validate,
  login
);

router.get('/me', authenticate, getMe);

module.exports = router;
