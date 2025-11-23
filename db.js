const Database = require('better-sqlite3');
const path = require('path');

// DB 파일 경로 설정 (data 폴더가 프로젝트 루트에 있어야 함)
const DATABASE_FILE = path.join(path.resolve(), 'data', 'frontierCTF.db');

let dbInstance;

try {
    dbInstance = new Database(DATABASE_FILE, {
        verbose: console.log  // 디버깅용 쿼리 실행 로그 출력
    });
    
    // 외래키 제약 조건 활성화 (팀원 코드 반영 - 중요!)
    dbInstance.exec('PRAGMA foreign_keys = ON;');
    
    console.log("SQLite DB (better-sqlite3) connected successfully.");
} catch (error) {
    console.error(`FATAL ERROR: Database connection failed. Path: ${DATABASE_FILE}`, error);
    dbInstance = null;
}

module.exports = dbInstance;