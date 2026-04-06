const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const prisma = require('../utils/prisma');

const router = Router();

router.use(authenticate);

// Get VAPID public key
router.get('/vapid-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || '' });
});

// Subscribe to push notifications
router.post('/subscribe', async (req, res, next) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ error: 'Invalid push subscription.' });
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { userId: req.user.id, p256dh: keys.p256dh, auth: keys.auth },
      create: { userId: req.user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    });

    res.json({ message: 'Subscribed to push notifications.' });
  } catch (err) {
    next(err);
  }
});

// Unsubscribe from push notifications
router.post('/unsubscribe', async (req, res, next) => {
  try {
    const { endpoint } = req.body;
    if (endpoint) {
      await prisma.pushSubscription.deleteMany({ where: { endpoint } });
    } else {
      await prisma.pushSubscription.deleteMany({ where: { userId: req.user.id } });
    }
    res.json({ message: 'Unsubscribed from push notifications.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
