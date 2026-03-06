const prisma = require('../utils/prisma');

async function getUsers(req, res, next) {
  try {
    const { role, includeArchived } = req.query;
    const where = {};

    if (role) where.role = role;
    // Admins can request archived users; others only see active
    if (!(req.user.role === 'ADMIN' && includeArchived === 'true')) {
      where.isActive = true;
    }

    // Scope by organization (admins see all)
    if (req.user.role !== 'ADMIN' && req.user.organizationId) {
      where.organizationId = req.user.organizationId;
    }

    if (req.user.role === 'SUPERVISOR') {
      const subordinates = await prisma.user.findMany({
        where: { supervisorId: req.user.id },
        select: { id: true },
      });
      where.id = { in: [req.user.id, ...subordinates.map((u) => u.id)] };
    } else if (req.user.role === 'EMPLOYEE') {
      where.id = req.user.id;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        supervisorId: true,
        supervisor: { select: { id: true, name: true } },
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json({ users });
  } catch (err) {
    next(err);
  }
}

async function getUser(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        supervisorId: true,
        supervisor: { select: { id: true, name: true } },
        subordinates: { select: { id: true, name: true, role: true } },
        createdAt: true,
      },
    });

    if (!user) return res.status(404).json({ error: 'User not found.' });

    // Only admin or the user themselves
    if (req.user.role !== 'ADMIN' && req.user.id !== user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    res.json({ user });
  } catch (err) {
    next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const { role, supervisorId, name } = req.body;

    // Prevent demoting the last admin
    if (role && role !== 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      const currentUser = await prisma.user.findUnique({ where: { id: req.params.id } });
      if (currentUser.role === 'ADMIN' && adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot demote the last admin.' });
      }
    }

    // Validate supervisor reference
    if (supervisorId) {
      const sup = await prisma.user.findUnique({ where: { id: supervisorId } });
      if (!sup || (sup.role !== 'ADMIN' && sup.role !== 'SUPERVISOR')) {
        return res.status(400).json({ error: 'Supervisor must be an Admin or Supervisor.' });
      }
    }

    const data = {};
    if (role) data.role = role;
    if (name) data.name = name;
    if (supervisorId !== undefined) data.supervisorId = supervisorId || null;

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        supervisorId: true,
        supervisor: { select: { id: true, name: true } },
        createdAt: true,
      },
    });

    res.json({ user });
  } catch (err) {
    next(err);
  }
}

async function archiveUser(req, res, next) {
  try {
    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target) return res.status(404).json({ error: 'User not found.' });

    if (target.role === 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN', isActive: true } });
      if (adminCount <= 1 && target.isActive) {
        return res.status(400).json({ error: 'Cannot archive the last active admin.' });
      }
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: !target.isActive },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });

    res.json({ user, message: user.isActive ? 'User reactivated.' : 'User archived.' });
  } catch (err) {
    next(err);
  }
}

async function deleteUser(req, res, next) {
  try {
    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target) return res.status(404).json({ error: 'User not found.' });

    if (target.role === 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin.' });
      }
    }

    await prisma.$transaction([
      prisma.notification.deleteMany({ where: { userId: req.params.id } }),
      prisma.eodResponse.deleteMany({ where: { submission: { employeeId: req.params.id } } }),
      prisma.eodSubmission.deleteMany({ where: { employeeId: req.params.id } }),
      prisma.user.updateMany({ where: { supervisorId: req.params.id }, data: { supervisorId: null } }),
      prisma.task.deleteMany({ where: { assignedToId: req.params.id } }),
      prisma.resource.deleteMany({ where: { createdById: req.params.id } }),
      prisma.user.delete({ where: { id: req.params.id } }),
    ]);

    res.json({ message: 'User permanently deleted.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getUsers, getUser, updateUser, archiveUser, deleteUser };
