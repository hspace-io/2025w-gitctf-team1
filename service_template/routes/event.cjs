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

// POST /events - 모집글 작성
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

        // clubName이 유효한지 확인 (Club 테이블에 존재하는지)
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
        } = req.body;

        const authenticatedUserId = req.userId;

        if (!eventId) {
            return res.status(400).json({ success: false, message: "Invalid ID" });
        }

        // 기존 이벤트 확인
        const existingEvent = db.prepare('SELECT * FROM Event WHERE id = ?').get(eventId);
        if (!existingEvent) {
            return res.status(404).json({ success: false, message: "Event not found" });
        }

        // 권한 확인: 작성자만 수정 가능
        if (existingEvent.authorId !== authenticatedUserId) {
            return res.status(403).json({ 
                success: false, 
                message: "You can only edit your own posts" 
            });
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

        // clubName이 유효한지 확인 (Club 테이블에 존재하는지)
        let validClubName = existingEvent.clubName;  // 기존 값 유지
        if (clubName !== undefined && clubName !== null) {
            if (clubName) {
                const club = db.prepare('SELECT clubName FROM Club WHERE clubName = ?').get(clubName);
                if (club) {
                    validClubName = clubName;
                } else {
                    validClubName = null;  // 유효하지 않으면 null
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
router.delete('/:id',  authenticateToken, (req, res) => {
    try {
        const eventId = req.params.id;
        const authenticatedUserId = req.userId; 

        if (!eventId) {
            return res.status(400).json({ success: false, message: "Invalid ID" });
        }

        // 기존 이벤트 확인
        const existingEvent = db.prepare('SELECT * FROM Event WHERE id = ?').get(eventId);
        if (!existingEvent) {
            return res.status(404).json({ success: false, message: "Event not found" });
        }

        // 권한 확인: 작성자만 삭제 가능
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

// PATCH /events/:id/status - 모집 상태 변경 (작성자만 가능)
router.patch('/:id/status', authenticateToken, (req, res) => {
    try {
        const eventId = req.params.id;
        const { status} = req.body;
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

        // 유효한 상태 값 확인
        const validStatuses = ['RECRUITING', 'COMPLETED'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid status. Must be RECRUITING or COMPLETED" 
            });
        }

        // 기존 이벤트 확인
        const existingEvent = db.prepare('SELECT * FROM Event WHERE id = ?').get(eventId);
        if (!existingEvent) {
            return res.status(404).json({ success: false, message: "Event not found" });
        }

        // 권한 확인: 작성자만 상태 변경 가능
        if (existingEvent.authorId !== authenticatedUserId) {
            return res.status(403).json({ 
                success: false, 
                message: "You can only change the status of your own posts" 
            });
        }

        // 상태 업데이트
        const updateQuery = db.prepare(`
            UPDATE Event 
            SET 
                status = ?,
                UpdatedAt = datetime('now')
            WHERE id = ?
        `);

        updateQuery.run(status, eventId);

        // 업데이트된 이벤트 조회
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
