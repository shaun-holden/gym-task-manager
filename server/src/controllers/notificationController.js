const prisma = require('../utils/prisma');
const { createNotification } = require('../utils/notify');

async function getNotifications(req, res, next) {
  try {
    const { unreadOnly } = req.query;
    const where = { userId: req.user.id };

    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({ notifications });
  } catch (err) {
    next(err);
  }
}

async function getUrgentNotifications(req, res, next) {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId: req.user.id,
        type: 'URGENT',
        acknowledgedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ notifications });
  } catch (err) {
    next(err);
  }
}

async function acknowledgeNotification(req, res, next) {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id },
    });

    if (!notification) return res.status(404).json({ error: 'Notification not found.' });
    if (notification.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { acknowledgedAt: new Date(), isRead: true },
    });

    res.json({ notification: updated });
  } catch (err) {
    next(err);
  }
}

async function sendUrgentNotification(req, res, next) {
  try {
    const { message, targetRole, targetUserIds } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const io = req.app.get('io');
    const userWhere = { isActive: true };

    if (targetUserIds && targetUserIds.length > 0) {
      userWhere.id = { in: targetUserIds };
    } else if (targetRole) {
      userWhere.role = targetRole;
    } else {
      // Default: send to all supervisors and employees
      userWhere.role = { in: ['SUPERVISOR', 'EMPLOYEE'] };
    }

    // Don't send to the admin who is sending
    userWhere.id = userWhere.id || { not: req.user.id };

    const users = await prisma.user.findMany({
      where: userWhere,
      select: { id: true },
    });

    const notifications = [];
    for (const u of users) {
      if (u.id === req.user.id) continue;
      const n = await createNotification(io, {
        userId: u.id,
        type: 'URGENT',
        message,
      });
      notifications.push(n);
    }

    res.status(201).json({ message: 'Urgent notification sent.', count: notifications.length });
  } catch (err) {
    next(err);
  }
}

async function markRead(req, res, next) {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id },
    });

    if (!notification) return res.status(404).json({ error: 'Notification not found.' });
    if (notification.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });

    res.json({ notification: updated });
  } catch (err) {
    next(err);
  }
}

async function markAllRead(req, res, next) {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });

    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getNotifications, getUrgentNotifications, acknowledgeNotification, sendUrgentNotification, markRead, markAllRead };
