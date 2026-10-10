
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/db');

// Import API routes
const authRoutes = require('./routes/authRoutes');
const skillRoutes = require('./routes/skillRoutes');
const requestRoutes = require('./routes/requestRoutes');

const app = express();

// Middleware
app.use(cors({
    origin: 'http://localhost:5173'
}));

app.use(express.json());

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'SkillLoop backend is running!'
    });
});

// Database connection test
app.get('/api/test-db', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT DATABASE() AS databaseName'
        );

        res.json({
            message: 'MySQL connected successfully!',
            database: rows[0].databaseName
        });
    } catch (error) {
        console.error('Database error:', error.message);

        res.status(500).json({
            message: 'MySQL connection failed.'
        });
    }
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Skills routes
app.use('/api/skills', skillRoutes);

// Skill request routes
app.use('/api/requests', requestRoutes);

// Handle unknown API routes
app.use((req, res) => {
    res.status(404).json({
        message: 'API route not found.'
    });
});

// Handle unexpected errors
app.use((err, req, res, next) => {
    console.error('Server error:', err.message);

    if (res.headersSent) {
        return next(err);
    }

    res.status(500).json({
        message: 'Internal server error.'
    });
});

// Start the server after checking MySQL
const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        const connection = await db.getConnection();

        console.log('MySQL connected successfully!');
        connection.release();

        app.listen(PORT, () => {
            console.log(
                `SkillLoop server running on port ${PORT}`
            );
        });
    } catch (error) {
        console.error(
            'Unable to connect to MySQL:',
            error.message
        );

        process.exit(1);
    }
}

startServer();
