const pool = require('../config/db');
const { throwError } = require('../utils/validators');
const { rupeesToPaise, paiseToRupees, calculateEqualSharesPaise } = require('../utils/money');
const { createActivityLog, createNotificationsForGroupMembers } = require('../utils/groupEvents');

const checkMembership = async (groupId, userId) => {
    const [rows] = await pool.execute('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?', [groupId, userId]);
    return rows.length > 0;
};

const getExpenses = async (req, res, next) => {
    try {
        const userId = req.user.id;
        
        let query = `
            SELECT e.id, e.group_id as groupId, e.title, e.amount_paise as amountPaise, 
                   e.category, e.expense_date as date, e.paid_by as paidByMemberId, 
                   e.created_by as createdBy, e.split_type as splitType,
                   g.name as groupName, u.name as payerName
            FROM expenses e
            JOIN \`groups\` g ON e.group_id = g.id
            JOIN users u ON e.paid_by = u.id
            JOIN group_members gm ON e.group_id = gm.group_id
            WHERE gm.user_id = ?
            ORDER BY e.expense_date DESC, e.created_at DESC
        `;
        const params = [userId];
        
        // Optional filters could be added here via parameterized query building.
        const [expenses] = await pool.execute(query, params);
        
        if (expenses.length === 0) return res.status(200).json([]);
        
        const expenseIds = expenses.map(e => e.id);
        const placeholders = expenseIds.map(() => '?').join(',');
        
        const [splits] = await pool.query(
            `SELECT expense_id as expenseId, user_id as memberId, share_paise as amountPaise 
             FROM expense_splits WHERE expense_id IN (${placeholders})`,
            expenseIds
        );
        
        const enrichedExpenses = expenses.map(exp => {
            const expSplits = splits
                .filter(s => s.expenseId === exp.id)
                .map(s => ({ memberId: s.memberId, amount: paiseToRupees(s.amountPaise) }));
                
            return {
                id: exp.id,
                groupId: exp.groupId,
                groupName: exp.groupName,
                title: exp.title,
                amount: paiseToRupees(exp.amountPaise),
                category: exp.category,
                date: new Date(exp.date).toISOString().split('T')[0], // format mapping back to yyyy-mm-dd safely
                paidByMemberId: exp.paidByMemberId,
                payerName: exp.payerName,
                createdById: exp.createdBy,
                splitType: exp.splitType,
                participantIds: expSplits.map(s => s.memberId),
                splits: expSplits // array of { memberId, amount } floats
            };
        });
        
        res.status(200).json(enrichedExpenses);
    } catch (error) {
        next(error);
    }
};

const validateSplits = (amountPaise, participantIds, splitType, explicitSplits) => {
    if (participantIds.length === 0) return throwError(400, 'At least one participant is required.');
    
    // De-duplicate participants.
    const uniqueParticipants = [...new Set(participantIds)];
    if (uniqueParticipants.length !== participantIds.length) return throwError(400, 'Duplicate participants are not allowed.');

    if (splitType === 'custom') {
        if (!explicitSplits || explicitSplits.length !== uniqueParticipants.length) {
            return throwError(400, 'Custom splits array must explicitly match the participants.');
        }
        
        let sumPaise = 0;
        const validSplits = [];
        
        for (const s of explicitSplits) {
            if (!uniqueParticipants.includes(s.memberId)) {
                return throwError(400, 'Split member must be part of the participant list.');
            }
            const sPaise = rupeesToPaise(s.amount);
            if (sPaise < 0) return throwError(400, 'Split amounts must be non-negative.');
            sumPaise += sPaise;
            validSplits.push({ memberId: s.memberId, amountPaise: sPaise });
        }
        
        if (sumPaise !== amountPaise) {
            return throwError(400, 'Custom split total must exactly equal the total expense amount.');
        }
        return validSplits;
    } else {
        // Equal
        const { baseShare, remainder } = calculateEqualSharesPaise(amountPaise, uniqueParticipants.length);
        const validSplits = uniqueParticipants.map((id, index) => {
        // Remainder paise goes to the first participant to keep splits integer-exact.
             const amountPaise = index === 0 ? baseShare + remainder : baseShare;
             return { memberId: id, amountPaise };
        });
        return validSplits;
    }
};

