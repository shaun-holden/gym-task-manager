const prisma = require('./prisma');

async function createNotification(io, { userId, type, message, relatedId }) {
  const notification = await prisma.notification.create({
    data: { userId, type, message, relatedId },
  });

  if (io) {
    io.to(`user:${userId}`).emit('notification:new', notification);
  }

  return notification;
}

module.exports = { createNotification };
