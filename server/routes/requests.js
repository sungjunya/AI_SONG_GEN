// server/routes/requests.js

const express = require('express');
const pool = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');
const router = express.Router();


// —————————————————————————————————————————————————
router.post('/requests', verifyToken, async (req, res) => {
    const userId = req.user.id;
    const { song_title, artist, style } = req.body;
    if (!song_title) {
        return res.status(400).json({ error: '노래 제목을 입력하세요.' });
    }

    try {
        await pool.query(
            'INSERT INTO song_requests (user_id, song_title, artist, style) VALUES (?, ?, ?, ?)',
            [userId, song_title, artist || null, style || null]
        );
        res.json({ message: '노래 요청이 접수되었습니다.' });
    } catch (err) {
        console.error('요청 등록 실패:', err);
        res.status(500).json({ error: '요청 등록에 실패했습니다.' });
    }
});

// —————————————————————————————————————————————————
// “내 노래 요청” 목록 조회 (GET /requests/my)  --- 인증 필요
// —————————————————————————————————————————————————
router.get('/requests/my', verifyToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const [rows] = await pool.query(
            'SELECT * FROM song_requests WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        res.json(rows);
    } catch (err) {
        console.error('내 요청 목록 조회 실패:', err);
        res.status(500).json({ error: '내 요청 목록을 가져오지 못했습니다.' });
    }
});

module.exports = router;
