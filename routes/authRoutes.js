
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Generate authentication token
function generateToken(user) {
    return jwt.sign(
        {
            id: user.id,
            email: user.email
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
}

// REGISTER
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: 'Name, email and password are required.'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: 'Password must contain at least 8 characters.'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const [existingUsers] = await db.execute(
            'SELECT id FROM users WHERE email = ?',
            [normalizedEmail]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                message: 'An account with this email already exists.'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const [result] = await db.execute(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name.trim(), normalizedEmail, hashedPassword]
        );

        const user = {
            id: result.insertId,
            name: name.trim(),
            email: normalizedEmail
        };

        const token = generateToken(user);

        return res.status(201).json({
            message: 'Registration successful!',
            token,
            user
        });
    } catch (error) {
        console.error('Registration error:', error.message);

        return res.status(500).json({
            message: 'Registration failed. Please try again.'
        });
    }
});

// LOGIN
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: 'Email and password are required.'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const [users] = await db.execute(
            'SELECT id, name, email, password FROM users WHERE email = ?',
            [normalizedEmail]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: 'Invalid email or password.'
            });
        }

        const user = users[0];

        const passwordMatches = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatches) {
            return res.status(401).json({
                message: 'Invalid email or password.'
            });
        }

        const token = generateToken(user);

        return res.json({
            message: 'Login successful!',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error.message);

        return res.status(500).json({
            message: 'Login failed. Please try again.'
        });
    }
});

// GET CURRENT USER
router.get('/me', authMiddleware, (req, res) => {
    res.json({
        user: req.user
    });
});

module.exports = router;
