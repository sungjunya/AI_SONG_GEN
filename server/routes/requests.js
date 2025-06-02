// server/routes/requests.js

const express = require('express');
const mysql = require('mysql2/promise');
const router = express.Router();
const jwt = require('jsonwebtoken');

// ----- MySQL 연결 풀 설정 ----- //
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// 연결 테스트 (옵션)
pool.getConnection()
    .then(() => console.log('✅ MySQL 연결 성공 (requests.js)'))
    .catch(err => console.error('❌ MySQL 연결 실패 (requests.js):', err.message));

// ----- JWT 검증 미들웨어 (복사) ----- //
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: '로그인이 필요합니다.' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: '토큰이 제공되지 않았습니다.' });

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = payload.userId;
        req.username = payload.username;
        next();
    } catch (err) {
        return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
    }
};

// -------------------------
// 노래 요청 등록 (/requests) - 로그인 필요
// -------------------------
router.post('/requests', authenticate, async (req, res) => {
    const { song_title, artist, style } = req.body;
    if (!song_title || !artist) {
        return res.status(400).json({ error: 'song_title과 artist가 필요합니다.' });
    }
    try {
        await pool.execute(
            `INSERT INTO song_requests (user_id, song_title, artist, style)
       VALUES (?, ?, ?, ?)`,
            [req.userId, song_title, artist, style || null]
        );
        return res.status(201).json({ message: '노래 요청이 접수되었습니다.' });
    } catch (err) {
        console.error('노래 요청 등록 에러:', err);
        return res.status(500).json({ error: '노래 요청 등록 실패' });
    }
});

module.exports = router;
