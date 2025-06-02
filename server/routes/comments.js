// server/routes/comments.js

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
    .then(() => console.log('✅ MySQL 연결 성공 (comments.js)'))
    .catch(err => console.error('❌ MySQL 연결 실패 (comments.js):', err.message));

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
// 1) 특정 노래 댓글 조회 (/comments/:songId)
// -------------------------
router.get('/comments/:songId', async (req, res) => {
    const songId = req.params.songId;
    try {
        const [rows] = await pool.execute(
            `SELECT c.id, c.user_id, u.username, c.content, c.created_at
       FROM comments AS c
       JOIN users AS u ON c.user_id = u.id
       WHERE c.song_id = ?
       ORDER BY c.created_at ASC`,
            [songId]
        );
        return res.json(rows);
    } catch (err) {
        console.error('댓글 조회 에러:', err);
        return res.status(500).json({ error: '댓글 조회 실패' });
    }
});

// -------------------------
// 2) 댓글 등록 (/comments)
// -------------------------
router.post('/comments', authenticate, async (req, res) => {
    const { song_id, content } = req.body;
    if (!song_id || !content) {
        return res.status(400).json({ error: 'song_id와 content가 필요합니다.' });
    }
    try {
        await pool.execute(
            `INSERT INTO comments (user_id, song_id, content) VALUES (?, ?, ?)`,
            [req.userId, song_id, content]
        );
        return res.status(201).json({ message: '댓글 등록 성공' });
    } catch (err) {
        console.error('댓글 등록 에러:', err);
        return res.status(500).json({ error: '댓글 등록 실패' });
    }
});

module.exports = router;
