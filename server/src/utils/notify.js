const prisma = require('./prisma');
const webpush = require('web-push');

// Configure web-push if VAPID keys are set
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:noreply@gymtaskmanager.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

async function sendPushToUser(userId, payload) {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;

  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        );
      } catch (err) {
        // Remove invalid/expired subscriptions
        if (err.statusCode === 410 || err.statusCode === 404) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    }
  } catch (err) {
    console.error('Push notification error:', err.message);
  }
}

async function createNotification(io, { userId, type, message, relatedId }) {
  const notification = await prisma.notification.create({
    data: { userId, type, message, relatedId },
  });

  if (io) {
    io.to(`user:${userId}`).emit('notification:new', notification);
  }

  // Send push notification
  await sendPushToUser(userId, {
    title: type === 'URGENT' ? 'Urgent Alert' : 'GymTaskManager',
    body: message,
    url: type === 'TASK_ASSIGNED' || type === 'TASK_COMPLETED'
      ? `/tasks/${relatedId}`
      : type === 'EOD_SUBMITTED'
        ? `/eod/submissions/${relatedId}`
        : '/notifications',
  });

  return notification;
}

module.exports = { createNotification };
