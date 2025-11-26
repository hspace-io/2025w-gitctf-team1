const express = require('express');
const crypto = require('crypto');

const router = express.Router();
const db = require('../db.cjs');

const { JWT_SECRET } = require('../controller/authController.cjs'); 
const jwt = require('jsonwebtoken'); 

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (token == null) {
        return res.status(401).json({ success: false, message: "Authentication token is missing." });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => { 
        if (err) {
            return res.status(403).json({ success: false, message: "Invalid or expired token." });
        }
        
        req.user = user;
        req.userId = user.id; 
        
        next();
    });
};

router.get('/', (req, res) => {
    try {
        const events = db.prepare(`
            SELECT 
                e.id,
                e.clubName,
                e.category,
                e.field,
                e.eventDate,
                e.recruitmentCount,
                e.difficulty,
                e.title,
                e.status,
                e.CreatedAt,
                e.UpdatedAt,
                u.name as authorName,
                u.username as authorUsername
            FROM Event e
            LEFT JOIN users u ON e.authorId = u.id
            ORDER BY e.CreatedAt DESC
        `).all();

        return res.json({ success: true, data: events });

    } catch (error) {
        console.error('GET /events error:', error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
});

router.get('/:id', (req, res) => {
    try {
        const eventId = req.params.id;

        if (!eventId) {
            return res.status(400).json({ success: false, message: "Invalid ID" });
        }

        const event = db.prepare(`
            SELECT 
                e.id,
                e.clubName,
                e.category,
                e.field,
                e.eventDate,
                e.recruitmentCount,
                e.difficulty,
                e.title,
                e.status,
                e.CreatedAt,
                e.UpdatedAt,
                u.name as authorName,
                u.username as authorUsername
            FROM Event e
            LEFT JOIN users u ON e.authorId = u.id
            WHERE e.id = ?
        `).get(eventId);

        if (!event) {
            return res.status(404).json({ success: false, message: "Event not found" });
        }

        return res.json({ success: true, data: event });

    } catch (error) {
        console.error('GET /events/:id error:', error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
});

router.post('/', authenticateToken, (req, res) => {
    try {
        const {
            clubName,
            category,
            field,
            eventDate,
            recruitmentCount,
            difficulty,
            title,
            description
        } = req.body;

        const authenticatedUserId = req.userId;

        if (!title || !category || !difficulty) {
            return res.status(400).json({ 
                success: false, 
                message: "Required fields missing (title, category, difficulty)" 
            });
        }

        const validCategories = ['STUDY', 'CTF', 'PROJECT'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid category. Must be STUDY, CTF, or PROJECT" 
            });
        }

        const validDifficulties = ['LOW', 'MID', 'HIGH'];
        if (!validDifficulties.includes(difficulty)) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid difficulty. Must be LOW, MID, or HIGH" 
            });
        }

        const eventId = crypto.randomUUID();

        const insertQuery = db.prepare(`
            INSERT INTO Event (
                id, clubName, category, field, eventDate, 
                recruitmentCount, difficulty, title, description, authorId
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        let validClubName = null;
        if (clubName) {
            const club = db.prepare('SELECT clubName FROM Club WHERE clubName = ?').get(clubName);
            if (club) {
                validClubName = clubName;
            }
        }
        
        let validAuthorId = authenticatedUserId; 

        const info = insertQuery.run(
            eventId,
            validClubName,
            category,
            field || null,
            eventDate || null,
            recruitmentCount || null,
            difficulty,
            title,
            description || null,
            validAuthorId
        );

        const newEvent = db.prepare('SELECT * FROM Event WHERE id = ?').get(eventId);

        return res.status(201).json({ 
            success: true, 
            message: "Event created successfully",
            data: newEvent
        });

    } catch (error) {
        console.error('POST /events error:', error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
});

router.put('/:id', authenticateToken, (req, res) => {
    try {
        const eventId = req.params.id;
        const {
            clubName,
            category,
            field,
            eventDate,
            recruitmentCount,
            difficulty,
            title,
            description,
            authenticatedUserId 
        } = req.body;

        if (!eventId) {
            return res.status(400).json({ success: false, message: "Invalid ID" });
        }

        const existingEvent = db.prepare('SELECT * FROM Event WHERE id = ?').get(eventId);
        if (!existingEvent) {
            return res.status(404).json({ success: false, message: "Event not found" });
        }

        if (existingEvent.authorId !== authenticatedUserId) {
            return res.status(403).json({ 
                success: false, 
                message: "You can only edit your own posts" 
            });
        }

        if (category) {
            const validCategories = ['STUDY', 'CTF', 'PROJECT'];
            if (!validCategories.includes(category)) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Invalid category. Must be STUDY, CTF, or PROJECT" 
                });
            }
        }

        if (difficulty) {
            const validDifficulties = ['LOW', 'MID', 'HIGH'];
            if (!validDifficulties.includes(difficulty)) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Invalid difficulty. Must be LOW, MID, or HIGH" 
                });
            }
        }

        let validClubName = existingEvent.clubName;
        if (clubName !== undefined && clubName !== null) {
            if (clubName) {
                const club = db.prepare('SELECT clubName FROM Club WHERE clubName = ?').get(clubName);
                if (club) {
                    validClubName = clubName;
                } else {
                    validClubName = null; 
                }
            } else {
                validClubName = null;
            }
        }

        const updateQuery = db.prepare(`
            UPDATE Event 
            SET 
                clubName = COALESCE(?, clubName),
                category = COALESCE(?, category),
                field = COALESCE(?, field),
                eventDate = COALESCE(?, eventDate),
                recruitmentCount = COALESCE(?, recruitmentCount),
                difficulty = COALESCE(?, difficulty),
                title = COALESCE(?, title),
                description = COALESCE(?, description),
                UpdatedAt = datetime('now')
            WHERE id = ?
        `);

        updateQuery.run(
            validClubName,
            category || null,
            field || null,
            eventDate || null,
            recruitmentCount || null,
            difficulty || null,
            title || null,
            description || null,
            eventId
        );

        const updatedEvent = db.prepare('SELECT * FROM Event WHERE id = ?').get(eventId);

        return res.json({ 
            success: true, 
            message: "Event updated successfully",
            data: updatedEvent
        });

    } catch (error) {
        console.error('PUT /events/:id error:', error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
});

router.delete('/:id', authenticateToken, (req, res) => {
    try {
        const eventId = req.params.id;
        const authenticatedUserId = req.userId; 

        if (!eventId) {
            return res.status(400).json({ success: false, message: "Invalid ID" });
        }

        const existingEvent = db.prepare('SELECT * FROM Event WHERE id = ?').get(eventId);
        if (!existingEvent) {
            return res.status(404).json({ success: false, message: "Event not found" });
        }

        if (existingEvent.authorId !== authenticatedUserId) {
            return res.status(403).json({ 
                success: false, 
                message: "You can only delete your own posts" 
            });
        }

        const deleteQuery = db.prepare('DELETE FROM Event WHERE id = ?');
        deleteQuery.run(eventId);

        return res.json({ 
            success: true, 
            message: "Event deleted successfully"
        });

    } catch (error) {
        console.error('DELETE /events/:id error:', error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
});

router.patch('/:id/status', authenticateToken, (req, res) => {
    try {
        const eventId = req.params.id;
        const { status } = req.body;
        const authenticatedUserId = req.userId; 

        if (!eventId) {
            return res.status(400).json({ success: false, message: "Invalid ID" });
        }

        if (!status) {
            return res.status(400).json({ 
                success: false, 
                message: "status is required" 
            });
        }

        const validStatuses = ['RECRUITING', 'COMPLETED'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid status. Must be RECRUITING or COMPLETED" 
            });
        }

        const existingEvent = db.prepare('SELECT * FROM Event WHERE id = ?').get(eventId);
        if (!existingEvent) {
            return res.status(404).json({ success: false, message: "Event not found" });
        }

        if (existingEvent.authorId !== authenticatedUserId) {
            return res.status(403).json({ 
                success: false, 
                message: "You can only change the status of your own posts" 
            });
        }

        const updateQuery = db.prepare(`
            UPDATE Event 
            SET 
                status = ?,
                UpdatedAt = datetime('now')
            WHERE id = ?
        `);

        updateQuery.run(status, eventId);

        const updatedEvent = db.prepare('SELECT * FROM Event WHERE id = ?').get(eventId);

        return res.json({ 
            success: true, 
            message: "Status updated successfully",
            data: updatedEvent
        });

    } catch (error) {
        console.error('PATCH /events/:id/status error:', error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
});

module.exports = router;