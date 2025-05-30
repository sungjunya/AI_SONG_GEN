// server/routes/favorites.js
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

// 즐겨찾기 추가
router.post('/favorites', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: '로그인이 필요합니다.' })
    let userId
    try { userId = jwt.verify(token, process.env.JWT_SECRET).userId }
    catch { return res.status(401).json({ error: '토큰이 유효하지 않습니다.' }) }

    const { song_id } = req.body
    if (!song_id) return res.status(400).json({ error: 'song_id가 필요합니다.' })

    try {
        await pool.execute('INSERT INTO favorites (user_id, song_id) VALUES (?, ?)', [userId, song_id])
        res.json({ message: '즐겨찾기 추가 완료' })
    } catch (e) {
        if (e.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: '이미 즐겨찾기한 노래입니다.' })
        }
        console.error(e)
        res.status(500).json({ error: '서버 에러' })
    }
})

// 즐겨찾기 해제
router.delete('/favorites/:song_id', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: '로그인이 필요합니다.' })
    let userId
    try { userId = jwt.verify(token, process.env.JWT_SECRET).userId }
    catch { return res.status(401).json({ error: '토큰이 유효하지 않습니다.' }) }

    const song_id = req.params.song_id
    try {
        await pool.execute('DELETE FROM favorites WHERE user_id = ? AND song_id = ?', [userId, song_id])
        res.json({ message: '즐겨찾기 해제 완료' })
    } catch (e) {
        console.error(e)
        res.status(500).json({ error: '서버 에러' })
    }
})

// 내 즐겨찾기 목록 조회
router.get('/favorites', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: '로그인이 필요합니다.' })
    let userId
    try { userId = jwt.verify(token, process.env.JWT_SECRET).userId }
    catch { return res.status(401).json({ error: '토큰이 유효하지 않습니다.' }) }

    try {
        const [rows] = await pool.execute(
            `SELECT f.song_id, s.prompt, s.created_at
         FROM favorites f
         JOIN songs s ON f.song_id = s.id
        WHERE f.user_id = ?
        ORDER BY f.created_at DESC`,
            [userId]
        )
        res.json(rows)
    } catch (e) {
        console.error(e)
        res.status(500).json({ error: '서버 에러' })
    }
})

module.exports = router
