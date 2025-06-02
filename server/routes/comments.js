// server/routes/comments.js

const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

// 커넥션 풀 생성
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 토큰 검증 미들웨어
async function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: '로그인이 필요합니다.' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        req.username = decoded.username;
        next();
    } catch (err) {
        return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
    }
}

// ------------------------------
// 1) 댓글 조회 (GET /comments/:songId)
// ------------------------------
router.get('/comments/:songId', async (req, res) => {
    const songId = req.params.songId;
    try {
        const [rows] = await pool.execute(`
      SELECT c.id, c.user_id, c.content, c.created_at, u.username
      FROM comments AS c
      JOIN users AS u ON c.user_id = u.id
      WHERE c.song_id = ?
      ORDER BY c.created_at DESC
    `, [songId]);
        return res.json(rows);
    } catch (err) {
        console.error('댓글 조회 에러:', err);
        return res.status(500).json({ error: '댓글 조회 실패' });
    }
});

// ------------------------------
// 2) 댓글 작성 (POST /comments/:songId)
//    헤더: Authorization: Bearer <token>
//    body: { content }
// ------------------------------
router.post('/comments/:songId', verifyToken, async (req, res) => {
    const songId = req.params.songId;
    const userId = req.userId;
    const { content } = req.body;
    if (!content) {
        return res.status(400).json({ error: '댓글 내용을 입력하세요.' });
    }
    try {
        await pool.execute(
            'INSERT INTO comments (user_id, song_id, content) VALUES (?, ?, ?)',
            [userId, songId, content]
        );
        return res.json({ message: '댓글 등록 성공' });
    } catch (err) {
        console.error('댓글 작성 에러:', err);
        return res.status(500).json({ error: '댓글 작성 실패' });
    }
});

module.exports = router;
