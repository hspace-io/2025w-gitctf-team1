const Database = require('better-sqlite3');
const path = require('path');

// DB 파일 경로 (data 폴더가 프로젝트 루트에 있어야 함)
// 사용자님의 환경과 팀원의 코드를 합쳤습니다.
const dbPath = path.join(path.resolve(), 'data', 'frontierCTF.db');

let db;

try {
    db = new Database(dbPath, {
        verbose: console.log  // 디버깅용 쿼리 실행 로그 출력
    });
    
    // 외래키 제약 조건 활성화 (팀원 코드 반영)
    db.exec('PRAGMA foreign_keys = ON;');
    
    console.log("SQLite DB (better-sqlite3) connected successfully.");
} catch (error) {
    console.error(`FATAL ERROR: Database connection failed. Path: ${dbPath}`, error);
    db = null;
}

module.exports = db;