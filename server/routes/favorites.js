// server/routes/favorites.js

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
    .then(() => console.log('✅ MySQL 연결 성공 (favorites.js)'))
    .catch(err => console.error('❌ MySQL 연결 실패 (favorites.js):', err.message));

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
// 1) 좋아요 추가 (/favorites)
// -------------------------
router.post('/favorites', authenticate, async (req, res) => {
    const { song_id } = req.body;
    if (!song_id) {
        return res.status(400).json({ error: 'song_id가 필요합니다.' });
    }
    try {
        await pool.execute(
            `INSERT INTO favorites (user_id, song_id) VALUES (?, ?)`,
            [req.userId, song_id]
        );
        return res.status(201).json({ message: '좋아요 추가 성공' });
    } catch (err) {
        console.error('좋아요 추가 에러:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: '이미 좋아요를 누른 노래입니다.' });
        }
        return res.status(500).json({ error: '좋아요 추가 실패' });
    }
});

// -------------------------
// 2) 좋아요 취소 (/favorites/:songId)
// -------------------------
router.delete('/favorites/:songId', authenticate, async (req, res) => {
    const songId = req.params.songId;
    try {
        const [result] = await pool.execute(
            `DELETE FROM favorites WHERE user_id = ? AND song_id = ?`,
            [req.userId, songId]
        );
        if (result.affectedRows === 0) {
            return res.status(400).json({ error: '취소할 좋아요가 없습니다.' });
        }
        return res.json({ message: '좋아요 취소 성공' });
    } catch (err) {
        console.error('좋아요 취소 에러:', err);
        return res.status(500).json({ error: '좋아요 취소 실패' });
    }
});

// -------------------------
// 3) 특정 사용자가 좋아요한 노래 아이디 목록 (/favorites/my) - 로그인 필요
// -------------------------
router.get('/favorites/my', authenticate, async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT song_id FROM favorites WHERE user_id = ?`,
            [req.userId]
        );
        const favoritedIds = rows.map(r => r.song_id);
        return res.json(favoritedIds);
    } catch (err) {
        console.error('내 좋아요 조회 에러:', err);
        return res.status(500).json({ error: '내 좋아요 조회 실패' });
    }
});

module.exports = router;
