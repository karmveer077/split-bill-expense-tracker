const pool = require('../config/db');
const { getUniqueInviteCode } = require('../utils/inviteCode');
const { throwError } = require('../utils/validators');
const { createActivityLog, createNotificationsForGroupMembers } = require('../utils/groupEvents');

const getGroups = async (req, res, next) => {
    try {
        const userId = req.user.id;
        
        const [membershipRows] = await pool.execute('SELECT group_id FROM group_members WHERE user_id = ?', [userId]);
        if (membershipRows.length === 0) return res.status(200).json([]);
        
        const groupIds = membershipRows.map(row => row.group_id);
        const placeholders = groupIds.map(() => '?').join(',');
        
        const [groups] = await pool.query(
          `SELECT id, name, description, invite_code as inviteCode, created_by as createdById FROM \`groups\` WHERE id IN (${placeholders})`, 
          groupIds
        );
        
        const [members] = await pool.query(
            `SELECT gm.group_id as groupId, u.id, u.name, u.email 
             FROM group_members gm 
             JOIN users u ON gm.user_id = u.id 
             WHERE gm.group_id IN (${placeholders})`, 
            groupIds
        );
        
        const [expenses] = await pool.query(
            `SELECT group_id as groupId, amount_paise 
             FROM expenses 
             WHERE group_id IN (${placeholders})`, 
            groupIds
        );
        
        const enrichedGroups = groups.map(g => {
            const groupMembers = members.filter(m => m.groupId === g.id).map(m => ({ id: m.id, name: m.name, email: m.email }));
            const groupExpensePaise = expenses.filter(e => e.groupId === g.id).reduce((sum, e) => sum + e.amount_paise, 0);
            return {
                ...g,
                members: groupMembers,
                memberCount: groupMembers.length,
                totalExpensePaise: groupExpensePaise
            };
        });
        
        res.status(200).json(enrichedGroups);
    } catch (error) {
        next(error);
    }
};

const createGroup = async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
        const { name, description } = req.body;
        if (!name || name.trim() === '') return throwError(400, 'Group name is required.');
        const userId = req.user.id;
        
        await connection.beginTransaction();
        const inviteCode = await getUniqueInviteCode(connection);
        
        const [result] = await connection.execute(
            'INSERT INTO `groups` (name, description, created_by, invite_code) VALUES (?, ?, ?, ?)',
            [name.trim(), description ? description.trim() : '', userId, inviteCode]
        );
        const groupId = result.insertId;
        
        await connection.execute(
            'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)',
            [groupId, userId]
        );

        await createActivityLog(connection, {
            groupId,
            actorId: userId,
            actionType: 'group_created',
            description: `${req.user.name} created the group ${name.trim()}.`
        });

        await connection.commit();
        
        res.status(201).json({ id: groupId, name: name.trim(), inviteCode });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};

const checkMembership = async (groupId, userId) => {
    const [rows] = await pool.execute('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?', [groupId, userId]);
    return rows.length > 0;
};

const getGroupById = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.id;
        
        if (!(await checkMembership(groupId, userId))) {
            return throwError(403, 'You are not a member of this group.');
        }
        
        const [groups] = await pool.execute('SELECT id, name, description, invite_code as inviteCode, created_by as createdById FROM `groups` WHERE id = ?', [groupId]);
        if (groups.length === 0) return throwError(404, 'Group not found.');
        
        const [members] = await pool.execute(`
            SELECT u.id, u.name, u.email 
            FROM group_members gm 
            JOIN users u ON gm.user_id = u.id 
            WHERE gm.group_id = ?
        `, [groupId]);
        
        res.status(200).json({ ...groups[0], members });
    } catch (error) {
        next(error);
    }
};

const updateGroup = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const { name, description } = req.body;
        const userId = req.user.id;
        
        if (!name || name.trim() === '') return throwError(400, 'Group name is required.');
        
        const [groups] = await pool.execute('SELECT created_by FROM `groups` WHERE id = ?', [groupId]);
        if (groups.length === 0) return throwError(404, 'Group not found.');
        
        if (groups[0].created_by !== userId) {
            return throwError(403, 'Only the group creator may edit this group.');
        }
        
        await pool.execute(
            'UPDATE `groups` SET name = ?, description = ? WHERE id = ?',
            [name.trim(), description ? description.trim() : '', groupId]
        );

        await createActivityLog(pool, {
            groupId: Number(groupId),
            actorId: userId,
            actionType: 'group_updated',
            description: `${req.user.name} updated the group details.`
        });
        
        res.status(200).json({ message: 'Group updated successfully.' });
    } catch (error) {
        next(error);
    }
};

const joinGroup = async (req, res, next) => {
    try {
        const { inviteCode } = req.body;
        if (!inviteCode || inviteCode.trim() === '') return throwError(400, 'Invite code is required.');
        
        const [groups] = await pool.execute('SELECT id, name FROM `groups` WHERE invite_code = ?', [inviteCode.trim()]);
        if (groups.length === 0) return throwError(404, 'Invalid invite code.');
        
        const groupId = groups[0].id;
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();
            try {
                await connection.execute('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)', [groupId, req.user.id]);
            } catch (err) {
                if (err.code === 'ER_DUP_ENTRY') return throwError(409, 'You are already a member of this group.');
                throw err;
            }

            await createActivityLog(connection, {
                groupId: Number(groupId),
                actorId: req.user.id,
                actionType: 'group_joined',
                description: `${req.user.name} joined the group.`
            });

            await createNotificationsForGroupMembers(connection, {
                groupId: Number(groupId),
                actorId: req.user.id,
                type: 'group_joined',
                message: `${req.user.name} joined ${groups[0].name}.`
            });

            await connection.commit();
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
        
        res.status(200).json({ message: 'Successfully joined group.', group: groups[0] });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getGroups,
    createGroup,
    getGroupById,
    updateGroup,
    joinGroup
};
