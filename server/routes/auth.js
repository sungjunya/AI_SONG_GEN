// server/routes/auth.js
const express = require('express')
const mysql = require('mysql2/promise')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const router = express.Router()

// MySQL 풀 생성
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8mb4',
})

// 연결 테스트
pool.getConnection()
    .then(conn => { console.log('✅ MySQL 연결 성공'); conn.release() })
    .catch(err => console.error('❌ MySQL 연결 실패:', err.message))

// 회원가입
router.post('/signup', async (req, res) => {
    const { email, password, username } = req.body
    if (!email || !password || !username) {
        return res.status(400).json({ error: '모든 필드를 입력하세요.' })
    }
    try {
        const hash = await bcrypt.hash(password, 10)
        await pool.execute(
            'INSERT INTO users (email, password, username) VALUES (?, ?, ?)',
            [email, hash, username]
        )
        res.json({ message: '회원가입 성공' })
    } catch (e) {
        if (e.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: '이미 존재하는 이메일입니다.' })
        }
        console.error(e)
        res.status(500).json({ error: '서버 에러' })
    }
})

// 로그인
router.post('/login', async (req, res) => {
    const { email, password } = req.body
    if (!email || !password) {
        return res.status(400).json({ error: '이메일과 비밀번호를 입력하세요.' })
    }
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE email = ?', [email]
        )
        const user = rows[0]
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: '잘못된 이메일 또는 비밀번호' })
        }
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        )
        res.json({ token, username: user.username })
    } catch (e) {
        console.error(e)
        res.status(500).json({ error: '서버 에러' })
    }
})

// 노래 저장
router.post('/songs', async (req, res) => {
    const { prompt, lyrics, audio_url } = req.body
    const auth = req.headers.authorization?.split(' ')[1]
    if (!auth) return res.status(401).json({ error: '로그인이 필요합니다.' })

    let userId
    try {
        userId = jwt.verify(auth, process.env.JWT_SECRET).userId
    } catch {
        return res.status(401).json({ error: '토큰이 유효하지 않습니다.' })
    }
    try {
        await pool.execute(
            'INSERT INTO songs (user_id, prompt, lyrics, audio_url) VALUES (?, ?, ?, ?)',
            [userId, prompt, lyrics || null, audio_url || null]
        )
        res.json({ message: '노래 저장 성공' })
    } catch (e) {
        console.error(e)
        res.status(500).json({ error: '서버 에러' })
    }
})

// 내 노래 조회
router.get('/songs', async (req, res) => {
    const auth = req.headers.authorization?.split(' ')[1]
    if (!auth) return res.status(401).json({ error: '로그인이 필요합니다.' })

    let userId
    try {
        userId = jwt.verify(auth, process.env.JWT_SECRET).userId
    } catch {
        return res.status(401).json({ error: '토큰이 유효하지 않습니다.' })
    }
    try {
        const [rows] = await pool.execute(
            'SELECT id, prompt, lyrics, audio_url, created_at FROM songs WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        )
        res.json(rows)
    } catch (e) {
        console.error(e)
        res.status(500).json({ error: '서버 에러' })
    }
})

module.exports = router
