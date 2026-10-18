const pool = require('../config/db');
const { throwError } = require('../utils/validators');

/**
 * Checks if a user is a member of a group.
 */
const checkMembership = async (groupId, userId) => {
    const [rows] = await pool.execute('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?', [groupId, userId]);
    return rows.length > 0;
};

/**
 * GET /api/groups/:groupId/activity
 * Returns chronological activity records for a group (newest first).
 */
const getGroupActivity = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.id;

        if (!(await checkMembership(groupId, userId))) {
            return throwError(403, 'You are not a member of this group.');
        }

        const [activities] = await pool.execute(
            `SELECT 
                a.id,
                a.group_id as groupId,
                a.actor_id as actorId,
                u.name as actorName,
                a.action_type as actionType,
                a.description,
                a.created_at as createdAt
             FROM activity_logs a
             JOIN users u ON a.actor_id = u.id
             WHERE a.group_id = ?
             ORDER BY a.created_at DESC, a.id DESC`,
            [groupId]
        );

        const normalizedActivities = activities.map((activity) => ({
            ...activity,
            description: activity.description.replace(/^undefined\b/, activity.actorName || 'Member')
        }));

        res.status(200).json(normalizedActivities);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getGroupActivity,
    checkMembership
};
