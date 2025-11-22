const Database = require('better-sqlite3');
const path = require('path');

// DB 파일 경로설정 data 폴더가 프로젝트 루트에 있어야 함
const dbPath = path.join(__dirname, 'data', 'frontierCTF.db');

const db = new Database(dbPath, {
  verbose: console.log // 디버깅용 쿼리 실행 로그 출력
});

console.log("SQLite DB Connected!");

module.exports = db;