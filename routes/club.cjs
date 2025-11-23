const express = require('express');
const router = express.Router();
const db = require('../db.cjs');

router.get('/', (req, res) => {
    try {
        const clubs = db.prepare(`
            SELECT id, schoolName, clubName, description, activities
            FROM Club
        `).all();

        // 각 동아리에 멤버 정보 추가
        const clubsWithMembers = clubs.map(club => {
            const members = db.prepare(`
                SELECT id, name, username
                FROM users
                WHERE clubName = ?
            `).all(club.clubName);

            // 멤버에 tags 추가 (첫 번째 사용자는 회장, 나머지는 부원)
            const membersWithTags = members.map((member, index) => ({
                name: member.name,
                username: member.username.startsWith('@') ? member.username : `@${member.username}`,
                tags: index === 0 ? ['회장'] : ['부원']
            }));

            return {
                ...club,
                members: membersWithTags,
                president: membersWithTags.length > 0 ? membersWithTags[0].name : null
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

        // 멤버 정보 조회
        const members = db.prepare(`
            SELECT id, name, username
            FROM users
            WHERE clubName = ?
        `).all(club.clubName);

        // 멤버에 tags 추가
        const membersWithTags = members.map((member, index) => ({
            name: member.name,
            username: member.username.startsWith('@') ? member.username : `@${member.username}`,
            tags: index === 0 ? ['회장'] : ['부원']
        }));

        // 이벤트 정보 조회
        const events = db.prepare(`
            SELECT id, title, category, field, eventDate, difficulty, recruitmentCount
            FROM Event
            WHERE clubName = ?
        `).all(club.clubName);

        return res.json({
            success: true,
            data: { 
                ...club, 
                members: membersWithTags,
                president: membersWithTags.length > 0 ? membersWithTags[0].name : null,
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
            FROM User
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

// POST /clubs - 동아리 등록
router.post('/', (req, res) => {
    try {
        const { clubName, description, schoolName } = req.body;

        // 필수 필드 검증
        if (!clubName || !schoolName) {
            return res.status(400).json({ 
                success: false, 
                message: "Required fields missing (clubName, schoolName)" 
            });
        }

        // 중복 동아리 확인
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

        // 생성된 동아리 조회
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

// PUT /clubs/:id - 동아리 정보 수정
router.put('/:id', (req, res) => {
    try {
        const clubId = req.params.id;
        const { description, activities } = req.body;

        if (!clubId) {
            return res.status(400).json({ success: false, message: "Invalid ID" });
        }

        // 기존 동아리 확인
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

        // 수정된 동아리 조회
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

module.exports = router;
