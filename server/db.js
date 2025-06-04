// server/db.js

const mysql = require('mysql2/promise');
const path = require('path');

// 프로젝트 루트의 .env를 읽도록 경로 지정
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const {
    DB_HOST,
    DB_USER,
    DB_PASSWORD,
    DB_NAME
} = process.env;

// 커넥션 풀 생성
const pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
});

module.exports = pool;
