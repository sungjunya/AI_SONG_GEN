// server/routes/favorites.js

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
// 1) 좋아요 토글 (추가 ↔ 삭제)
//    POST /favorites/toggle/:songId
//    헤더: Authorization: Bearer <token>
// ------------------------------
router.post('/favorites/toggle/:songId', verifyToken, async (req, res) => {
    const songId = req.params.songId;
    const userId = req.userId;

    try {
        // 이미 좋아요가 눌러져 있는지 확인
        const [existing] = await pool.execute(
            'SELECT id FROM favorites WHERE user_id = ? AND song_id = ?',
            [userId, songId]
        );

        if (existing.length > 0) {
            // 좋아요가 이미 있으면 취소(삭제)
            await pool.execute(
                'DELETE FROM favorites WHERE user_id = ? AND song_id = ?',
                [userId, songId]
            );
            return res.json({ message: '좋아요 취소', liked: false });
        } else {
            // 좋아요가 없으면 추가(삽입)
            await pool.execute(
                'INSERT INTO favorites (user_id, song_id) VALUES (?, ?)',
                [userId, songId]
            );
            return res.json({ message: '좋아요 등록', liked: true });
        }
    } catch (error) {
        console.error('좋아요 토글 에러:', error);
        return res.status(500).json({ error: '좋아요 토글 중 오류가 발생했습니다.' });
    }
});

// ------------------------------
// 2) 특정 노래 좋아요 개수 조회
//    GET /favorites/count/:songId
// ------------------------------
router.get('/favorites/count/:songId', async (req, res) => {
    const songId = req.params.songId;
    try {
        const [rows] = await pool.execute(
            'SELECT COUNT(*) AS cnt FROM favorites WHERE song_id = ?',
            [songId]
        );
        const count = rows[0].cnt;
        return res.json({ songId: Number(songId), count });
    } catch (error) {
        console.error('좋아요 개수 조회 에러:', error);
        return res.status(500).json({ error: '좋아요 개수 조회 중 오류' });
    }
});

// ------------------------------
// 3) 로그인된 사용자가 해당 노래에 좋아요했는지 여부 조회
//    GET /favorites/user/:songId
//    헤더: Authorization: Bearer <token>
// ------------------------------
router.get('/favorites/user/:songId', verifyToken, async (req, res) => {
    const songId = req.params.songId;
    const userId = req.userId;
    try {
        const [rows] = await pool.execute(
            'SELECT id FROM favorites WHERE user_id = ? AND song_id = ?',
            [userId, songId]
        );
        const liked = rows.length > 0;
        return res.json({ songId: Number(songId), liked });
    } catch (error) {
        console.error('유저 좋아요 여부 조회 에러:', error);
        return res.status(500).json({ error: '유저 좋아요 여부 조회 중 오류' });
    }
});

module.exports = router;
