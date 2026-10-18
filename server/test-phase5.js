const assert = require('node:assert/strict');
const { calculateMemberBalances } = require('./src/utils/balanceCalculator');
const { calculateSettlementSuggestions } = require('./src/utils/settlementAlgorithm');

console.log('--- Testing Phase 5 Financial Logic ---');

// 1. Equal Split Calculation & Zero-Sum Guarantee
{
    const members = [
        { id: 1, name: 'User A' },
        { id: 2, name: 'User B' },
        { id: 3, name: 'User C' }
    ];
    const expensesPaid = [
        { userId: 1, totalPaid: 90000 } // ₹900 paid by A
    ];
    const expenseShares = [
        { userId: 1, totalShare: 30000 },
        { userId: 2, totalShare: 30000 },
        { userId: 3, totalShare: 30000 }
    ];

    const balances = calculateMemberBalances({
        members,
        expensesPaid,
        expenseShares,
        settlementsSent: [],
        settlementsReceived: []
    });

    assert.equal(balances.length, 3);

    const a = balances.find(b => b.userId === 1);
    const b = balances.find(b => b.userId === 2);
    const c = balances.find(b => b.userId === 3);

    assert.equal(a.netBalancePaise, 60000);
    assert.equal(a.status, 'owed');

    assert.equal(b.netBalancePaise, -30000);
    assert.equal(b.status, 'owes');

    assert.equal(c.netBalancePaise, -30000);
    assert.equal(c.status, 'owes');

    // Zero-sum check
    const totalNet = balances.reduce((sum, item) => sum + item.netBalancePaise, 0);
    assert.equal(totalNet, 0, 'Group net balance sum must equal 0');

    console.log('✓ Equal split balance calculation passed');
    console.log('✓ Zero-sum invariant verified (total net = 0)');
}

// 2. Custom Split and Recorded Settlement Application
{
    const members = [
        { id: 1, name: 'User A' },
        { id: 2, name: 'User B' },
        { id: 3, name: 'User C' }
    ];
    const expensesPaid = [
        { userId: 1, totalPaid: 150000 } // ₹1500 paid by A
    ];
    const expenseShares = [
        { userId: 1, totalShare: 50000 }, // ₹500
        { userId: 2, totalShare: 60000 }, // ₹600
        { userId: 3, totalShare: 40000 }  // ₹400
    ];

    // B settled ₹600 (60000 paise) to A
    const settlementsSent = [
        { userId: 2, totalSent: 60000 }
    ];
    const settlementsReceived = [
        { userId: 1, totalReceived: 60000 }
    ];

    const balances = calculateMemberBalances({
        members,
        expensesPaid,
        expenseShares,
        settlementsSent,
        settlementsReceived
    });

    const a = balances.find(b => b.userId === 1);
    const b = balances.find(b => b.userId === 2);
    const c = balances.find(b => b.userId === 3);

    assert.equal(a.netBalancePaise, 40000); // 150000 - 50000 - 60000 = 40000
    assert.equal(a.status, 'owed');

    assert.equal(b.netBalancePaise, 0);     // 0 - 60000 + 60000 = 0
    assert.equal(b.status, 'settled');

    assert.equal(c.netBalancePaise, -40000); // 0 - 40000 = -40000
    assert.equal(c.status, 'owes');

    const totalNet = balances.reduce((sum, item) => sum + item.netBalancePaise, 0);
    assert.equal(totalNet, 0);

    console.log('✓ Custom split and settlement transition passed');
}

// 3. Practical Greedy Algorithm Verification
{
    const balances = [
        { userId: 1, name: 'User A', netBalancePaise: 60000 },
        { userId: 2, name: 'User B', netBalancePaise: 20000 },
        { userId: 3, name: 'User C', netBalancePaise: -50000 },
        { userId: 4, name: 'User D', netBalancePaise: -30000 }
    ];

    // Ensure input balances are not mutated
    const originalCopy = JSON.parse(JSON.stringify(balances));

    const suggestions = calculateSettlementSuggestions(balances);

    assert.deepEqual(balances, originalCopy, 'Algorithm must not mutate input balances');
    assert.equal(suggestions.length, 3);

    assert.deepEqual(suggestions[0], {
        payerId: 3,
        payerName: 'User C',
        receiverId: 1,
        receiverName: 'User A',
        amountPaise: 50000
    });

    assert.deepEqual(suggestions[1], {
        payerId: 4,
        payerName: 'User D',
        receiverId: 1,
        receiverName: 'User A',
        amountPaise: 10000
    });

    assert.deepEqual(suggestions[2], {
        payerId: 4,
        payerName: 'User D',
        receiverId: 2,
        receiverName: 'User B',
        amountPaise: 20000
    });

    // Verify all debts and credits are fully satisfied by suggestions
    const totalSuggested = suggestions.reduce((sum, s) => sum + s.amountPaise, 0);
    assert.equal(totalSuggested, 80000, 'Sum of suggestions must equal total owed amount (80000 paise)');

    console.log('✓ Greedy settlement algorithm matching verified');
}

console.log('--- All Phase 5 Tests Passed Successfully ---');
