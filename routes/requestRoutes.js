
const express = require('express');
const db = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// GET ALL REQUESTS SENT OR RECEIVED BY THE LOGGED-IN USER
router.get('/', authMiddleware, async (req, res) => {
    try {
        const [requests] = await db.execute(
            `SELECT
                r.id,
                r.skill_id AS skillId,
                s.name AS skillName,
                r.requester_id AS requesterId,
                requester.name AS requesterName,
                r.recipient_id AS recipientId,
                recipient.name AS recipientName,
                r.status,
                r.created_at AS createdAt
             FROM requests r
             JOIN skills s ON r.skill_id = s.id
             JOIN users requester ON r.requester_id = requester.id
             JOIN users recipient ON r.recipient_id = recipient.id
             WHERE r.requester_id = ? OR r.recipient_id = ?
             ORDER BY r.created_at DESC`,
            [req.user.id, req.user.id]
        );

        res.json(requests);
    } catch (error) {
        console.error('Fetch requests error:', error.message);
        res.status(500).json({
            message: 'Unable to fetch requests.'
        });
    }
});

// SEND A SKILL REQUEST
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { skillId } = req.body;

        if (!skillId || !Number.isInteger(Number(skillId)) ||
            Number(skillId) <= 0) {
            return res.status(400).json({
                message: 'A valid skill ID is required.'
            });
        }

        const [skills] = await db.execute(
            'SELECT id, name, teacher_id FROM skills WHERE id = ?',
            [Number(skillId)]
        );

        if (skills.length === 0) {
            return res.status(404).json({
                message: 'Skill not found.'
            });
        }

        const skill = skills[0];

        if (skill.teacher_id === req.user.id) {
            return res.status(400).json({
                message: 'You cannot request your own skill.'
            });
        }

        const [existingRequests] = await db.execute(
            `SELECT id FROM requests
             WHERE skill_id = ?
               AND requester_id = ?
               AND status = 'Pending'`,
            [skill.id, req.user.id]
        );

        if (existingRequests.length > 0) {
            return res.status(409).json({
                message: 'You already have a pending request for this skill.'
            });
        }

        const [result] = await db.execute(
            `INSERT INTO requests
                (skill_id, requester_id, recipient_id, status)
             VALUES (?, ?, ?, 'Pending')`,
            [skill.id, req.user.id, skill.teacher_id]
        );

        await db.execute(
            `INSERT INTO notifications (recipient_id, message, request_id)
             VALUES (?, ?, ?)`,
            [
                skill.teacher_id,
                `${req.user.name} requested to learn ${skill.name}.`,
                result.insertId
            ]
        );

        res.status(201).json({
            message: 'Skill request sent successfully!',
            request: {
                id: result.insertId,
                skillId: skill.id,
                skillName: skill.name,
                requesterId: req.user.id,
                recipientId: skill.teacher_id,
                status: 'Pending'
            }
        });
    } catch (error) {
        console.error('Send request error:', error.message);
        res.status(500).json({
            message: 'Unable to send skill request.'
        });
    }
});

// ACCEPT OR REJECT A REQUEST
router.patch('/:id/status', authMiddleware, async (req, res) => {
    try {
        const { status } = req.body;

        if (!['Accepted', 'Rejected'].includes(status)) {
            return res.status(400).json({
                message: 'Status must be Accepted or Rejected.'
            });
        }

        const [requests] = await db.execute(
            `SELECT r.id, r.status, r.requester_id,
                    r.recipient_id, s.name AS skillName
             FROM requests r
             JOIN skills s ON r.skill_id = s.id
             WHERE r.id = ?`,
            [req.params.id]
        );

        if (requests.length === 0) {
            return res.status(404).json({
                message: 'Request not found.'
            });
        }

        const request = requests[0];

        if (request.recipient_id !== req.user.id) {
            return res.status(403).json({
                message: 'Only the recipient can accept or reject this request.'
            });
        }

        if (request.status !== 'Pending') {
            return res.status(400).json({
                message: 'Only pending requests can be updated.'
            });
        }

        await db.execute(
            'UPDATE requests SET status = ? WHERE id = ?',
            [status, request.id]
        );

        await db.execute(
            `INSERT INTO notifications (recipient_id, message, request_id)
             VALUES (?, ?, ?)`,
            [
                request.requester_id,
                `Your request for ${request.skillName} was ${status.toLowerCase()}.`,
                request.id
            ]
        );

        res.json({
            message: `Request ${status.toLowerCase()} successfully.`,
            status
        });
    } catch (error) {
        console.error('Update request error:', error.message);
        res.status(500).json({
            message: 'Unable to update request.'
        });
    }
});

// CANCEL A PENDING REQUEST
router.patch('/:id/cancel', authMiddleware, async (req, res) => {
    try {
        const [requests] = await db.execute(
            `SELECT id, status, recipient_id
             FROM requests
             WHERE id = ? AND requester_id = ?`,
            [req.params.id, req.user.id]
        );

        if (requests.length === 0) {
            return res.status(404).json({
                message: 'Request not found.'
            });
        }

        const request = requests[0];

        if (request.status !== 'Pending') {
            return res.status(400).json({
                message: 'Only pending requests can be cancelled.'
            });
        }

        await db.execute(
            "UPDATE requests SET status = 'Cancelled' WHERE id = ?",
            [request.id]
        );

        await db.execute(
            `INSERT INTO notifications (recipient_id, message, request_id)
             VALUES (?, ?, ?)`,
            [
                request.recipient_id,
                `${req.user.name} cancelled a skill request.`,
                request.id
            ]
        );

        res.json({
            message: 'Request cancelled successfully.'
        });
    } catch (error) {
        console.error('Cancel request error:', error.message);
        res.status(500).json({
            message: 'Unable to cancel request.'
        });
    }
});

// MARK AN ACCEPTED REQUEST AS COMPLETED
router.patch('/:id/complete', authMiddleware, async (req, res) => {
    try {
        const [requests] = await db.execute(
            `SELECT id, status, requester_id, recipient_id
             FROM requests
             WHERE id = ?
               AND (requester_id = ? OR recipient_id = ?)`,
            [req.params.id, req.user.id, req.user.id]
        );

        if (requests.length === 0) {
            return res.status(404).json({
                message: 'Request not found.'
            });
        }

        const request = requests[0];

        if (request.status !== 'Accepted') {
            return res.status(400).json({
                message: 'Only accepted requests can be completed.'
            });
        }

        await db.execute(
            "UPDATE requests SET status = 'Completed' WHERE id = ?",
            [request.id]
        );

        const otherUserId =
            request.requester_id === req.user.id
                ? request.recipient_id
                : request.requester_id;

        await db.execute(
            `INSERT INTO notifications (recipient_id, message, request_id)
             VALUES (?, ?, ?)`,
            [
                otherUserId,
                `${req.user.name} marked a skill request as completed.`,
                request.id
            ]
        );

        res.json({
            message: 'Request marked as completed.'
        });
    } catch (error) {
        console.error('Complete request error:', error.message);
        res.status(500).json({
            message: 'Unable to complete request.'
        });
    }
});

module.exports = router;

