// server/routes/song.js

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
    if (!token) {
        return res.status(401).json({ error: '로그인이 필요합니다.' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (err) {
        return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
    }
}

// ------------------------------
// 1) 공개된 모든 노래 조회 (좋아요 개수 포함)
//    GET /songs/public
// ------------------------------
router.get('/songs/public', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
      SELECT
        s.id,
        s.user_id,
        s.prompt,
        s.lyrics,
        s.audio_url,
        s.style,
        s.created_at,
        COALESCE(fav_counts.cnt, 0) AS like_count
      FROM songs AS s
      LEFT JOIN (
        SELECT song_id, COUNT(*) AS cnt
        FROM favorites
        GROUP BY song_id
      ) AS fav_counts ON s.id = fav_counts.song_id
      ORDER BY s.created_at DESC
    `);
        res.json(rows);
    } catch (error) {
        console.error('공개된 모든 노래 조회 에러:', error);
        res.status(500).json({ error: '공개된 노래 조회 실패' });
    }
});

// ------------------------------
// 2) 로그인된 사용자가 저장한 노래 조회 (내 노래)
//    GET /songs/my
// ------------------------------
router.get('/songs/my', verifyToken, async (req, res) => {
    const userId = req.userId;
    try {
        const [rows] = await pool.execute(`
      SELECT
        s.id,
        s.user_id,
        s.prompt,
        s.lyrics,
        s.audio_url,
        s.style,
        s.created_at,
        COALESCE(fav_counts.cnt, 0) AS like_count
      FROM songs AS s
      LEFT JOIN (
        SELECT song_id, COUNT(*) AS cnt
        FROM favorites
        GROUP BY song_id
      ) AS fav_counts ON s.id = fav_counts.song_id
      WHERE s.user_id = ?
      ORDER BY s.created_at DESC
    `, [userId]);
        res.json(rows);
    } catch (error) {
        console.error('내 노래 조회 에러:', error);
        res.status(500).json({ error: '내 노래 조회 실패' });
    }
});

// ------------------------------
// 3) 노래 저장 (POST /songs)
//    헤더: Authorization: Bearer <token>
//    body: { prompt, lyrics, audio_url, style }
// ------------------------------
router.post('/songs', verifyToken, async (req, res) => {
    const userId = req.userId;
    const { prompt, lyrics, audio_url, style } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: '프롬프트는 필수입니다.' });
    }
    try {
        await pool.execute(
            'INSERT INTO songs (user_id, prompt, lyrics, audio_url, style) VALUES (?, ?, ?, ?, ?)',
            [userId, prompt, lyrics || null, audio_url || null, style || null]
        );
        res.status(201).json({ message: '노래 저장 성공' });
    } catch (error) {
        console.error('노래 저장 에러:', error);
        res.status(500).json({ error: '노래 저장 실패: ' + error.message });
    }
});

module.exports = router;
