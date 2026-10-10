
const express = require('express');
const db = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// GET ALL SKILLS
router.get('/', async (req, res) => {
    try {
        const [skills] = await db.execute(`
            SELECT
                s.id,
                s.name,
                s.category,
                s.description,
                s.teacher_id AS teacherId,
                u.name AS teacherName
            FROM skills s
            JOIN users u ON s.teacher_id = u.id
            ORDER BY s.created_at DESC
        `);

        res.json(skills);
    } catch (error) {
        console.error('Fetch skills error:', error.message);
        res.status(500).json({ message: 'Unable to fetch skills.' });
    }
});

// GET MY SKILLS
router.get('/mine', authMiddleware, async (req, res) => {
    try {
        const [skills] = await db.execute(
            `SELECT id, name, category, description,
                    teacher_id AS teacherId, created_at AS createdAt
             FROM skills
             WHERE teacher_id = ?
             ORDER BY created_at DESC`,
            [req.user.id]
        );

        res.json(skills);
    } catch (error) {
        console.error('Fetch my skills error:', error.message);
        res.status(500).json({ message: 'Unable to fetch your skills.' });
    }
});

// ADD A SKILL
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, category, description } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                message: 'Skill name is required.'
            });
        }

        const [result] = await db.execute(
            `INSERT INTO skills (name, category, description, teacher_id)
             VALUES (?, ?, ?, ?)`,
            [
                name.trim(),
                category?.trim() || null,
                description?.trim() || null,
                req.user.id
            ]
        );

        res.status(201).json({
            message: 'Skill added successfully!',
            skill: {
                id: result.insertId,
                name: name.trim(),
                category: category?.trim() || null,
                description: description?.trim() || null,
                teacherId: req.user.id
            }
        });
    } catch (error) {
        console.error('Add skill error:', error.message);
        res.status(500).json({ message: 'Unable to add skill.' });
    }
});

// DELETE MY SKILL
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const [result] = await db.execute(
            'DELETE FROM skills WHERE id = ? AND teacher_id = ?',
            [req.params.id, req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Skill not found or you do not own it.'
            });
        }

        res.json({ message: 'Skill deleted successfully!' });
    } catch (error) {
        console.error('Delete skill error:', error.message);
        res.status(500).json({ message: 'Unable to delete skill.' });
    }
});

module.exports = router;

