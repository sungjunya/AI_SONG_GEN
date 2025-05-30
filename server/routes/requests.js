// server/routes/requests.js
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

// 노래 생성 요청 등록
router.post('/song_requests', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: '로그인이 필요합니다.' })
    let userId
    try { userId = jwt.verify(token, process.env.JWT_SECRET).userId }
    catch { return res.status(401).json({ error: '토큰이 유효하지 않습니다.' }) }

    const { song_title, artist, style } = req.body
    try {
        const [result] = await pool.execute(
            `INSERT INTO song_requests (user_id, song_title, artist, style) VALUES (?, ?, ?, ?)`,
            [userId, song_title || null, artist || null, style || null]
        )
        res.json({ message: '요청 등록 완료', request_id: result.insertId })
    } catch (e) {
        console.error(e)
        res.status(500).json({ error: '서버 에러' })
    }
})

// 내 요청 목록 조회
router.get('/song_requests', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: '로그인이 필요합니다.' })
    let userId
    try { userId = jwt.verify(token, process.env.JWT_SECRET).userId }
    catch { return res.status(401).json({ error: '토큰이 유효하지 않습니다.' }) }

    try {
        const [rows] = await pool.execute(
            `SELECT id, song_title, artist, style, status, created_at
         FROM song_requests
        WHERE user_id = ?
        ORDER BY created_at DESC`,
            [userId]
        )
        res.json(rows)
    } catch (e) {
        console.error(e)
        res.status(500).json({ error: '서버 에러' })
    }
})

// 관리자용 요청 업데이트
router.put('/song_requests/:id', async (req, res) => {
    const { id } = req.params
    const { status, lyrics, audio_url } = req.body
    try {
        await pool.execute(
            `UPDATE song_requests
          SET status = ?, lyrics = ?, audio_url = ?
        WHERE id = ?`,
            [status, lyrics || null, audio_url || null, id]
        )
        res.json({ message: '요청 업데이트 완료' })
    } catch (e) {
        console.error(e)
        res.status(500).json({ error: '서버 에러' })
    }
})

module.exports = router
