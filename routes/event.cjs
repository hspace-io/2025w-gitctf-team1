const express = require('express');
const crypto = require('crypto');

const router = express.Router();
const db = require('../db.cjs');

// GET /events - 모집글 목록 조회
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
                e.description,
                e.authorId,
                e.CreatedAt,
                e.UpdatedAt,
                u.name as authorName
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

// GET /events/:id - 모집글 상세 조회
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
                e.description,
                e.authorId,
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

// POST /events - 모집글 작성
router.post('/', (req, res) => {
    try {
        const {
            clubName,
            category,
            field,
            eventDate,
            recruitmentCount,
            difficulty,
            title,
            description,
            authorId
        } = req.body;

        // 필수 필드 검증
        if (!title || !category || !difficulty) {
            return res.status(400).json({ 
                success: false, 
                message: "Required fields missing (title, category, difficulty)" 
            });
        }

        // category 검증
        const validCategories = ['STUDY', 'CTF', 'PROJECT'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid category. Must be STUDY, CTF, or PROJECT" 
            });
        }

        // difficulty 검증
        const validDifficulties = ['LOW', 'MID', 'HIGH'];
        if (!validDifficulties.includes(difficulty)) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid difficulty. Must be LOW, MID, or HIGH" 
            });
        }

        // UUID 생성
        const eventId = crypto.randomUUID();

        const insertQuery = db.prepare(`
            INSERT INTO Event (
                id, clubName, category, field, eventDate, 
                recruitmentCount, difficulty, title, description, authorId
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const info = insertQuery.run(
            eventId,
            clubName || null,
            category,
            field || null,
            eventDate || null,
            recruitmentCount || null,
            difficulty,
            title,
            description || null,
            authorId || null
        );

        // 생성된 이벤트 조회
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

// PUT /events/:id - 모집글 수정
router.put('/:id', (req, res) => {
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
            description
        } = req.body;

        if (!eventId) {
            return res.status(400).json({ success: false, message: "Invalid ID" });
        }

        // 기존 이벤트 확인
        const existingEvent = db.prepare('SELECT * FROM Event WHERE id = ?').get(eventId);
        if (!existingEvent) {
            return res.status(404).json({ success: false, message: "Event not found" });
        }

        // category 검증 (제공된 경우)
        if (category) {
            const validCategories = ['STUDY', 'CTF', 'PROJECT'];
            if (!validCategories.includes(category)) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Invalid category. Must be STUDY, CTF, or PROJECT" 
                });
            }
        }

        // difficulty 검증 (제공된 경우)
        if (difficulty) {
            const validDifficulties = ['LOW', 'MID', 'HIGH'];
            if (!validDifficulties.includes(difficulty)) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Invalid difficulty. Must be LOW, MID, or HIGH" 
                });
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
            clubName || null,
            category || null,
            field || null,
            eventDate || null,
            recruitmentCount || null,
            difficulty || null,
            title || null,
            description || null,
            eventId
        );

        // 수정된 이벤트 조회
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

// DELETE /events/:id - 모집글 삭제
router.delete('/:id', (req, res) => {
    try {
        const eventId = req.params.id;

        if (!eventId) {
            return res.status(400).json({ success: false, message: "Invalid ID" });
        }

        // 기존 이벤트 확인
        const existingEvent = db.prepare('SELECT * FROM Event WHERE id = ?').get(eventId);
        if (!existingEvent) {
            return res.status(404).json({ success: false, message: "Event not found" });
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

module.exports = router;
