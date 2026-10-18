const crypto = require('crypto');
const pool = require('../config/db');

// Generates a 6-8 char unique alphanumeric string
const generateInviteCode = () => {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
};

const getUniqueInviteCode = async (connection) => {
    let inviteCode;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
        inviteCode = generateInviteCode();
        // Check uniqueness in DB using provided connection
        const [rows] = await connection.execute('SELECT id FROM `groups` WHERE invite_code = ?', [inviteCode]);
        if (rows.length === 0) {
            isUnique = true;
        }
        attempts++;
    }

    if (!isUnique) {
        throw new Error('Failed to generate a unique invite code after maximum attempts.');
    }

    return inviteCode;
};

module.exports = {
    generateInviteCode,
    getUniqueInviteCode
};
