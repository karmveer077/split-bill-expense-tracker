const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { 
    getNotifications, 
    markNotificationRead, 
    markAllNotificationsRead 
} = require('../controllers/notificationController');

router.use(authMiddleware);

router.get('/', getNotifications);
router.put('/:notificationId/read', markNotificationRead);
router.put('/read-all', markAllNotificationsRead);

module.exports = router;
