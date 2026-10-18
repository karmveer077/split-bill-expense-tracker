// Creates suggested payments without mutating the input balances.
function calculateSettlementSuggestions(balances = []) {
    const creditors = [];
    const debtors = [];

    for (const b of balances) {
        const net = Math.round(Number(b.netBalancePaise) || 0);
        if (net > 0) {
            creditors.push({
                userId: b.userId,
                name: b.name,
                amount: net
            });
        } else if (net < 0) {
            debtors.push({
                userId: b.userId,
                name: b.name,
                amount: Math.abs(net)
            });
        }
    }

    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    const suggestions = [];
    let debtorIdx = 0;
    let creditorIdx = 0;

    while (debtorIdx < debtors.length && creditorIdx < creditors.length) {
        const debtor = debtors[debtorIdx];
        const creditor = creditors[creditorIdx];

        if (debtor.amount === 0) {
            debtorIdx++;
            continue;
        }

        if (creditor.amount === 0) {
            creditorIdx++;
            continue;
        }

        const settleAmount = Math.min(debtor.amount, creditor.amount);

        suggestions.push({
            payerId: debtor.userId,
            payerName: debtor.name,
            receiverId: creditor.userId,
            receiverName: creditor.name,
            amountPaise: settleAmount
        });

        debtor.amount -= settleAmount;
        creditor.amount -= settleAmount;

        if (debtor.amount === 0) debtorIdx++;
        if (creditor.amount === 0) creditorIdx++;
    }

    return suggestions;
}

module.exports = {
    calculateSettlementSuggestions
};
