const createActivityLog = async (executor, { groupId, actorId, actionType, description }) => {
    if (!groupId || !actorId || !actionType || !description) return;
    await executor.execute(
        'INSERT INTO activity_logs (group_id, actor_id, action_type, description) VALUES (?, ?, ?, ?)',
        [groupId, actorId, actionType, description.slice(0, 255)]
    );
};

const createNotificationsForGroupMembers = async (executor, { groupId, actorId, type, message }) => {
    if (!groupId || !type || !message) return;

    const [members] = await executor.execute(
        'SELECT user_id FROM group_members WHERE group_id = ? AND user_id != ?',
        [groupId, actorId]
    );

    if (members.length === 0) return;

    for (const member of members) {
        await executor.execute(
            'INSERT INTO notifications (user_id, group_id, type, message) VALUES (?, ?, ?, ?)',
            [member.user_id, groupId, type, message.slice(0, 255)]
        );
    }
};

module.exports = {
    createActivityLog,
    createNotificationsForGroupMembers
};
