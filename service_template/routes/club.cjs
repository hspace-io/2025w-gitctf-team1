const express = require('express');
const router = express.Router();
const db = require('../db.cjs');

router.get('/', (req, res) => {
    try {
        const searchQuery = req.query.search;
        
        let clubs;
        if (searchQuery && searchQuery.trim()) {
            const searchTerm = `%${searchQuery.trim()}%`;
            clubs = db.prepare(`
                SELECT id, schoolName, clubName, description, activities
                FROM Club
                WHERE clubName LIKE ? 
                   OR description LIKE ? 
                   OR schoolName LIKE ?
            `).all(searchTerm, searchTerm, searchTerm);
        } else {
            clubs = db.prepare(`
                SELECT id, schoolName, clubName, description, activities
                FROM Club
            `).all();
        }

        const clubsWithMembers = clubs.map(club => {
            const members = db.prepare(`
                SELECT id, name, alias, username, tags
                FROM users
                WHERE clubName = ?
                ORDER BY 
                    CASE 
                        WHEN tags LIKE '%회장%' THEN 1
                        WHEN tags LIKE '%운영진%' THEN 2
                        ELSE 3
                    END,
                    id
            `).all(club.clubName);

            const membersWithTags = members.map((member, index) => {
                let tags = ['부원'];
                if (member.tags) {
                    try {
                        tags = JSON.parse(member.tags);
                    } catch (e) {
                        tags = index === 0 ? ['회장'] : ['부원'];
                    }
                } else {
                    tags = index === 0 ? ['회장'] : ['부원'];
                }
                return {
                    id: member.id,
                    name: member.name,
                    alias: member.alias || null,
                    username: member.username.startsWith('@') ? member.username : `@${member.username}`,
                    tags: tags
                };
            });

            const presidentMember = membersWithTags.find(m => m.tags.includes('회장'));
            const presidentInfo = presidentMember 
                ? `${presidentMember.name} (${presidentMember.alias})` 
                : null;

            return {
                ...club,
                name: club.clubName,
                members: membersWithTags,
                president: presidentInfo
            };
        });

        return res.json({ success: true, data: clubsWithMembers });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
});

router.get('/:id', (req, res) => {
    try {
        const clubId = req.params.id;

        if (!clubId) {
            return res.status(400).json({ success: false, message: "Invalid ID" });
        }

        const club = db.prepare(`
            SELECT id, schoolName, clubName, description, activities
            FROM Club
            WHERE id = ?
        `).get(clubId);

        if (!club) {
            return res.status(404).json({ success: false, message: "Club not found" });
        }

        const members = db.prepare(`
            SELECT id, name, alias, username, tags
            FROM users
            WHERE clubName = ?
            ORDER BY 
                CASE 
                    WHEN tags LIKE '%회장%' THEN 1
                    WHEN tags LIKE '%운영진%' THEN 2
                    ELSE 3
                END,
                id
        `).all(club.clubName);

        const membersWithTags = members.map((member, index) => {
            let tags = ['부원'];
            if (member.tags) {
                try {
                    tags = JSON.parse(member.tags);
                } catch (e) {
                    tags = index === 0 ? ['회장'] : ['부원'];
                }
            } else {
                tags = index === 0 ? ['회장'] : ['부원'];
            }
            return {
                id: member.id, 
                name: member.name,
                alias: member.alias || null,
                username: member.username.startsWith('@') ? member.username : `@${member.username}`,
                tags: tags
            };

        });

        const presidentMember = membersWithTags.find(m => m.tags.includes('회장'));
        const presidentInfo = presidentMember 
            ? `${presidentMember.name} (${presidentMember.alias})` 
            : null;

        const events = db.prepare(`
            SELECT id, title, category, field, eventDate, difficulty, recruitmentCount
            FROM Event
            WHERE clubName = ?
        `).all(club.clubName);

        return res.json({
            success: true,
            data: { 
                ...club,
                name: club.clubName,
                members: membersWithTags,
                president: presidentInfo,
                events 
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
});

router.get('/:id/members', (req, res) => {
    try {
        const clubId = req.params.id;

        const club = db.prepare(`
            SELECT clubName
            FROM Club
            WHERE id = ?
        `).get(clubId);

        if (!club) {
            return res.status(404).json({ success: false, message: "Club not found" });
        }

        const members = db.prepare(`
            SELECT id, name, username, isClubStaff
            FROM users
            WHERE clubName = ?
        `).all(club.clubName);

        return res.json({
            success: true,
            data: members
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
});

router.post('/', (req, res) => {
    try {
        const { clubName, description, schoolName } = req.body;

        if (!clubName || !schoolName) {
            return res.status(400).json({ 
                success: false, 
                message: "Required fields missing (clubName, schoolName)" 
            });
        }

        const existingClub = db.prepare('SELECT * FROM Club WHERE clubName = ?').get(clubName);
        if (existingClub) {
            return res.status(400).json({ 
                success: false, 
                message: "Club with this name already exists" 
            });
        }

        const insertQuery = db.prepare(`
            INSERT INTO Club (clubName, description, schoolName)
            VALUES (?, ?, ?)
        `);

        insertQuery.run(clubName, description || null, schoolName);

        const newClub = db.prepare('SELECT * FROM Club WHERE clubName = ?').get(clubName);

        return res.status(201).json({ 
            success: true, 
            message: "Club created successfully",
            data: newClub
        });

    } catch (error) {
        console.error('POST /clubs error:', error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
});

router.put('/:id', (req, res) => {
    try {
        const clubId = req.params.id;
        const { description, activities } = req.body;

        if (!clubId) {
            return res.status(400).json({ success: false, message: "Invalid ID" });
        }

        const existingClub = db.prepare(`
            SELECT * FROM Club WHERE id = ?
        `).get(clubId);

        if (!existingClub) {
            return res.status(404).json({ success: false, message: "Club not found" });
        }

        const updateQuery = db.prepare(`
            UPDATE Club 
            SET 
                description = COALESCE(?, description),
                activities = COALESCE(?, activities)
            WHERE id = ?
        `);

        updateQuery.run(description || null, activities || null, clubId);

        const updatedClub = db.prepare('SELECT * FROM Club WHERE id = ?').get(clubId);

        return res.json({ 
            success: true, 
            message: "Club updated successfully",
            data: updatedClub
        });

    } catch (error) {
        console.error('PUT /clubs/:id error:', error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
});

router.put('/:clubId/members/:userId', (req, res) => {
    try {
        const { clubId, userId } = req.params;
        const { name, username, alias, tags } = req.body;

        const club = db.prepare(`SELECT clubName FROM Club WHERE id = ?`).get(clubId);
        if (!club) {
            return res.status(404).json({ success: false, message: "Club not found" });
        }

        const user = db.prepare(`
            SELECT * FROM users 
            WHERE id = ? AND clubName = ?
        `).get(userId, club.clubName);

        if (!user) {
            return res.status(404).json({ success: false, message: "Member not found in this club" });
        }

        if (username && username !== user.username) {
            const existingUser = db.prepare('SELECT * FROM users WHERE username = ? AND id != ?').get(username, userId);
            if (existingUser) {
                return res.status(400).json({ 
                    success: false, 
                    message: "이미 사용 중인 아이디입니다." 
                });
            }
        }

        let tagsJson = null;
        if (Array.isArray(tags)) {
            tagsJson = JSON.stringify(tags);
        }

        db.prepare(`
            UPDATE users
            SET 
                name = COALESCE(?, name),
                username = COALESCE(?, username),
                alias = COALESCE(?, alias),
                tags = COALESCE(?, tags),
                updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(name || null, username || null, alias || null, tagsJson, userId);

        return res.json({
            success: true,
            message: "Member updated successfully"
        });

    } catch (error) {
        console.error("PUT /clubs/:clubId/members/:userId error:", error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
});


module.exports = router;