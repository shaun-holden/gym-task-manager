const prisma = require('../utils/prisma');

async function getResources(req, res, next) {
  try {
    const where = {};
    if (req.user.role !== 'ADMIN' && req.user.organizationId) {
      where.organizationId = req.user.organizationId;
    }
    const { category } = req.query;
    if (category) where.category = category;

    const resources = await prisma.resource.findMany({
      where,
      include: { createdBy: { select: { id: true, name: true } } },
      orderBy: [{ category: 'asc' }, { title: 'asc' }],
    });

    res.json({ resources });
  } catch (err) {
    next(err);
  }
}

async function createResource(req, res, next) {
  try {
    const { title, url, description, category } = req.body;

    const resource = await prisma.resource.create({
      data: {
        title,
        url,
        description: description || null,
        category: category || null,
        organizationId: req.user.organizationId || null,
        createdById: req.user.id,
      },
      include: { createdBy: { select: { id: true, name: true } } },
    });

    res.status(201).json({ resource });
  } catch (err) {
    next(err);
  }
}

async function updateResource(req, res, next) {
  try {
    const existing = await prisma.resource.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Resource not found.' });

    const { title, url, description, category } = req.body;

    const resource = await prisma.resource.update({
      where: { id: req.params.id },
      data: { title, url, description, category },
      include: { createdBy: { select: { id: true, name: true } } },
    });

    res.json({ resource });
  } catch (err) {
    next(err);
  }
}

async function deleteResource(req, res, next) {
  try {
    const existing = await prisma.resource.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Resource not found.' });

    await prisma.resource.delete({ where: { id: req.params.id } });
    res.json({ message: 'Resource deleted.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getResources, createResource, updateResource, deleteResource };
