const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// DB 연결
const db = require('./db.cjs'); 

// 라우터 불러오기
const authRouter = require('./routes/auth.cjs'); 
const eventRouter = require('./routes/event.cjs'); 
const clubRouter = require('./routes/club.cjs');
const commentRouter = require('./routes/comment.cjs');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// 프로덕션 환경에서 정적 파일 제공 (빌드된 React 앱)
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
}

// DB 초기화 및 테이블 생성
if (db) {
    try {
        // 기존 users 테이블이 INTEGER id를 사용하는 경우를 위해 DROP 후 재생성
        try {
            db.prepare('DROP TABLE IF EXISTS users').run();
        } catch (err) {
            // 테이블이 없으면 무시
        }
        
        // 1. Users 테이블 생성 (새 스키마에 맞게 수정)
        db.prepare(`
            CREATE TABLE users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                name TEXT NOT NULL,
                alias TEXT,
                schoolName TEXT,
                clubName TEXT,
                isAdmin INTEGER DEFAULT 0,
                isClubStaff INTEGER DEFAULT 0,
                tags TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `).run();
        console.log("Users table initialized");

        // 2. Club 테이블 생성 (팀원 코드)
        db.exec(`
            CREATE TABLE IF NOT EXISTS Club (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                clubName TEXT UNIQUE NOT NULL,
                description TEXT,
                schoolName TEXT NOT NULL,
                activities TEXT
            );
        `);

        // 기본 동아리 데이터 추가 (INITIAL_CLUBS 형식)
        const initialClubs = [
            {
                name: 'Pay1oad',
                schoolName: '가천대학교',
                description: '보안 및 해킹 기술을 연구하는 동아리입니다.',
                president: '김보안',
                members: [
                    { name: '김보안', username: 'security_kim', tags: ["회장", "운영진"]},
                    { name: '이해킹', username: 'hacker_lee', tags: ['운영진']},
                    { name: '박디버깅', username: 'debug_park', tags: ['부원']},
                    { name: '최게임', username: 'gamer_choi', tags: ['부원']},
                    { name: '정리버스', username: 'reverse_jung', tags: ['부원']},
                ],
            },
            {
                name: 'I want to sleep',
                schoolName: '잠 부족',
                description: '잠 자고 싶어요',
                president: '홍웹',
                members: [
                    { name: '홍웹', username: 'web_hong', tags: ['회장'] },
                    { name: '강프론트', username: 'frontend_kang', tags: ['운영진'] },
                    { name: '윤백엔드', username: 'backend_yoon', tags: ['부원'] },
                    { name: '임풀스택', username: 'fullstack_lim', tags: ['부원'] },
                    { name: '한디자인', username: 'design_han', tags: ['부원'] },
                ],
            },
            {
                name: 'I want to go home',
                schoolName: '퇴근 요정',
                description: '집에 가고 싶어요',
                president: '송AI',
                members: [
                    { name: '송AI', username: 'ai_song', tags: ['회장'] },
                    { name: '조머신러닝', username: 'ml_cho', tags: ['부원'] },
                ],
            },
        ];

        // INITIAL_CLUBS 데이터를 데이터베이스에 추가
        for (const club of initialClubs) {
            const existingClub = db.prepare('SELECT clubName FROM Club WHERE clubName = ?').get(club.name);
            if (!existingClub) {
                // 동아리 추가
                db.prepare('INSERT INTO Club (clubName, description, schoolName) VALUES (?, ?, ?)').run(
                    club.name,
                    club.description,
                    club.schoolName
                );
                console.log(`Club "${club.name}" added to database`);

                // 동아리 멤버 추가 (비밀번호는 기본값 "password123"로 설정)
                const defaultPassword = bcrypt.hashSync('password123', 10);
                for (const member of club.members) {
                    // 사용자가 이미 존재하는지 확인
                    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(member.username);
                    const tagsJson = JSON.stringify(member.tags || ['부원']);
                    const isClubStaff = member.tags && (member.tags.includes('회장') || member.tags.includes('운영진')) ? 1 : 0;
                    // 아이디, 이름, 닉네임이 같아야 함
                    const alias = member.alias || member.username || member.name;
                    
                    if (!existingUser) {
                        const userId = crypto.randomUUID();
                        db.prepare(`
                            INSERT INTO users (id, username, password, name, alias, schoolName, clubName, isAdmin, isClubStaff, tags)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `).run(
                            userId,
                            member.username,
                            defaultPassword,
                            member.name,
                            alias,
                            club.schoolName,
                            club.name,
                            0,
                            isClubStaff,
                            tagsJson
                        );
                        console.log(`  - Member "${member.name}" (${member.username}, alias: ${alias}) added with tags: ${tagsJson}`);
                    } else {
                        // 기존 사용자의 clubName, tags, isClubStaff, alias 업데이트
                        db.prepare('UPDATE users SET clubName = ?, tags = ?, isClubStaff = ?, alias = ? WHERE username = ?').run(
                            club.name,
                            tagsJson,
                            isClubStaff,
                            alias,
                            member.username
                        );
                        console.log(`  - Member "${member.name}" (${member.username}, alias: ${alias}) updated with tags: ${tagsJson}`);
                    }
                }
            }
        }

        // 3. Event 테이블 생성 (팀원 코드 - Users와 Club 테이블을 참조함)
        db.exec(`
            CREATE TABLE IF NOT EXISTS Event (
                id TEXT PRIMARY KEY,
                clubName TEXT,
                category TEXT CHECK(category IN ('STUDY', 'CTF', 'PROJECT')),
                field TEXT,
                eventDate TEXT,
                recruitmentCount INTEGER,
                difficulty TEXT CHECK(difficulty IN ('LOW', 'MID', 'HIGH')),
                title TEXT NOT NULL,
                description TEXT,
                authorId INTEGER, 
                CreatedAt TEXT DEFAULT (datetime('now')),
                UpdatedAt TEXT DEFAULT (datetime('now')),
                FOREIGN KEY(clubName) REFERENCES Club(clubName),
                FOREIGN KEY(authorId) REFERENCES users(id) 
            )
        `);
        console.log("Club & Event tables initialized");

        // 4. Comment 테이블 생성
        db.exec(`
            CREATE TABLE IF NOT EXISTS Comment (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                postId TEXT NOT NULL,
                author TEXT NOT NULL,
                content TEXT NOT NULL,
                authorId INTEGER,
                createdAt TEXT DEFAULT (datetime('now')),
                updatedAt TEXT DEFAULT (datetime('now')),
                FOREIGN KEY(postId) REFERENCES Event(id) ON DELETE CASCADE,
                FOREIGN KEY(authorId) REFERENCES users(id)
            )
        `);
        console.log("Comment table initialized");

    } catch (err) {
        console.error("FATAL ERROR: Table initialization failed:", err);
    }
} else {
    console.log("WARNING: Database connection failed. Tables not initialized.");
}

// 라우터 등록 (모두 통합)
app.use('/auth', authRouter);
app.use('/events', eventRouter);
app.use('/clubs', clubRouter);
app.use('/comments', commentRouter);

// 개발 환경에서만 보이는 API 테스트 페이지
if (process.env.NODE_ENV !== 'production') {
    app.get('/', (req, res) => {
        res.send('Team1 Service is Running!');
    });
}

// 프로덕션: 모든 요청을 React 앱으로 전달 (SPA 라우팅)
// API 라우트는 이미 위에서 등록되었으므로, 여기로 오는 요청은 모두 index.html로
if (process.env.NODE_ENV === 'production') {
    app.use((req, res) => {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
}

app.listen(PORT, () => {
    console.log(`INFO: Server is running on http://localhost:${PORT}`);
});