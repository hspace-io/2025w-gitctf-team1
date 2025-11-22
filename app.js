const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const db = require('./db.js');
const authRouter = require('./routes/auth'); 
const eventRouter = require('./routes/event.js'); 


const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

try {
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
} catch (err) {
    console.error("FATAL ERROR: Users table initialization failed:", err);
}

if (db) {
    try {
        db.exec(`
            CREATE TABLE IF NOT EXISTS Club (
                clubName TEXT PRIMARY KEY,
                description TEXT,
                schoolName TEXT NOT NULL 
            );
        `);
        
        const existingClub = db.prepare('SELECT clubName FROM Club WHERE clubName = ?').get('SecurityClub');
        
        if (!existingClub) {
            db.prepare('INSERT INTO Club (clubName, description, schoolName) VALUES (?, ?, ?)').run('SecurityClub', 'Default club for CTF and study posts.', 'KAIST');
        }
        
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
        
        app.use('/events', eventRouter);
    } catch (error) {
        console.error("FATAL ERROR: Database initialization (Event/Club) failed.", error);
    }
} else {
    console.log("WARNING: Database connection failed. /events router not connected.");
}


app.use('/auth', authRouter);

app.get('/', (req, res) => {
    res.send('Team1 Service is Running!');
});

app.listen(PORT, () => {
    console.log(`INFO: Server is running on http://localhost:${PORT}`);
});