// server/routes/comments.js

const express = require('express');
const pool = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');
const router = express.Router();

// —————————————————————————————————————————————————
// 1) 특정 노래의 댓글 목록 조회 (GET /comments/:songId)  --- 인증 없이도 가능
//    - 응답: [ { id, user_id, content, created_at, username } ]
//      (username은 JOIN을 통해 users 테이블에서 가져옴)
// —————————————————————————————————————————————————
router.get('/comments/:songId', async (req, res) => {
    const songId = req.params.songId;
    try {
        // INNER JOIN users 테이블에서 username 가져오기
        const [rows] = await pool.query(
            `SELECT c.id, c.user_id, c.song_id, c.content, c.created_at, u.username
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.song_id = ?
       ORDER BY c.created_at ASC`,
            [songId]
        );
        res.json(rows);
    } catch (err) {
        console.error('댓글 목록 조회 실패:', err);
        res.status(500).json({ error: '댓글 목록을 가져오지 못했습니다.' });
    }
});

// —————————————————————————————————————————————————
// 2) 특정 노래에 댓글 작성 (POST /comments/:songId)  --- 인증 필요
//    - Headers: Authorization: "Bearer <token>"
//    - Body: { content }
//    - 응답: { message: '댓글 등록 완료' }
// —————————————————————————————————————————————————
router.post('/comments/:songId', verifyToken, async (req, res) => {
    const songId = req.params.songId;
    const userId = req.user.id;
    const { content } = req.body;
    if (!content) {
        return res.status(400).json({ error: '댓글 내용을 입력하세요.' });
    }

    try {
        await pool.query(
            'INSERT INTO comments (user_id, song_id, content) VALUES (?, ?, ?)',
            [userId, songId, content]
        );
        res.json({ message: '댓글이 등록되었습니다.' });
    } catch (err) {
        console.error('댓글 등록 실패:', err);
        res.status(500).json({ error: '댓글 등록에 실패했습니다.' });
    }
});

module.exports = router;
