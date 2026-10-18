const pool = require('../config/db');
const { throwError } = require('../utils/validators');
const { createNotificationsForGroupMembers } = require('../utils/groupEvents');

/**
 * Checks if a user is a member of a group.
 */
const checkMembership = async (groupId, userId) => {
    const [rows] = await pool.execute('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?', [groupId, userId]);
    return rows.length > 0;
};

/**
 * GET /api/groups/:groupId/messages
 * Returns stored messages for a group in chronological order.
 */
const getGroupMessages = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.id;

        if (!(await checkMembership(groupId, userId))) {
            return throwError(403, 'You are not a member of this group.');
        }

        const [messages] = await pool.execute(
            `SELECT 
                m.id,
                m.group_id as groupId,
                m.sender_id as senderId,
                u.name as senderName,
                m.content,
                m.created_at as createdAt
             FROM messages m
             JOIN users u ON m.sender_id = u.id
             WHERE m.group_id = ?
             ORDER BY m.created_at ASC, m.id ASC`,
            [groupId]
        );

        res.status(200).json(messages);
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/groups/:groupId/messages
 * Sends a message to a group and notifies other group members.
 */
const sendGroupMessage = async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
        const { groupId } = req.params;
        const userId = req.user.id;
        const { content } = req.body;

        if (!(await checkMembership(groupId, userId))) {
            return throwError(403, 'You are not a member of this group.');
        }

        if (!content || typeof content !== 'string') {
            return throwError(400, 'Message content is required.');
        }

        const trimmed = content.trim();
        if (trimmed.length === 0) {
            return throwError(400, 'Message content cannot be empty.');
        }

        if (trimmed.length > 1000) {
            return throwError(400, 'Message content cannot exceed 1000 characters.');
        }

        // Fetch group name and sender name for clear notification message
        const [groupRows] = await connection.execute('SELECT name FROM `groups` WHERE id = ?', [groupId]);
        const groupName = groupRows.length > 0 ? groupRows[0].name : 'the group';

        const [senderRows] = await connection.execute('SELECT name FROM users WHERE id = ?', [userId]);
        const senderName = senderRows.length > 0 ? senderRows[0].name : 'A member';

        await connection.beginTransaction();

        const [result] = await connection.execute(
            'INSERT INTO messages (group_id, sender_id, content) VALUES (?, ?, ?)',
            [groupId, userId, trimmed]
        );

        const messageId = result.insertId;

        // Create in-app notifications for all other members in the group
        await createNotificationsForGroupMembers(connection, {
            groupId: Number(groupId),
            actorId: userId,
            type: 'new_message',
            message: `${senderName} sent a new message in ${groupName}.`
        });

        await connection.commit();

        const [createdRows] = await pool.execute(
            `SELECT 
                m.id,
                m.group_id as groupId,
                m.sender_id as senderId,
                u.name as senderName,
                m.content,
                m.created_at as createdAt
             FROM messages m
             JOIN users u ON m.sender_id = u.id
             WHERE m.id = ?`,
            [messageId]
        );

        res.status(201).json(createdRows[0]);
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};

module.exports = {
    getGroupMessages,
    sendGroupMessage,
    checkMembership
};
