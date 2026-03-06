const prisma = require('../utils/prisma');
const { createNotification } = require('../utils/notify');

async function getTemplates(req, res, next) {
  try {
    const where = {};
    if (req.user.role !== 'ADMIN' && req.user.organizationId) {
      where.organizationId = req.user.organizationId;
    }
    if (req.user.role !== 'ADMIN') {
      where.isActive = true;
    }

    const templates = await prisma.eodTemplate.findMany({
      where,
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ templates });
  } catch (err) {
    next(err);
  }
}

async function getTemplate(req, res, next) {
  try {
    const template = await prisma.eodTemplate.findUnique({
      where: { id: req.params.id },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    if (!template) return res.status(404).json({ error: 'Template not found.' });
    res.json({ template });
  } catch (err) {
    next(err);
  }
}

async function createTemplate(req, res, next) {
  try {
    const { title, items } = req.body;

    const template = await prisma.eodTemplate.create({
      data: {
        title,
        createdById: req.user.id,
        organizationId: req.user.organizationId || null,
        items: {
          create: items.map((item, idx) => ({
            question: item.question,
            type: item.type || 'TEXT',
            sortOrder: item.sortOrder ?? idx + 1,
          })),
        },
      },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({ template });
  } catch (err) {
    next(err);
  }
}

async function updateTemplate(req, res, next) {
  try {
    const existing = await prisma.eodTemplate.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Template not found.' });

    if (req.user.role === 'SUPERVISOR' && existing.createdById !== req.user.id) {
      return res.status(403).json({ error: 'Can only edit templates you created.' });
    }

    const { title, isActive, items } = req.body;

    // Delete old items and recreate in a transaction
    const template = await prisma.$transaction(async (tx) => {
      if (items) {
        await tx.eodTemplateItem.deleteMany({ where: { templateId: req.params.id } });
      }

      return tx.eodTemplate.update({
        where: { id: req.params.id },
        data: {
          title,
          isActive,
          ...(items && {
            items: {
              create: items.map((item, idx) => ({
                question: item.question,
                type: item.type || 'TEXT',
                sortOrder: item.sortOrder ?? idx + 1,
              })),
            },
          }),
        },
        include: {
          items: { orderBy: { sortOrder: 'asc' } },
          createdBy: { select: { id: true, name: true } },
        },
      });
    });

    res.json({ template });
  } catch (err) {
    next(err);
  }
}

async function submitEod(req, res, next) {
  try {
    const { templateId, responses, notes, mood } = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const submission = await prisma.eodSubmission.create({
      data: {
        templateId,
        employeeId: req.user.id,
        date: today,
        submittedAt: new Date(),
        notes: notes || null,
        mood: mood != null ? Number(mood) : null,
        responses: {
          create: responses.map((r) => ({
            templateItemId: r.templateItemId,
            response: String(r.response),
          })),
        },
      },
      include: {
        responses: {
          include: { templateItem: true },
          orderBy: { templateItem: { sortOrder: 'asc' } },
        },
        template: { select: { id: true, title: true } },
        employee: { select: { id: true, name: true, supervisorId: true } },
      },
    });

    // Notify supervisor
    const io = req.app.get('io');
    if (submission.employee.supervisorId) {
      await createNotification(io, {
        userId: submission.employee.supervisorId,
        type: 'EOD_SUBMITTED',
        message: `EOD submitted by ${submission.employee.name}: "${submission.template.title}"`,
        relatedId: submission.id,
      });
    }

    // Also notify admins
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });
    for (const admin of admins) {
      if (admin.id !== submission.employee.supervisorId) {
        await createNotification(io, {
          userId: admin.id,
          type: 'EOD_SUBMITTED',
          message: `EOD submitted by ${submission.employee.name}: "${submission.template.title}"`,
          relatedId: submission.id,
        });
      }
    }

    res.status(201).json({ submission });
  } catch (err) {
    next(err);
  }
}

async function getSubmissions(req, res, next) {
  try {
    const { date, startDate, endDate, employeeId, templateId } = req.query;
    const where = {};

    // Role-based filtering
    if (req.user.role === 'EMPLOYEE') {
      where.employeeId = req.user.id;
    } else if (req.user.role === 'SUPERVISOR') {
      const subordinates = await prisma.user.findMany({
        where: { supervisorId: req.user.id },
        select: { id: true },
      });
      where.employeeId = { in: [req.user.id, ...subordinates.map((u) => u.id)] };
    }

    if (employeeId) {
      // Verify permission for specific employee
      if (req.user.role === 'EMPLOYEE' && employeeId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied.' });
      }
      where.employeeId = employeeId;
    }
    if (templateId) where.templateId = templateId;
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      where.date = d;
    } else if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const submissions = await prisma.eodSubmission.findMany({
      where,
      include: {
        employee: { select: { id: true, name: true } },
        template: { select: { id: true, title: true } },
      },
      orderBy: [{ date: 'desc' }, { submittedAt: 'desc' }],
    });

    res.json({ submissions });
  } catch (err) {
    next(err);
  }
}

async function getSubmission(req, res, next) {
  try {
    const submission = await prisma.eodSubmission.findUnique({
      where: { id: req.params.id },
      include: {
        employee: { select: { id: true, name: true } },
        template: { select: { id: true, title: true } },
        responses: {
          include: { templateItem: true },
          orderBy: { templateItem: { sortOrder: 'asc' } },
        },
      },
    });

    if (!submission) return res.status(404).json({ error: 'Submission not found.' });

    // Permission check
    if (req.user.role === 'EMPLOYEE' && submission.employeeId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    res.json({ submission });
  } catch (err) {
    next(err);
  }
}

module.exports = { getTemplates, getTemplate, createTemplate, updateTemplate, submitEod, getSubmissions, getSubmission };
