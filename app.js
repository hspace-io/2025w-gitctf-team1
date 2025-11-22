const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const db = require('./db'); 
const authRouter = require('./routes/auth'); 

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
    console.log("Users table initialized");
} catch (err) {
    console.error("Table initialization failed:", err);
}

app.use('/auth', authRouter);

app.get('/', (req, res) => {
  res.send('Team1 Service is Running!');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});