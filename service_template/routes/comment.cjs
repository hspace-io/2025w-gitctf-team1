const express = require('express');
const router = express.Router();
const db = require('../db.cjs');

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

router.post('/:postId', (req, res) => {
    try {
        const postId = req.params.postId;
        const { content, authorId } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ 
                success: false, 
                message: "content is required" 
            });
        }

        if (!authorId) {
            return res.status(400).json({ 
                success: false, 
                message: "authorId is required" 
            });
        }

        const event = db.prepare('SELECT id FROM Event WHERE id = ?').get(postId);
        if (!event) {
            return res.status(404).json({ 
                success: false, 
                message: "Event not found" 
            });
        }

        const user = db.prepare('SELECT id, name FROM users WHERE id = ?').get(authorId);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found" 
            });
        }

        const author = user.name || '익명';

        const insertQuery = db.prepare(`
            INSERT INTO Comment (postId, author, content, authorId)
            VALUES (?, ?, ?, ?)
        `);

        const info = insertQuery.run(postId, author, content.trim(), authorId);

        const newComment = db.prepare('SELECT * FROM Comment WHERE id = ?').get(info.lastInsertRowid);

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

router.put('/:id', (req, res) => {
    try {
        const commentId = req.params.id;
        const { content, authorId } = req.body;

        if (!commentId) {
            return res.status(400).json({ success: false, message: "Invalid ID" });
        }

        if (!content || !content.trim()) {
            return res.status(400).json({ 
                success: false, 
                message: "content is required" 
            });
        }

        if (!authorId) {
            return res.status(400).json({ 
                success: false, 
                message: "authorId is required" 
            });
        }

        const existingComment = db.prepare('SELECT * FROM Comment WHERE id = ?').get(commentId);
        if (!existingComment) {
            return res.status(404).json({ success: false, message: "Comment not found" });
        }

        if (existingComment.authorId !== authorId) {
            return res.status(403).json({ 
                success: false, 
                message: "You can only edit your own comments" 
            });
        }

        const updateQuery = db.prepare(`
            UPDATE Comment 
            SET 
                content = ?,
                updatedAt = datetime('now')
            WHERE id = ?
        `);

        updateQuery.run(content.trim(), commentId);

        const updatedComment = db.prepare('SELECT * FROM Comment WHERE id = ?').get(commentId);

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

router.delete('/:id', (req, res) => {
    try {
        const commentId = req.params.id;
        const authorId = req.query.authorId;

        if (!commentId) {
            return res.status(400).json({ success: false, message: "Invalid ID" });
        }

        if (!authorId) {
            return res.status(400).json({ 
                success: false, 
                message: "authorId is required" 
            });
        }

        const existingComment = db.prepare('SELECT * FROM Comment WHERE id = ?').get(commentId);
        if (!existingComment) {
            return res.status(404).json({ success: false, message: "Comment not found" });
        }

        if (existingComment.authorId !== authorId) {
            return res.status(403).json({ 
                success: false, 
                message: "You can only delete your own comments" 
            });
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