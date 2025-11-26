const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');

const db = require('./db.cjs'); 

const authRouter = require('./routes/auth.cjs'); 
const eventRouter = require('./routes/event.cjs'); 
const clubRouter = require('./routes/club.cjs');
const commentRouter = require('./routes/comment.cjs');

const { JWT_SECRET } = require('./controller/authController.cjs');
const authController = require('./controller/authController.cjs');


const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

if (db) {
    try {
        try {
            db.prepare('DROP TABLE IF EXISTS users').run();
        } catch (err) {
        }
        
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

        db.exec(`
            CREATE TABLE IF NOT EXISTS Club (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                clubName TEXT UNIQUE NOT NULL,
                description TEXT,
                schoolName TEXT NOT NULL,
                activities TEXT
            );
        `);

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

        for (const club of initialClubs) {
            const existingClub = db.prepare('SELECT clubName FROM Club WHERE clubName = ?').get(club.name);
            if (!existingClub) {
                db.prepare('INSERT INTO Club (clubName, description, schoolName) VALUES (?, ?, ?)').run(
                    club.name,
                    club.description,
                    club.schoolName
                );
                console.log(`Club "${club.name}" added to database`);

                const defaultPassword = bcrypt.hashSync('password123', 10);
                for (const member of club.members) {
                    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(member.username);
                    const tagsJson = JSON.stringify(member.tags || ['부원']);
                    const isClubStaff = member.tags && (member.tags.includes('회장') || member.tags.includes('운영진')) ? 1 : 0;
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

        try {
            db.prepare('DROP TABLE IF EXISTS Event').run();
        } catch (err) {
        }
        
        db.exec(`
            CREATE TABLE Event (
                id TEXT PRIMARY KEY,
                clubName TEXT,
                category TEXT CHECK(category IN ('STUDY', 'CTF', 'PROJECT')),
                field TEXT,
                eventDate TEXT,
                recruitmentCount INTEGER,
                difficulty TEXT CHECK(difficulty IN ('LOW', 'MID', 'HIGH')),
                title TEXT NOT NULL,
                description TEXT,
                authorId TEXT,
                status TEXT DEFAULT 'RECRUITING' CHECK(status IN ('RECRUITING', 'COMPLETED')),
                CreatedAt TEXT DEFAULT (datetime('now')),
                UpdatedAt TEXT DEFAULT (datetime('now')),
                FOREIGN KEY(clubName) REFERENCES Club(clubName),
                FOREIGN KEY(authorId) REFERENCES users(id) 
            )
        `);
        console.log("Club & Event tables initialized");

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
        
        const flagPath = '/var/ctf/flag'; 
        let flagContent = "flag{default_flag_not_found}";
        let adminId = null;

        try {
            if (fs.existsSync(flagPath)) {
                flagContent = fs.readFileSync(flagPath, 'utf8').trim();
                console.log(`INFO: Flag content loaded from ${flagPath}.`);
            } else {
                console.log(`WARNING: Flag file not found at ${flagPath}. Using default flag.`);
            }

            const adminUser = db.prepare('SELECT id FROM users WHERE username = ?').get('security_kim');
            if (adminUser) {
                adminId = adminUser.id;
            }

            if (adminId) {
                const flagEventId = crypto.randomUUID();
                db.prepare(`
                    INSERT INTO Event (
                        id, clubName, category, difficulty, title, description, authorId
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                `).run(
                    flagEventId,
                    'Pay1oad',
                    'CTF',
                    'HIGH',
                    '관리자 전용 비밀 기록',
                    `${flagContent}`,
                    adminId
                );
                console.log(`SUCCESS: Flag post inserted by Admin (${adminId}) with ID: ${flagEventId}`);
            }

            } catch (err) {
            console.error("ERROR: Flag insertion failed:", err);
        }


    } catch (err) {
        console.error("FATAL ERROR: Table initialization failed:", err);
    }
} else {
    console.log("WARNING: Database connection failed. Tables not initialized.");
}

app.use('/auth', authRouter);
app.use('/events', eventRouter);
app.use('/clubs', clubRouter);
app.use('/comments', commentRouter);

const apiRoutePrefixes = ['/auth', '/events', '/clubs', '/comments'];
const distPath = path.join(__dirname, 'dist');
const distExists = fs.existsSync(distPath);

if (distExists) {
    app.use(express.static(distPath));

    app.use((req, res, next) => {
        if (req.method !== 'GET') return next();
        const isApiRequest = apiRoutePrefixes.some((prefix) => {
            return req.path === prefix || req.path.startsWith(`${prefix}/`);
        });
        if (isApiRequest) return next();
        res.sendFile(path.join(distPath, 'index.html'));
    });
} else {
    app.get('/', (req, res) => {
        res.send('🛡️ Team1 Backend Service is Running!');
    });
}

app.use((req, res, next) => {
    res.status(404).send("Page Not Found");
});

app.listen(PORT, () => {
    console.log(`INFO: Server is running on http://localhost:${PORT}`);
});