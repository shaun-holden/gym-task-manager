const prisma = require('../utils/prisma');

const DEFAULT_CATEGORIES = [
  'CLEANING',
  'EQUIPMENT_MAINTENANCE',
  'FRONT_DESK',
  'CLASSES',
  'SAFETY',
  'OTHER',
];

async function getCategories(req, res, next) {
  try {
    const where = {};
    if (req.user.role !== 'ADMIN' && req.user.organizationId) {
      where.organizationId = req.user.organizationId;
    }

    const custom = await prisma.taskCategoryCustom.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    const categories = [
      ...DEFAULT_CATEGORIES.map((name) => ({ name, isDefault: true })),
      ...custom.map((c) => ({ id: c.id, name: c.name, isDefault: false })),
    ];

    res.json({ categories });
  } catch (err) {
    next(err);
  }
}

async function createCategory(req, res, next) {
  try {
    const { name } = req.body;

    const category = await prisma.taskCategoryCustom.create({
      data: {
        name: name.toUpperCase().replace(/\s+/g, '_'),
        createdById: req.user.id,
        organizationId: req.user.organizationId || null,
      },
    });

    res.status(201).json({ category });
  } catch (err) {
    next(err);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const category = await prisma.taskCategoryCustom.findUnique({
      where: { id: req.params.id },
    });
    if (!category) return res.status(404).json({ error: 'Category not found.' });

    await prisma.taskCategoryCustom.delete({ where: { id: req.params.id } });
    res.json({ message: 'Category deleted.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getCategories, createCategory, deleteCategory };
