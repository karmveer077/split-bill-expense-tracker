const pool = require('../config/db');
const { calculateMemberBalances } = require('../utils/balanceCalculator');
const { calculateSettlementSuggestions } = require('../utils/settlementAlgorithm');
const { throwError } = require('../utils/validators');

/**
 * Checks if a user is a member of the given group.
 */
const checkMembership = async (groupId, userId) => {
    const [rows] = await pool.execute(
        'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?',
        [groupId, userId]
    );
    return rows.length > 0;
};

/**
 * Loads raw group financial data and computes member balances.
 * Does NOT persist or read from any balances table.
 */
const fetchGroupBalancesData = async (groupId) => {
    // 1. Verify group exists (note: `groups` table is escaped with backticks)
    const [groups] = await pool.execute(
        'SELECT id, name, description FROM `groups` WHERE id = ?',
        [groupId]
    );
    if (groups.length === 0) {
        return throwError(404, 'Group not found.');
    }

    // 2. Load all members
    const [members] = await pool.execute(
        `SELECT u.id, u.name, u.email 
         FROM group_members gm 
         JOIN users u ON gm.user_id = u.id 
         WHERE gm.group_id = ? 
         ORDER BY u.id ASC`,
        [groupId]
    );

    // 3. Load total expenses paid grouped by payer
    const [expensesPaid] = await pool.execute(
        `SELECT paid_by as userId, CAST(SUM(amount_paise) AS UNSIGNED) as totalPaid 
         FROM expenses 
         WHERE group_id = ? 
         GROUP BY paid_by`,
        [groupId]
    );

    // 4. Load total expense shares grouped by participant
    const [expenseShares] = await pool.execute(
        `SELECT es.user_id as userId, CAST(SUM(es.share_paise) AS UNSIGNED) as totalShare 
         FROM expense_splits es 
         JOIN expenses e ON es.expense_id = e.id 
         WHERE e.group_id = ? 
         GROUP BY es.user_id`,
        [groupId]
    );

    // 5. Load total settlement amounts grouped by payer (sent)
    const [settlementsSent] = await pool.execute(
        `SELECT payer_id as userId, CAST(SUM(amount_paise) AS UNSIGNED) as totalSent 
         FROM settlements 
         WHERE group_id = ? 
         GROUP BY payer_id`,
        [groupId]
    );

    // 6. Load total settlement amounts grouped by receiver (received)
    const [settlementsReceived] = await pool.execute(
        `SELECT receiver_id as userId, CAST(SUM(amount_paise) AS UNSIGNED) as totalReceived 
         FROM settlements 
         WHERE group_id = ? 
         GROUP BY receiver_id`,
        [groupId]
    );

    // 7. Calculate member net balances using pure integer math
    const balances = calculateMemberBalances({
        members,
        expensesPaid,
        expenseShares,
        settlementsSent,
        settlementsReceived
    });

    return {
        group: groups[0],
        members,
        balances
    };
};

/**
 * GET /api/groups/:groupId/balances
 * Returns real calculated balances for each member in the group.
 */
const getGroupBalances = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.id;

        if (!(await checkMembership(groupId, userId))) {
            return throwError(403, 'You are not a member of this group.');
        }

        const { group, balances } = await fetchGroupBalancesData(groupId);

        res.status(200).json({
            group,
            balances
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/groups/:groupId/settlements/suggestions
 * Returns greedy settlement suggestions without mutating state.
 */
const getSettlementSuggestions = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.id;

        if (!(await checkMembership(groupId, userId))) {
            return throwError(403, 'You are not a member of this group.');
        }

        const { balances } = await fetchGroupBalancesData(groupId);
        const suggestions = calculateSettlementSuggestions(balances);

        res.status(200).json({
            groupId: Number(groupId),
            suggestions
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    checkMembership,
    fetchGroupBalancesData,
    getGroupBalances,
    getSettlementSuggestions
};
