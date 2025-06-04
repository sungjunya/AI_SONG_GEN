// server/routes/song.js

const express = require('express');
const pool = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');
const router = express.Router();

// —————————————————————————————————————————————————
// 1) 내 노래 저장 (POST /songs)  --- 인증 필요
//    - Headers: Authorization: "Bearer <token>"
//    - Body: { prompt, lyrics, audio_url, style }
//    - 응답: { message: '저장되었습니다.' }
// —————————————————————————————————————————————————
router.post('/songs', verifyToken, async (req, res) => {
    const { prompt, lyrics, audio_url, style } = req.body;
    const userId = req.user.id;

    if (!prompt) {
        return res.status(400).json({ error: '프롬프트는 필수입니다.' });
    }

    try {
        await pool.query(
            'INSERT INTO songs (user_id, prompt, lyrics, audio_url, style) VALUES (?, ?, ?, ?, ?)',
            [userId, prompt, lyrics || null, audio_url || null, style || null]
        );
        res.json({ message: '노래가 저장되었습니다.' });
    } catch (err) {
        console.error('노래 저장 실패:', err);
        res.status(500).json({ error: '노래 저장에 실패했습니다.' });
    }
});

// —————————————————————————————————————————————————
// 2) 내가 저장한 노래 목록 조회 (GET /songs/my)  --- 인증 필요
//    - Headers: Authorization: "Bearer <token>"
//    - 응답: [ { id, user_id, prompt, lyrics, audio_url, style, created_at } ]
// —————————————————————————————————————————————————
router.get('/songs/my', verifyToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const [rows] = await pool.query(
            'SELECT id, user_id, prompt, lyrics, audio_url, style, created_at FROM songs WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        res.json(rows);
    } catch (err) {
        console.error('내 노래 조회 실패:', err);
        res.status(500).json({ error: '내 노래 목록을 가져오지 못했습니다.' });
    }
});

// —————————————————————————————————————————————————
// 3) 공개된 모든 노래 조회 (GET /songs/public)  --- 인증 없이도 가능
//    - 응답: [ { id, user_id, prompt, lyrics, audio_url, style, created_at } ]
// —————————————————————————————————————————————————
router.get('/songs/public', async (req, res) => {
    try {
        // 모든 노래를 작성일 역순으로 가져온다
        const [rows] = await pool.query(
            'SELECT id, user_id, prompt, lyrics, audio_url, style, created_at FROM songs ORDER BY created_at DESC'
        );
        res.json(rows);
    } catch (err) {
        console.error('공개된 노래 조회 실패:', err);
        res.status(500).json({ error: '공개된 노래를 가져오지 못했습니다.' });
    }
});

module.exports = router;
