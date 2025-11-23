const express = require('express');
const router = express.Router();
const db = require('../db.cjs');

// GET /comments?postId=:postId - 댓글 목록 조회
router.get('/', (req, res) => {
    try {
        const postId = req.query.postId;

        if (!postId) {
            return res.status(400).json({ 
                success: false, 
                message: "postId is required" 
            });
        }

        const comments = db.prepare(`
            SELECT 
                c.id,
                c.postId,
                c.author,
                c.content,
                c.authorId,
                c.createdAt,
                c.updatedAt,
                u.name as authorName
            FROM Comment c
            LEFT JOIN users u ON c.authorId = u.id
            WHERE c.postId = ?
            ORDER BY c.createdAt ASC
        `).all(postId);

        // 날짜 포맷팅
        const formattedComments = comments.map(comment => ({
            ...comment,
            date: new Date(comment.createdAt).toLocaleString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }).replace(/\. /g, '.').replace('.', '. ')
        }));

        return res.json({ success: true, data: formattedComments });

    } catch (error) {
        console.error('GET /comments error:', error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
});

// POST /comments/:postId - 댓글 작성
router.post('/:postId', (req, res) => {
    try {
        const postId = req.params.postId;
        const { author, content, authorId } = req.body;

        // 필수 필드 검증
        if (!author || !content) {
            return res.status(400).json({ 
                success: false, 
                message: "author and content are required" 
            });
        }

        // postId가 유효한지 확인
        const event = db.prepare('SELECT id FROM Event WHERE id = ?').get(postId);
        if (!event) {
            return res.status(404).json({ 
                success: false, 
                message: "Event not found" 
            });
        }

        // authorId가 유효한지 확인
        let validAuthorId = null;
        if (authorId) {
            const authorIdInt = parseInt(authorId);
            if (!isNaN(authorIdInt)) {
                const user = db.prepare('SELECT id FROM users WHERE id = ?').get(authorIdInt);
                if (user) {
                    validAuthorId = authorIdInt;
                }
            }
        }

        const insertQuery = db.prepare(`
            INSERT INTO Comment (postId, author, content, authorId)
            VALUES (?, ?, ?, ?)
        `);

        const info = insertQuery.run(postId, author, content, validAuthorId);

        // 생성된 댓글 조회
        const newComment = db.prepare('SELECT * FROM Comment WHERE id = ?').get(info.lastInsertRowid);

        // 날짜 포맷팅
        const formattedComment = {
            ...newComment,
            date: new Date(newComment.createdAt).toLocaleString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }).replace(/\. /g, '.').replace('.', '. ')
        };

        return res.status(201).json({ 
            success: true, 
            message: "Comment created successfully",
            data: formattedComment
        });

    } catch (error) {
        console.error('POST /comments/:postId error:', error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
});

// PUT /comments/:id - 댓글 수정
router.put('/:id', (req, res) => {
    try {
        const commentId = req.params.id;
        const { content } = req.body;

        if (!commentId) {
            return res.status(400).json({ success: false, message: "Invalid ID" });
        }

        if (!content || !content.trim()) {
            return res.status(400).json({ 
                success: false, 
                message: "content is required" 
            });
        }

        // 기존 댓글 확인
        const existingComment = db.prepare('SELECT * FROM Comment WHERE id = ?').get(commentId);
        if (!existingComment) {
            return res.status(404).json({ success: false, message: "Comment not found" });
        }

        const updateQuery = db.prepare(`
            UPDATE Comment 
            SET 
                content = ?,
                updatedAt = datetime('now')
            WHERE id = ?
        `);

        updateQuery.run(content.trim(), commentId);

        // 수정된 댓글 조회
        const updatedComment = db.prepare('SELECT * FROM Comment WHERE id = ?').get(commentId);

        // 날짜 포맷팅
        const formattedComment = {
            ...updatedComment,
            date: new Date(updatedComment.createdAt).toLocaleString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }).replace(/\. /g, '.').replace('.', '. ')
        };

        return res.json({ 
            success: true, 
            message: "Comment updated successfully",
            data: formattedComment
        });

    } catch (error) {
        console.error('PUT /comments/:id error:', error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
});

// DELETE /comments/:id - 댓글 삭제
router.delete('/:id', (req, res) => {
    try {
        const commentId = req.params.id;

        if (!commentId) {
            return res.status(400).json({ success: false, message: "Invalid ID" });
        }

        // 기존 댓글 확인
        const existingComment = db.prepare('SELECT * FROM Comment WHERE id = ?').get(commentId);
        if (!existingComment) {
            return res.status(404).json({ success: false, message: "Comment not found" });
        }

        const deleteQuery = db.prepare('DELETE FROM Comment WHERE id = ?');
        deleteQuery.run(commentId);

        return res.json({ 
            success: true, 
            message: "Comment deleted successfully"
        });

    } catch (error) {
        console.error('DELETE /comments/:id error:', error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
});

module.exports = router;

