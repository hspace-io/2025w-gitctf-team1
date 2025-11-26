const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DATABASE_DIR = path.join(path.resolve(), 'data');
const DATABASE_FILE = path.join(DATABASE_DIR, 'frontierCTF.db');

let dbInstance;

try {
    if (!fs.existsSync(DATABASE_DIR)) {
        fs.mkdirSync(DATABASE_DIR, { recursive: true });
        console.log(`Created database directory: ${DATABASE_DIR}`);
    }
    
    dbInstance = new Database(DATABASE_FILE, {
        verbose: console.log  // 디버깅용 쿼리 실행 로그 출력
    });
    
    dbInstance.exec('PRAGMA foreign_keys = ON;');
    
    console.log("SQLite DB (better-sqlite3) connected successfully.");
} catch (error) {
    console.error(`FATAL ERROR: Database connection failed. Path: ${DATABASE_FILE}`, error);
    dbInstance = null;
}

module.exports = dbInstance;