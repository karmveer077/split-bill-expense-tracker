/**
 * Balance Calculator Utility
 *
 * Implements pure financial calculations for group expenses and settlements.
 * All calculations are performed strictly in integer paise.
 *
 * Financial definition:
 * Net Balance = Expense Amount Paid
 *             - Expense Share Owed
 *             + Settlement Amount Sent
 *             - Settlement Amount Received
 *
 * Interpretation:
 * - Positive net balance: The member should receive money ('owed')
 * - Negative net balance: The member owes money ('owes')
 * - Zero net balance: The member is settled ('settled')
 */

/**
 * Calculates net balances for all members of a group.
 *
 * @param {Object} params
 * @param {Array} params.members - Array of group member user objects [{ id, name, email }]
 * @param {Array} params.expensesPaid - Array of [{ userId, totalPaid }]
 * @param {Array} params.expenseShares - Array of [{ userId, totalShare }]
 * @param {Array} params.settlementsSent - Array of [{ userId, totalSent }]
 * @param {Array} params.settlementsReceived - Array of [{ userId, totalReceived }]
 * @returns {Array} Array of member balance objects
 */
function calculateMemberBalances({
    members = [],
    expensesPaid = [],
    expenseShares = [],
    settlementsSent = [],
    settlementsReceived = []
}) {
    // Map aggregated values by userId using pure integer conversion
    const paidMap = new Map();
    for (const item of expensesPaid) {
        paidMap.set(Number(item.userId), Math.round(Number(item.totalPaid) || 0));
    }

    const shareMap = new Map();
    for (const item of expenseShares) {
        shareMap.set(Number(item.userId), Math.round(Number(item.totalShare) || 0));
    }

    const sentMap = new Map();
    for (const item of settlementsSent) {
        sentMap.set(Number(item.userId), Math.round(Number(item.totalSent) || 0));
    }

    const receivedMap = new Map();
    for (const item of settlementsReceived) {
        receivedMap.set(Number(item.userId), Math.round(Number(item.totalReceived) || 0));
    }

    // Initialize every group member with zero values and apply aggregates
    return members.map(member => {
        const userId = Number(member.id || member.userId);
        const expensePaidPaise = paidMap.get(userId) || 0;
        const expenseSharePaise = shareMap.get(userId) || 0;
        const settlementSentPaise = sentMap.get(userId) || 0;
        const settlementReceivedPaise = receivedMap.get(userId) || 0;

        const netBalancePaise =
            expensePaidPaise
            - expenseSharePaise
            + settlementSentPaise
            - settlementReceivedPaise;

        let status = 'settled';
        if (netBalancePaise > 0) {
            status = 'owed';
        } else if (netBalancePaise < 0) {
            status = 'owes';
        }

        return {
            userId,
            name: member.name,
            email: member.email || '',
            expensePaidPaise,
            expenseSharePaise,
            settlementSentPaise,
            settlementReceivedPaise,
            netBalancePaise,
            status
        };
    });
}

module.exports = {
    calculateMemberBalances
};
