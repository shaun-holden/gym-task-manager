const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const prisma = require('../utils/prisma');
const { register, login, getMe } = require('../controllers/authController');

const router = Router();

// Public: list supervisors for registration
router.get('/supervisors', async (req, res) => {
  const supervisors = await prisma.user.findMany({
    where: { role: { in: ['SUPERVISOR', 'ADMIN'] } },
    select: { id: true, name: true, organization: { select: { name: true } } },
    orderBy: { name: 'asc' },
  });
  res.json({ supervisors });
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
