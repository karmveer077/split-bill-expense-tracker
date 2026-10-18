const jwt = require('jsonwebtoken');
const { throwError } = require('../utils/validators');
const pool = require('../config/db');

module.exports = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided, authorization denied.' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Invalid token format.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const [rows] = await pool.execute('SELECT id, name FROM users WHERE id = ?', [decoded.id]);
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Token belongs to an invalid user.' });
        }
        
        req.user = { id: rows[0].id, name: rows[0].name };
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
             res.status(401).json({ message: 'Token has expired. Please log in again.' });
        } else {
             res.status(401).json({ message: 'Missing or invalid token.' });
        }
    }
};
