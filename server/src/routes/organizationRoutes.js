const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const prisma = require('../utils/prisma');

const router = Router();

router.use(authenticate, authorize('ADMIN'));

// List all organizations
router.get('/', async (req, res, next) => {
  try {
    const organizations = await prisma.organization.findMany({
      include: {
        _count: { select: { users: true } },
        users: {
          where: { role: { in: ['SUPERVISOR', 'ADMIN'] } },
          select: { id: true, name: true, email: true, role: true },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ organizations });
  } catch (err) {
    next(err);
  }
});

// Create organization
router.post(
  '/',
  [body('name').trim().notEmpty().withMessage('Organization name is required.')],
  validate,
  async (req, res, next) => {
    try {
      const org = await prisma.organization.create({
        data: { name: req.body.name },
        include: {
          _count: { select: { users: true } },
          users: {
            where: { role: { in: ['SUPERVISOR', 'ADMIN'] } },
            select: { id: true, name: true, email: true, role: true },
          },
        },
      });
      res.status(201).json({ organization: org });
    } catch (err) {
      next(err);
    }
  }
);

// Update organization
router.put(
  '/:id',
  [body('name').trim().notEmpty().withMessage('Organization name is required.')],
  validate,
  async (req, res, next) => {
    try {
      const org = await prisma.organization.update({
        where: { id: req.params.id },
        data: { name: req.body.name },
        include: {
          _count: { select: { users: true } },
          users: {
            where: { role: { in: ['SUPERVISOR', 'ADMIN'] } },
            select: { id: true, name: true, email: true, role: true },
          },
        },
      });
      res.json({ organization: org });
    } catch (err) {
      next(err);
    }
  }
);

// Assign employer to organization
router.post('/:id/employer', async (req, res, next) => {
  try {
    const { userId } = req.body;
    const user = await prisma.user.update({
      where: { id: userId },
      data: { organizationId: req.params.id, role: 'SUPERVISOR' },
      select: { id: true, name: true, email: true, role: true },
    });
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
