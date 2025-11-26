const express = require('express');
const router = express.Router();
const db = require('../db.cjs');

router.get('/', (req, res) => {
    try {
        const searchQuery = req.query.search;
        
        let clubs;
        if (searchQuery && searchQuery.trim()) {
            // 검색어가 있으면 동아리 이름, 설명, 학교명으로 검색
            const searchTerm = `%${searchQuery.trim()}%`;
            clubs = db.prepare(`
                SELECT id, schoolName, clubName, description, activities
                FROM Club
                WHERE clubName LIKE ? 
                   OR description LIKE ? 
                   OR schoolName LIKE ?
            `).all(searchTerm, searchTerm, searchTerm);
        } else {
            // 검색어가 없으면 전체 조회
            clubs = db.prepare(`
                SELECT id, schoolName, clubName, description, activities
                FROM Club
            `).all();
        }

        // 각 동아리에 멤버 정보 추가
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

            // 멤버에 tags 추가 (DB에 저장된 tags 사용, 없으면 첫 번째는 회장, 나머지는 부원)
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
                    id: member.id, // ★ 추가
                    name: member.name,
                    alias: member.alias || member.username || null,  // alias가 없으면 username 사용
                    username: member.username.startsWith('@') ? member.username : `@${member.username}`,
                    tags: tags
                };
            });

            // 회장 찾기 (tags에 '회장'이 포함된 첫 번째 멤버)
            const presidentMember = membersWithTags.find(m => m.tags.includes('회장'));
            const presidentInfo = presidentMember 
                ? `${presidentMember.name} (${presidentMember.alias})` 
                : null;

            return {
                ...club,
                name: club.clubName,  // 프론트엔드 호환성을 위해 name 필드 추가
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

        // 멤버 정보 조회
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

        // 멤버에 tags 추가 (DB에 저장된 tags 사용, 없으면 첫 번째는 회장, 나머지는 부원)
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
                alias: member.alias || member.username || null,  // alias가 없으면 username 사용
                username: member.username.startsWith('@') ? member.username : `@${member.username}`,
                tags: tags
            };

        });

        // 회장 찾기 (tags에 '회장'이 포함된 첫 번째 멤버)
        const presidentMember = membersWithTags.find(m => m.tags.includes('회장'));
        const presidentInfo = presidentMember 
            ? `${presidentMember.name} (${presidentMember.alias})` 
            : null;

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
                name: club.clubName,  // 프론트엔드 호환성을 위해 name 필드 추가
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
                activities = COALESCE(?, activities),
            WHERE id = ?

            UPDATE users
            SET 
                clubName = ? //이름 수정으로 변경
            WHERE clubName = ?
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

// DELETE /clubs/:id - 동아리 삭제
router.delete('/:id', (req, res) => {
    try {
        const clubId = req.params.id;

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

        // 동아리에 속한 멤버들의 clubName을 null로 설정
        db.prepare('UPDATE users SET clubName = NULL WHERE clubName = ?').run(existingClub.clubName);

        // 동아리 삭제
        db.prepare('DELETE FROM Club WHERE id = ?').run(clubId);

        return res.json({ 
            success: true, 
            message: "Club deleted successfully"
        });

    } catch (error) {
        console.error('DELETE /clubs/:id error:', error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
});

// PUT /clubs/:clubId/members/:userId - 멤버 정보 수정
router.put('/:clubId/members/:userId', (req, res) => {
    try {
        const { clubId, userId } = req.params;
        const { name, username, alias, tags } = req.body;  // tags = ["회장", "운영진"] 등 배열

        // 1. 클럽 존재 확인
        const club = db.prepare(`SELECT clubName FROM Club WHERE id = ?`).get(clubId);
        if (!club) {
            return res.status(404).json({ success: false, message: "Club not found" });
        }

        // 2. 멤버 존재 + 해당 클럽 소속인지 확인
        const user = db.prepare(`
            SELECT * FROM users 
            WHERE id = ? AND clubName = ?
        `).get(userId, club.clubName);

        if (!user) {
            return res.status(404).json({ success: false, message: "Member not found in this club" });
        }

        // 3. username 중복 확인 (다른 사용자가 이미 사용 중인지)
        if (username && username !== user.username) {
            const existingUser = db.prepare('SELECT * FROM users WHERE username = ? AND id != ?').get(username, userId);
            if (existingUser) {
                return res.status(400).json({ 
                    success: false, 
                    message: "이미 사용 중인 아이디입니다." 
                });
            }
        }

        // 4. tags 처리 (DB는 문자열 저장이므로 JSON으로 변환)
        let tagsJson = null;
        if (Array.isArray(tags)) {
            tagsJson = JSON.stringify(tags);
        }

        // 5. 업데이트
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
