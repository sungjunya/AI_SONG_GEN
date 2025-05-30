// server/routes/comments.js
const express = require('express')
const jwt = require('jsonwebtoken')
const mysql = require('mysql2/promise')
const router = express.Router()

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8mb4',
})

// 댓글 작성
router.post('/comments', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: '로그인이 필요합니다.' })
    let userId
    try { userId = jwt.verify(token, process.env.JWT_SECRET).userId }
    catch { return res.status(401).json({ error: '토큰이 유효하지 않습니다.' }) }

    const { song_id, content } = req.body
    if (!song_id || !content) {
        return res.status(400).json({ error: 'song_id와 content가 필요합니다.' })
    }

    try {
        await pool.execute('INSERT INTO comments (user_id, song_id, content) VALUES (?, ?, ?)', [userId, song_id, content])
        res.json({ message: '댓글 작성 완료' })
    } catch (e) {
        console.error(e)
        res.status(500).json({ error: '서버 에러' })
    }
})

// 특정 노래 댓글 조회
router.get('/comments/:song_id', async (req, res) => {
    const song_id = req.params.song_id
    try {
        const [rows] = await pool.execute(
            `SELECT c.id, c.content, c.created_at, u.username
         FROM comments c
         JOIN users u ON c.user_id = u.id
        WHERE c.song_id = ?
        ORDER BY c.created_at ASC`,
            [song_id]
        )
        res.json(rows)
    } catch (e) {
        console.error(e)
        res.status(500).json({ error: '서버 에러' })
    }
})

module.exports = router
