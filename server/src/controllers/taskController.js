const prisma = require('../utils/prisma');
const { createNotification } = require('../utils/notify');
const { parsePagination } = require('../utils/pagination');

async function getTeamUserIds(userId, role) {
  if (role === 'ADMIN') return null; // null = no filter
  if (role === 'SUPERVISOR') {
    const subordinates = await prisma.user.findMany({
      where: { supervisorId: userId },
      select: { id: true },
    });
    return [userId, ...subordinates.map((u) => u.id)];
  }
  return [userId]; // EMPLOYEE
}

async function getTasks(req, res, next) {
  try {
    const { category, isCompleted, startDate, endDate, assignedToId } = req.query;
    const where = {};

    // Role-based filtering
    const allowedIds = await getTeamUserIds(req.user.id, req.user.role);
    if (allowedIds) {
      where.assignedToId = { in: allowedIds };
    }

    // Scope to organization (admins see all)
    if (req.user.role !== 'ADMIN' && req.user.organizationId) {
      where.organizationId = req.user.organizationId;
    }

    // Additional filters
    if (assignedToId) {
      if (allowedIds && !allowedIds.includes(assignedToId)) {
        return res.status(403).json({ error: 'Cannot view tasks for this user.' });
      }
      where.assignedToId = assignedToId;
    }
    if (category) where.category = category;
    if (isCompleted !== undefined) where.isCompleted = isCompleted === 'true';
    if (startDate || endDate) {
      where.dueDate = {};
      if (startDate) where.dueDate.gte = new Date(startDate);
      if (endDate) where.dueDate.lte = new Date(endDate);
    }

    const { page, limit, skip } = parsePagination(req.query);

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          assignedTo: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.task.count({ where }),
    ]);

    res.json({ tasks, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
}

async function getTask(req, res, next) {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        assignedTo: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    if (!task) return res.status(404).json({ error: 'Task not found.' });

    // Permission check
    const allowedIds = await getTeamUserIds(req.user.id, req.user.role);
    if (allowedIds && !allowedIds.includes(task.assignedToId)) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    res.json({ task });
  } catch (err) {
    next(err);
  }
}

async function createTask(req, res, next) {
  try {
    const { title, description, category, startDate, dueDate, notes, assignedToId } = req.body;

    // Supervisor can only assign to self or subordinates
    if (req.user.role === 'SUPERVISOR') {
      const allowedIds = await getTeamUserIds(req.user.id, 'SUPERVISOR');
      if (!allowedIds.includes(assignedToId)) {
        return res.status(403).json({ error: 'Can only assign tasks to your team.' });
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        category,
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes,
        assignedToId,
        createdById: req.user.id,
        organizationId: req.user.organizationId || null,
      },
      include: {
        assignedTo: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    // Notify assignee
    const io = req.app.get('io');
    if (task.assignedToId !== req.user.id) {
      await createNotification(io, {
        userId: task.assignedToId,
        type: 'TASK_ASSIGNED',
        message: `New task assigned: "${task.title}"`,
        relatedId: task.id,
      });
    }

    res.status(201).json({ task });
  } catch (err) {
    next(err);
  }
}

async function updateTask(req, res, next) {
  try {
    const existing = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Task not found.' });

    // Permission check
    const allowedIds = await getTeamUserIds(req.user.id, req.user.role);
    if (allowedIds && !allowedIds.includes(existing.assignedToId)) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const { title, description, category, startDate, dueDate, notes, assignedToId } = req.body;

    // Supervisor can only reassign to their team
    if (assignedToId && req.user.role === 'SUPERVISOR') {
      const teamIds = await getTeamUserIds(req.user.id, 'SUPERVISOR');
      if (!teamIds.includes(assignedToId)) {
        return res.status(403).json({ error: 'Can only assign tasks to your team.' });
      }
    }

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        title,
        description,
        category,
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes,
        assignedToId,
      },
      include: {
        assignedTo: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    // Notify new assignee if changed
    const io = req.app.get('io');
    if (assignedToId && assignedToId !== existing.assignedToId && assignedToId !== req.user.id) {
      await createNotification(io, {
        userId: assignedToId,
        type: 'TASK_ASSIGNED',
        message: `Task reassigned to you: "${task.title}"`,
        relatedId: task.id,
      });
    }

    res.json({ task });
  } catch (err) {
    next(err);
  }
}

async function toggleComplete(req, res, next) {
  try {
    const existing = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: { assignedTo: { select: { id: true, name: true, supervisorId: true } } },
    });
    if (!existing) return res.status(404).json({ error: 'Task not found.' });

    // Employee can only complete own tasks
    if (req.user.role === 'EMPLOYEE' && existing.assignedToId !== req.user.id) {
      return res.status(403).json({ error: 'Can only complete your own tasks.' });
    }

    const isCompleted = !existing.isCompleted;
    const { completionNote } = req.body || {};
    const updateData = {
      isCompleted,
      completedAt: isCompleted ? new Date() : null,
    };
    if (isCompleted && completionNote) {
      updateData.notes = existing.notes
        ? `${existing.notes}\n\n--- Completion Note ---\n${completionNote}`
        : `--- Completion Note ---\n${completionNote}`;
    }

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        assignedTo: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    // Notify supervisor and creator when completed
    const io = req.app.get('io');
    if (isCompleted) {
      const notifyIds = new Set();
      if (existing.createdById !== req.user.id) notifyIds.add(existing.createdById);
      if (existing.assignedTo.supervisorId && existing.assignedTo.supervisorId !== req.user.id) {
        notifyIds.add(existing.assignedTo.supervisorId);
      }

      for (const userId of notifyIds) {
        await createNotification(io, {
          userId,
          type: 'TASK_COMPLETED',
          message: `Task completed: "${task.title}" by ${task.assignedTo.name}`,
          relatedId: task.id,
        });
      }
    }

    res.json({ task });
  } catch (err) {
    next(err);
  }
}

async function deleteTask(req, res, next) {
  try {
    const existing = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Task not found.' });

    // Supervisor can only delete tasks they created
    if (req.user.role === 'SUPERVISOR' && existing.createdById !== req.user.id) {
      return res.status(403).json({ error: 'Can only delete tasks you created.' });
    }

    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ message: 'Task deleted.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getTasks, getTask, createTask, updateTask, toggleComplete, deleteTask };
