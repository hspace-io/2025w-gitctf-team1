const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

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
        // 1. Users 테이블 생성 (사용자님 코드 + 팀원 코드 통합)
        db.prepare(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                name TEXT NOT NULL,
                schoolName TEXT,
                clubName TEXT,
                isAdmin INTEGER DEFAULT 0,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
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

        // 기본 동아리 데이터 추가
        const existingClub = db.prepare('SELECT clubName FROM Club WHERE clubName = ?').get('SecurityClub');
        if (!existingClub) {
            db.prepare('INSERT INTO Club (clubName, description, schoolName) VALUES (?, ?, ?)').run('SecurityClub', 'Default club for CTF and study posts.', 'KAIST');
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