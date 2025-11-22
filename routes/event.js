const express = require('express');
const crypto = require('crypto');

const router = express.Router();

const VALID_CATEGORIES = ['STUDY', 'CTF', 'PROJECT'];
const VALID_DIFFICULTIES = ['LOW', 'MID', 'HIGH'];

const SQL_BAN_LIST = [
    'update', 'extract', 'lpad', 'rpad', 'insert', 'values', '~', ':', '+',
    'union', 'end', 'schema', 'table', 'drop', 'delete', 'sleep', 'substring',
    'database', 'declare', 'count', 'exists', 'collate', 'like', '!', '"',
    '$', '%', '&', '+', '.', ':', '<', '>', 'delay', 'wait', 'order', 'alter'
];

const containsBannedSql = (input) => {
    if (!input) return false;
    const lowerInput = input.toLowerCase();
    
    return SQL_BAN_LIST.some(banned => {
        if (banned.length === 1) {
            return lowerInput.includes(banned);
        } else {
            return lowerInput.includes(banned);
        }
    });
};

const db = require('./db.js'); 

router.use((req, res, next) => {
    if (!db) {
        return res.status(503).json({ error: "Server is not connected to the database." });
    }
    next();
});

router.post('/', (req, res) => {
    const { 
        clubName, category, field, eventDate, 
        recruitmentCount, difficulty, title, description 
    } = req.body;

    if (!title || !category || !clubName) {
        return res.status(400).json({ error: "Required fields (title, category, clubName) must be provided." });
    }

    if (!VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({ 
            error: `Invalid category value. Must be one of: ${VALID_CATEGORIES.join(', ')}`
        });
    }
    
    if (difficulty && !VALID_DIFFICULTIES.includes(difficulty)) {
         return res.status(400).json({ 
            error: `Invalid difficulty value. Must be one of: ${VALID_DIFFICULTIES.join(', ')}`
        });
    }

    try {
        const eventId = crypto.randomUUID(); 
        const now = new Date().toISOString();

        const sql = `
            INSERT INTO Event (
                id, clubName, category, field, eventDate, 
                recruitmentCount, difficulty, title, description, CreatedAt, UpdatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const stmt = db.prepare(sql);
        stmt.run(
            eventId, 
            clubName, 
            category, 
            field || null, 
            eventDate || null, 
            recruitmentCount || null, 
            difficulty || null, 
            title, 
            description || null,
            now, 
            now
        );

        const newPost = db.prepare("SELECT * FROM Event WHERE id = ?").get(eventId);

        return res.status(201).json({
            message: "New event registered successfully.",
            event: newPost
        });

    } catch (error) {
        console.error("ERROR: Database error during event registration:", error);
        return res.status(500).json({ error: "Database error occurred during registration." });
    }
});

router.get('/', (req, res) => { 
    const { category, keyword, field, difficulty, eventDate } = req.query;

    if (keyword) {
        if (containsBannedSql(keyword)) {
            console.warn(`SECURITY: Blocked keyword containing banned SQL term: ${keyword}`);
            return res.status(400).json({ 
                error: "Search keyword contains banned SQL characters or terms." 
            });
        }
    }

    let queryParts = ["SELECT * FROM Event WHERE 1=1"];
    let queryParams = [];

    if (category) {
        const upperCategory = category.toUpperCase();
        if (VALID_CATEGORIES.includes(upperCategory)) {
            queryParts.push("AND category = ?");
            queryParams.push(upperCategory);
        } else {
            return res.status(400).json({ 
                error: `Invalid category filter. Must be one of: ${VALID_CATEGORIES.join(', ')}` 
            });
        }
    }
    
    if (field) {
        queryParts.push("AND field LIKE ?");
        queryParams.push(`%${field}%`);
    }
    
    if (difficulty) {
        const upperDifficulty = difficulty.toUpperCase();
         if (VALID_DIFFICULTIES.includes(upperDifficulty)) {
            queryParts.push("AND difficulty = ?");
            queryParams.push(upperDifficulty);
        } else {
            return res.status(400).json({ 
                error: `Invalid difficulty filter. Must be one of: ${VALID_DIFFICULTIES.join(', ')}` 
            });
        }
    }

    if (eventDate) {
        queryParts.push("AND eventDate LIKE ?");
        queryParams.push(`%${eventDate}%`);
    }


    if (keyword) {
        const searchTerm = `%${keyword.toLowerCase()}%`;
        
        queryParts.push(
            "AND (LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(clubName) LIKE ? OR LOWER(field) LIKE ?)"
        );
        queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    queryParts.push("ORDER BY CreatedAt DESC");

    const query = queryParts.join(" ");

    try {
        const posts = db.prepare(query).all(queryParams);
        
        return res.status(200).json({
            count: posts.length,
            events: posts
        });

    } catch (error) {
        console.error("ERROR: Database error during event retrieval:", error);
        return res.status(500).json({ error: "Database error occurred during retrieval." });
    }
});

router.get('/:id', (req, res) => {
    const { id } = req.params;

    try {
        const post = db.prepare("SELECT * FROM Event WHERE id = ?").get(id);

        if (!post) {
            return res.status(404).json({ error: "Event with the specified ID not found." });
        }

        return res.status(200).json({ event: post });
    } catch (error) {
        console.error("ERROR: Database error during event detail retrieval:", error);
        return res.status(500).json({ error: "Database error occurred during detail retrieval." });
    }
});

router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { 
        clubName, category, field, eventDate, 
        recruitmentCount, difficulty, title, description 
    } = req.body;
    
    if (!title || !category || !clubName) {
        return res.status(400).json({ error: "Required fields (title, category, clubName) must be provided." });
    }

    if (!VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({ 
            error: `Invalid category value. Must be one of: ${VALID_CATEGORIES.join(', ')}`
        });
    }
    
    if (difficulty && !VALID_DIFFICULTIES.includes(difficulty)) {
         return res.status(400).json({ 
            error: `Invalid difficulty value. Must be one of: ${VALID_DIFFICULTIES.join(', ')}`
        });
    }

    try {
        const existingPost = db.prepare("SELECT id FROM Event WHERE id = ?").get(id);
        if (!existingPost) {
            return res.status(404).json({ error: "Event with the specified ID not found for update." });
        }

        const now = new Date().toISOString();
        
        const sql = `
            UPDATE Event SET 
                clubName = ?, category = ?, field = ?, eventDate = ?, 
                recruitmentCount = ?, difficulty = ?, title = ?, 
                description = ?, UpdatedAt = ?
            WHERE id = ?
        `;
        
        const stmt = db.prepare(sql);
        stmt.run(
            clubName, 
            category, 
            field || null, 
            eventDate || null, 
            recruitmentCount || null, 
            difficulty || null, 
            title, 
            description || null,
            now, 
            id
        );

        const updatedPost = db.prepare("SELECT * FROM Event WHERE id = ?").get(id);

        return res.status(200).json({
            message: "Event updated successfully.",
            event: updatedPost
        });

    } catch (error) {
        console.error("ERROR: Database error during event update:", error);
        return res.status(500).json({ error: "Database error occurred during update." });
    }
});


router.delete('/:id', (req, res) => {
    const { id } = req.params;

    try {
        const stmt = db.prepare("DELETE FROM Event WHERE id = ?");
        const result = stmt.run(id);

        if (result.changes === 0) {
             return res.status(404).json({ error: "Event with the specified ID not found for deletion." });
        }

        return res.status(200).json({
            message: "Event deleted successfully.",
            id: id
        });
    } catch (error) {
        console.error("ERROR: Database error during event deletion:", error);
        return res.status(500).json({ error: "Database error occurred during deletion." });
    }
});


module.exports = router;