const createExpense = async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
        const { groupId } = req.params;
        const { title, amount, category, date, paidByUserId, participantIds, splitType, splits } = req.body;
        const userId = req.user.id;
        
        if (!title || title.trim() === '') return throwError(400, 'Description is required.');
        if (!amount || amount <= 0) return throwError(400, 'Valid amount is required.');
        if (!category) return throwError(400, 'Category is required.');
        if (!date) return throwError(400, 'Date is required.');
        if (!paidByUserId) return throwError(400, 'Payer is required.');
        
        const isUserMember = await checkMembership(groupId, userId);
        if (!isUserMember) return throwError(403, 'You are not a member of this group.');
        
        const isPayerMember = await checkMembership(groupId, paidByUserId);
        if (!isPayerMember) return throwError(400, 'Payer must be a member of this group.');

        for (const pid of participantIds) {
             const isMem = await checkMembership(groupId, pid);
             if (!isMem) return throwError(400, `Participant ${pid} is not a member of this group.`);
        }
        
        const amountPaise = rupeesToPaise(amount);
        const derivedSplits = validateSplits(amountPaise, participantIds, splitType || 'equal', splits);
        
        await connection.beginTransaction();
        
        const [result] = await connection.execute(
            `INSERT INTO expenses (group_id, title, amount_paise, category, expense_date, paid_by, created_by, split_type) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [groupId, title.trim(), amountPaise, category, date, paidByUserId, userId, splitType || 'equal']
        );
        const expenseId = result.insertId;
        
        for (const s of derivedSplits) {
             await connection.execute(
                 'INSERT INTO expense_splits (expense_id, user_id, share_paise) VALUES (?, ?, ?)',
                 [expenseId, s.memberId, s.amountPaise]
             );
        }

        const formattedAmount = (amountPaise / 100).toFixed(2);
        await createActivityLog(connection, {
            groupId: Number(groupId),
            actorId: userId,
            actionType: 'expense_added',
            description: `${req.user.name} added ${title.trim()} for ₹${formattedAmount}.`
        });

        await createNotificationsForGroupMembers(connection, {
            groupId: Number(groupId),
            actorId: userId,
            type: 'expense_added',
            message: `${req.user.name} added a new expense: ${title.trim()}.`
        });
        
        await connection.commit();
        res.status(201).json({ message: 'Expense created successfully', expenseId });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};

const updateExpense = async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
        const { expenseId } = req.params;
        const { title, amount, category, date, paidByUserId, participantIds, splitType, splits } = req.body;
        const userId = req.user.id;
        
        // Grab existing expense to verify creator & group
        const [existingRows] = await connection.execute('SELECT created_by, group_id FROM expenses WHERE id = ?', [expenseId]);
        if (existingRows.length === 0) return throwError(404, 'Expense not found.');
        
        const existingExp = existingRows[0];
        if (existingExp.created_by !== userId) return throwError(403, 'Only the expense creator may update it.');
        
        const groupId = existingExp.group_id;
        
        // Basic validations
        if (!title || title.trim() === '') return throwError(400, 'Description is required.');
        if (!amount || amount <= 0) return throwError(400, 'Valid amount is required.');
        if (!category) return throwError(400, 'Category is required.');
        if (!date) return throwError(400, 'Date is required.');
        if (!paidByUserId) return throwError(400, 'Payer is required.');
        
        const isPayerMember = await checkMembership(groupId, paidByUserId);
        if (!isPayerMember) return throwError(400, 'Payer must be a member of this group.');

        for (const pid of participantIds) {
             const isMem = await checkMembership(groupId, pid);
             if (!isMem) return throwError(400, `Participant ${pid} is not a member of this group.`);
        }
        
        const amountPaise = rupeesToPaise(amount);
        const derivedSplits = validateSplits(amountPaise, participantIds, splitType || 'equal', splits);
        
        await connection.beginTransaction();
        
        await connection.execute(
            `UPDATE expenses SET title=?, amount_paise=?, category=?, expense_date=?, paid_by=?, split_type=? WHERE id=?`,
            [title.trim(), amountPaise, category, date, paidByUserId, splitType || 'equal', expenseId]
        );
        
        // Wipe old splits and re-insert
        await connection.execute('DELETE FROM expense_splits WHERE expense_id=?', [expenseId]);
        
        for (const s of derivedSplits) {
             await connection.execute(
                 'INSERT INTO expense_splits (expense_id, user_id, share_paise) VALUES (?, ?, ?)',
                 [expenseId, s.memberId, s.amountPaise]
             );
        }

        await createActivityLog(connection, {
            groupId: Number(groupId),
            actorId: userId,
            actionType: 'expense_updated',
            description: `${req.user.name} updated the ${title.trim()} expense.`
        });

        await createNotificationsForGroupMembers(connection, {
            groupId: Number(groupId),
            actorId: userId,
            type: 'expense_updated',
            message: `${req.user.name} updated the ${title.trim()} expense.`
        });
        
        await connection.commit();
        res.status(200).json({ message: 'Expense updated successfully' });
        
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
         connection.release();
    }
};

const deleteExpense = async (req, res, next) => {
    try {
        const { expenseId } = req.params;
        const userId = req.user.id;
        
        // Check ownership and capture title/group_id before deletion
        const [existingRows] = await pool.execute('SELECT title, group_id, created_by FROM expenses WHERE id = ?', [expenseId]);
        if (existingRows.length === 0) return throwError(404, 'Expense not found.');
        
        const existingExp = existingRows[0];
        if (existingExp.created_by !== userId) {
             return throwError(403, 'Only the expense creator may delete it.');
        }
        
        // Cascades automatically to splits table
        await pool.execute('DELETE FROM expenses WHERE id = ?', [expenseId]);

        await createActivityLog(pool, {
            groupId: Number(existingExp.group_id),
            actorId: userId,
            actionType: 'expense_deleted',
            description: `${req.user.name} deleted the ${existingExp.title} expense.`
        });

        await createNotificationsForGroupMembers(pool, {
            groupId: Number(existingExp.group_id),
            actorId: userId,
            type: 'expense_deleted',
            message: `${req.user.name} deleted the ${existingExp.title} expense.`
        });
        
        res.status(200).json({ message: 'Expense deleted successfully.' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getExpenses,
    createExpense,
    updateExpense,
    deleteExpense
};
