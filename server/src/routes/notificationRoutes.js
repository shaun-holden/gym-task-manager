const { Router } = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { getNotifications, getUrgentNotifications, acknowledgeNotification, sendUrgentNotification, markRead, markAllRead } = require('../controllers/notificationController');

const router = Router();

router.use(authenticate);

router.get('/', getNotifications);
router.get('/urgent', getUrgentNotifications);
router.post('/urgent', authorize('ADMIN'), sendUrgentNotification);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markRead);
router.patch('/:id/acknowledge', acknowledgeNotification);

module.exports = router;
