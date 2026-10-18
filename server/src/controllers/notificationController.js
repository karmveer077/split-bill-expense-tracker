const pool = require('../config/db');
const { throwError } = require('../utils/validators');

/**
 * GET /api/notifications
 * Returns the current user's latest 50 notifications and unread count.
 */
const getNotifications = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // Fetch latest 50 notifications for this user
        const [notifications] = await pool.execute(
            `SELECT 
                n.id,
                n.user_id as userId,
                n.group_id as groupId,
                g.name as groupName,
                n.type,
                n.message,
                n.is_read as isRead,
                n.created_at as createdAt
             FROM notifications n
             JOIN \`groups\` g ON n.group_id = g.id
             WHERE n.user_id = ?
             ORDER BY n.created_at DESC, n.id DESC
             LIMIT 50`,
            [userId]
        );

        // Calculate unread count
        const [countRows] = await pool.execute(
            'SELECT COUNT(*) as unreadCount FROM notifications WHERE user_id = ? AND is_read = 0',
            [userId]
        );

        const unreadCount = countRows[0].unreadCount;

        const normalizedNotifications = notifications.map((notification) => ({
            ...notification,
            message: notification.message.replace(/^undefined\b/, 'A group member')
        }));

        res.status(200).json({
            notifications: normalizedNotifications,
            unreadCount
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/notifications/:notificationId/read
 * Marks a single notification belonging to the current user as read.
 */
const markNotificationRead = async (req, res, next) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user.id;

        const [rows] = await pool.execute(
            'SELECT id, user_id FROM notifications WHERE id = ?',
            [notificationId]
        );

        if (rows.length === 0) {
            return throwError(404, 'Notification not found.');
        }

        if (rows[0].user_id !== userId) {
            return throwError(403, 'You can only mark your own notifications as read.');
        }

        await pool.execute(
            'UPDATE notifications SET is_read = 1 WHERE id = ?',
            [notificationId]
        );

        res.status(200).json({
            message: 'Notification marked as read.',
            id: Number(notificationId),
            isRead: true
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/notifications/read-all
 * Marks all unread notifications of the current user as read.
 */
const markAllNotificationsRead = async (req, res, next) => {
    try {
        const userId = req.user.id;

        await pool.execute(
            'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
            [userId]
        );

        res.status(200).json({
            message: 'All notifications marked as read.',
            unreadCount: 0
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead
};
