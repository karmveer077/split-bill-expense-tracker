const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { isValidEmail, throwError } = require('../utils/validators');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
};

const register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return throwError(400, 'Name, email, and password are required.');
        }

        if (!isValidEmail(email)) {
            return throwError(400, 'Please provide a valid email format.');
        }

        if (password.length < 6) {
            return throwError(400, 'Password must be at least 6 characters long.');
        }

        // Strong password enforced at registration: frontend mirrors this rule so the error
        // should rarely surface here, but the backend validates independently for safety.
        const strongPasswordRe = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
        if (!strongPasswordRe.test(password)) {
            return throwError(400, 'Password must be at least 8 characters and include an uppercase letter, lowercase letter, number, and special character.');
        }

        const normalizedEmail = email.toLowerCase();
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        let insertId;
        try {
            const [result] = await pool.execute(
                'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
                [name.trim(), normalizedEmail, passwordHash]
            );
            insertId = result.insertId;
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return throwError(409, 'A user with that email already exists.');
            }
            throw err;
        }

        const token = generateToken(insertId);
        
        res.status(201).json({
            token,
            user: {
                id: insertId,
                name: name.trim(),
                email: normalizedEmail
            }
        });

    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return throwError(400, 'Email and password are required.');
        }

        const normalizedEmail = email.toLowerCase();
        
        const [rows] = await pool.execute(
            'SELECT id, name, email, password_hash FROM users WHERE email = ?',
            [normalizedEmail]
        );

        const user = rows[0];

        if (!user) {
            return throwError(404, 'No account exists with this email. Please sign up first.');
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return throwError(401, 'Incorrect password. Please try again.');
        }

        const token = generateToken(user.id);

        res.status(200).json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        next(error);
    }
};

const getMe = async (req, res, next) => {
    try {
         const [rows] = await pool.execute(
             'SELECT id, name, email, created_at, updated_at FROM users WHERE id = ?',
             [req.user.id] // Available from authMiddleware
         );
         
         const user = rows[0];
         if (!user) {
             return throwError(404, 'User not found.');
         }
         
         res.status(200).json(user);
    } catch (error) {
         next(error);
    }
};

module.exports = {
    register,
    login,
    getMe
};
