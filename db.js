const Database = require('better-sqlite3'); //npm install better-sqlite3

const db = new Database('./data/frontierCTF.db', {
  verbose: console.log  
});

console.log("SQLite DB Connected!");

module.exports = db;
