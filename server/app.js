// server/app.js
const path = require('path')
const fs = require('fs')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

// ENV 로드 확인
console.log('▶︎ ENV loaded:', {
    DB_HOST: process.env.DB_HOST,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD ? '***' : '(empty)',
    DB_NAME: process.env.DB_NAME,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '***' : '(empty)',
    JWT_SECRET: process.env.JWT_SECRET ? '***' : '(empty)',
    PORT: process.env.PORT
})

const express = require('express')
const authRouter = require('./routes/auth')
const aiRouter = require('./routes/ai')
const favRouter = require('./routes/favorites')
const commentRouter = require('./routes/comments')
const reqRouter = require('./routes/requests')

const publicDir = path.join(__dirname, 'public')
console.log('▶︎ Serving static from:', publicDir)
try {
    console.log('▶︎ public files:', fs.readdirSync(publicDir))
} catch (e) {
    console.error('❌ publicDir error:', e.message)
}

const app = express()
app.use(express.json())
app.use(express.static(publicDir))

// API 라우터
app.use(authRouter)      // /signup, /login, /songs
app.use(aiRouter)        // /generate-lyrics, /generate-melody
app.use(favRouter)       // /favorites
app.use(commentRouter)   // /comments
app.use(reqRouter)       // /song_requests

// 404 핸들러
app.use((req, res) => {
    res.status(404).json({ error: '존재하지 않는 엔드포인트입니다.' })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`🚀 서버 실행 중: http://localhost:${PORT}`)
})
