// server/routes/favorites.js

const express = require('express');
const pool = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * 1) 좋아요 추가/취소
 *    - Method: POST
 *    - Path:   /favorites/toggle/:songId
 *    - Headers: Authorization: "Bearer <token>" (verifyToken 미들웨어 필요)
 *    - 응답:   { liked: true } 또는 { liked: false }
 */
router.post('/favorites/toggle/:songId', verifyToken, async (req, res) => {
    const userId = req.user.id;           // verifyToken 미들웨어로부터 설정된 유저 ID
    const songId = req.params.songId;     // URL 파라미터로 전달된 song ID

    try {
        // 1) 현재 좋아요 상태 확인 (userId, songId 조합으로 조회)
        const [existingRows] = await pool.query(
            'SELECT id FROM favorites WHERE user_id = ? AND song_id = ?',
            [userId, songId]
        );

        if (existingRows.length > 0) {
            // 이미 좋아요가 되어 있으면 삭제(취소)
            await pool.query(
                'DELETE FROM favorites WHERE user_id = ? AND song_id = ?',
                [userId, songId]
            );
            return res.json({ liked: false });
        } else {
            // 좋아요가 안 되어 있으면 새로 삽입
            await pool.query(
                'INSERT INTO favorites (user_id, song_id) VALUES (?, ?)',
                [userId, songId]
            );
            return res.json({ liked: true });
        }
    } catch (err) {
        console.error('좋아요 토글 실패:', err);
        return res.status(500).json({ error: '좋아요 토글 중 오류가 발생했습니다.' });
    }
});

/**
 * 2) 특정 노래의 좋아요 수 조회
 *    - Method: GET
 *    - Path:   /favorites/count/:songId
 *    - 인증:   불필요
 *    - 응답:   { count: <숫자> }
 */
router.get('/favorites/count/:songId', async (req, res) => {
    const songId = req.params.songId;

    try {
        const [rows] = await pool.query(
            'SELECT COUNT(*) AS cnt FROM favorites WHERE song_id = ?',
            [songId]
        );
        // COUNT(*) 결과가 cnt 칼럼으로 반환됨
        const count = rows[0].cnt || 0;
        return res.json({ count });
    } catch (err) {
        console.error('좋아요 수 조회 실패:', err);
        return res.status(500).json({ error: '좋아요 수를 가져오지 못했습니다.' });
    }
});

/**
 * 3) 사용자가 특정 노래에 좋아요를 눌렀는지 조회
 *    - Method: GET
 *    - Path:   /favorites/user/:songId
 *    - Headers: Authorization: "Bearer <token>" (verifyToken 미들웨어 필요)
 *    - 응답:   { liked: true } 또는 { liked: false }
 */
router.get('/favorites/user/:songId', verifyToken, async (req, res) => {
    const userId = req.user.id;
    const songId = req.params.songId;

    try {
        const [rows] = await pool.query(
            'SELECT id FROM favorites WHERE user_id = ? AND song_id = ?',
            [userId, songId]
        );
        const liked = rows.length > 0;
        return res.json({ liked });
    } catch (err) {
        console.error('유저 좋아요 여부 조회 실패:', err);
        return res.status(500).json({ error: '좋아요 여부를 확인하지 못했습니다.' });
    }
});

module.exports = router;
