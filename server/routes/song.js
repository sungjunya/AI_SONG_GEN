// server/routes/song.js

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
    .then(() => console.log('✅ MySQL 연결 성공 (song.js)'))
    .catch(err => console.error('❌ MySQL 연결 실패 (song.js):', err.message));

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
// 1) 내 노래 목록 조회 (/my-songs) - 로그인 필요
// -------------------------
router.get('/my-songs', authenticate, async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT id, prompt, lyrics, audio_url, style, created_at
       FROM songs
       WHERE user_id = ?
       ORDER BY created_at DESC`,
            [req.userId]
        );
        return res.json(rows);
    } catch (err) {
        console.error('내 노래 조회 에러:', err);
        return res.status(500).json({ error: '내 노래 조회 실패' });
    }
});

// -------------------------
// 2) 노래 저장 (/songs) - 로그인 필요
// -------------------------
router.post('/songs', authenticate, async (req, res) => {
    const { prompt, lyrics, audio_url, style } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: '프롬프트는 필수입니다.' });
    }
    try {
        await pool.execute(
            `INSERT INTO songs (user_id, prompt, lyrics, audio_url, style)
       VALUES (?, ?, ?, ?, ?)`,
            [req.userId, prompt, lyrics || null, audio_url || null, style || null]
        );
        return res.status(201).json({ message: '노래 저장 성공' });
    } catch (err) {
        console.error('노래 저장 에러:', err);
        return res.status(500).json({ error: '노래 저장에 실패했습니다.' });
    }
});

// -------------------------
// 3) 공개된 모든 노래 조회 (/songs) - 로그인 없어도 가능
// -------------------------
router.get('/songs', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT s.id, s.user_id, s.prompt, s.lyrics, s.audio_url, s.style, s.created_at, u.username
       FROM songs AS s
       JOIN users AS u ON s.user_id = u.id
       ORDER BY s.created_at DESC`
        );
        return res.json(rows);
    } catch (err) {
        console.error('공개 노래 조회 에러:', err);
        return res.status(500).json({ error: '공개된 노래 조회 실패' });
    }
});

module.exports = router;
