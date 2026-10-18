const pool = require('../config/db');
const { throwError } = require('../utils/validators');
const { rupeesToPaise } = require('../utils/money');
const { checkMembership, fetchGroupBalancesData } = require('./balanceController');
const { createActivityLog, createNotificationsForGroupMembers } = require('../utils/groupEvents');

/**
 * GET /api/groups/:groupId/settlements
 * Returns settlement history for the group.
 */
const getSettlements = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.id;

        if (!(await checkMembership(groupId, userId))) {
            return throwError(403, 'You are not a member of this group.');
        }

        const [settlements] = await pool.execute(
            `SELECT 
                s.id,
                s.group_id as groupId,
                s.payer_id as payerId,
                up.name as payerName,
                s.receiver_id as receiverId,
                ur.name as receiverName,
                s.amount_paise as amountPaise,
                DATE_FORMAT(s.settlement_date, '%Y-%m-%d') as settlementDate,
                s.created_by as createdById,
                uc.name as createdByName,
                s.created_at as createdAt
             FROM settlements s
             JOIN users up ON s.payer_id = up.id
             JOIN users ur ON s.receiver_id = ur.id
             JOIN users uc ON s.created_by = uc.id
             WHERE s.group_id = ?
             ORDER BY s.settlement_date DESC, s.created_at DESC`,
            [groupId]
        );

        res.status(200).json(settlements);
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/groups/:groupId/settlements
 * Records a settlement payment between two group members.
 */
const createSettlement = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.id;
        const { payerId, receiverId, amountPaise, amount, settlementDate } = req.body;

        // 1. Verify caller is a member of the group
        if (!(await checkMembership(groupId, userId))) {
            return throwError(403, 'You are not a member of this group.');
        }

        const numPayerId = Number(payerId);
        const numReceiverId = Number(receiverId);

        if (!numPayerId || !numReceiverId) {
            return throwError(400, 'Payer and receiver IDs are required.');
        }

        // 2. Payer and receiver must be different users
        if (numPayerId === numReceiverId) {
            return throwError(400, 'Settlement payer and receiver must be different.');
        }

        // 3. Authenticated user must be either the payer or the receiver
        if (userId !== numPayerId && userId !== numReceiverId) {
            return throwError(403, 'You must be either the payer or the receiver to record this settlement.');
        }

        // 4. Verify both payer and receiver are group members
        const [memberRows] = await pool.execute(
            'SELECT user_id FROM group_members WHERE group_id = ? AND user_id IN (?, ?)',
            [groupId, numPayerId, numReceiverId]
        );
        if (memberRows.length !== 2) {
            return throwError(400, 'Both payer and receiver must be members of this group.');
        }

        // 5. Convert and validate integer paise amount
        let finalAmountPaise;
        if (amountPaise !== undefined && amountPaise !== null) {
            finalAmountPaise = Math.round(Number(amountPaise));
        } else if (amount !== undefined && amount !== null) {
            finalAmountPaise = rupeesToPaise(amount);
        } else {
            return throwError(400, 'Settlement amount is required.');
        }

        if (!Number.isInteger(finalAmountPaise) || finalAmountPaise <= 0) {
            return throwError(400, 'Settlement amount must be greater than zero.');
        }

        // 6. Validate settlement date (must be YYYY-MM-DD and not in the future)
        if (!settlementDate || typeof settlementDate !== 'string') {
            return throwError(400, 'A valid settlement date is required.');
        }

        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(settlementDate)) {
            return throwError(400, 'Settlement date must be in YYYY-MM-DD format.');
        }

        const parsedDate = new Date(settlementDate);
        if (isNaN(parsedDate.getTime())) {
            return throwError(400, 'Invalid settlement date.');
        }

        // Compare against today's local date
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        if (settlementDate > todayStr) {
            return throwError(400, 'Settlement date cannot be in the future.');
        }

        // 7. Calculate current group balances dynamically from database
        const { balances } = await fetchGroupBalancesData(groupId);
        const payerBal = balances.find(b => b.userId === numPayerId);
        const receiverBal = balances.find(b => b.userId === numReceiverId);

        const payerNet = payerBal ? payerBal.netBalancePaise : 0;
        const receiverNet = receiverBal ? receiverBal.netBalancePaise : 0;

        // Payer must currently owe money (negative net balance)
        if (payerNet >= 0) {
            return throwError(400, 'The payer does not currently owe money.');
        }
        const payerDebt = Math.abs(payerNet);
        if (finalAmountPaise > payerDebt) {
            return throwError(400, 'The payer does not currently owe this amount.');
        }

        // Receiver must currently be owed money (positive net balance)
        if (receiverNet <= 0) {
            return throwError(400, 'The receiver is not currently owed money.');
        }
        const receiverCredit = receiverNet;
        if (finalAmountPaise > receiverCredit) {
            return throwError(400, 'The receiver is not currently owed this amount.');
        }

        // 8. Insert settlement record and create activity log / notifications in a transaction
        const connection = await pool.getConnection();
        let settlementId;
        try {
            await connection.beginTransaction();

            const [result] = await connection.execute(
                `INSERT INTO settlements (group_id, payer_id, receiver_id, amount_paise, settlement_date, created_by)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [groupId, numPayerId, numReceiverId, finalAmountPaise, settlementDate, userId]
            );

            settlementId = result.insertId;

            // Fetch user names for readable activity log and notification messages
            const [payerRows] = await connection.execute('SELECT name FROM users WHERE id = ?', [numPayerId]);
            const [receiverRows] = await connection.execute('SELECT name FROM users WHERE id = ?', [numReceiverId]);
            const payerName = payerRows.length > 0 ? payerRows[0].name : 'Member';
            const receiverName = receiverRows.length > 0 ? receiverRows[0].name : 'Member';
            const formattedAmount = (finalAmountPaise / 100).toFixed(2);

            await createActivityLog(connection, {
                groupId: Number(groupId),
                actorId: userId,
                actionType: 'settlement_recorded',
                description: `${payerName} recorded a settlement of ₹${formattedAmount} to ${receiverName}.`
            });

            await createNotificationsForGroupMembers(connection, {
                groupId: Number(groupId),
                actorId: userId,
                type: 'settlement_recorded',
                message: `${payerName} recorded a settlement of ₹${formattedAmount} to ${receiverName}.`
            });

            await connection.commit();
        } catch (txErr) {
            await connection.rollback();
            throw txErr;
        } finally {
            connection.release();
        }

        // Fetch inserted record with user names
        const [rows] = await pool.execute(
            `SELECT 
                s.id,
                s.group_id as groupId,
                s.payer_id as payerId,
                up.name as payerName,
                s.receiver_id as receiverId,
                ur.name as receiverName,
                s.amount_paise as amountPaise,
                DATE_FORMAT(s.settlement_date, '%Y-%m-%d') as settlementDate,
                s.created_by as createdById,
                uc.name as createdByName,
                s.created_at as createdAt
             FROM settlements s
             JOIN users up ON s.payer_id = up.id
             JOIN users ur ON s.receiver_id = ur.id
             JOIN users uc ON s.created_by = uc.id
             WHERE s.id = ?`,
            [settlementId]
        );

        res.status(201).json(rows[0]);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getSettlements,
    createSettlement
};
