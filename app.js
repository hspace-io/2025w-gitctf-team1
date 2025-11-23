const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// DB 연결
const db = require('./db'); 

// 라우터 불러오기
const authRouter = require('./routes/auth'); 
const eventRouter = require('./routes/event.js'); 
const clubRouter = require('./routes/club.js');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

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
                clubName TEXT PRIMARY KEY,
                description TEXT,
                schoolName TEXT NOT NULL 
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

app.get('/', (req, res) => {
    res.send('Team1 Service is Running!');
});

app.listen(PORT, () => {
    console.log(`INFO: Server is running on http://localhost:${PORT}`);
});