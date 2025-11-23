const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// DB 연결
const db = require('./db'); 

// 라우터 불러오기
const authRouter = require('./routes/auth'); 
const eventRouter = require('./routes/event'); // 팀원이 추가한 이벤트 라우터

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// 1. DB 연결 확인 및 테이블 초기화
if (db) {
    try {
        // (1) 유저 테이블 생성 (사용자님 코드)
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

        // (2) 동아리 테이블 생성 (팀원 코드)
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

        // (3) 이벤트 테이블 생성 (팀원 코드)
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
                CreatedAt TEXT DEFAULT (datetime('now')),
                UpdatedAt TEXT DEFAULT (datetime('now')),
                FOREIGN KEY(clubName) REFERENCES Club(clubName)
            )
        `);
        console.log("Club & Event tables initialized");

    } catch (err) {
        console.error("FATAL ERROR: Table initialization failed:", err);
    }
} else {
    console.log("WARNING: Database connection failed. Tables not initialized.");
}

// 2. 라우터 등록
app.use('/auth', authRouter);   // 로그인, 회원가입
app.use('/events', eventRouter); // 이벤트(게시판)

// 3. 기본 라우트
app.get('/', (req, res) => {
    res.send('Team1 Service is Running!');
});

// 4. 서버 실행
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});