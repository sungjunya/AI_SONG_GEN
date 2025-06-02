// server/routes/auth.js

const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const router = express.Router();

// ----- MySQL 연결 풀 설정 ----- //
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// 연결 테스트 (옵션)
pool.getConnection()
    .then(() => console.log('✅ MySQL 연결 성공 (auth.js)'))
    .catch(err => console.error('❌ MySQL 연결 실패 (auth.js):', err.message));

// ----- JWT 검증 미들웨어 ----- //
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: '로그인이 필요합니다.' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: '토큰이 제공되지 않았습니다.' });

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = payload.userId;
        req.username = payload.username;
        next();
    } catch (err) {
        return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
    }
};

// -------------------------
// 1) 회원가입 (/signup)
// -------------------------
router.post('/signup', async (req, res) => {
    const { email, password, username } = req.body;
    if (!email || !password || !username) {
        return res.status(400).json({ error: '모든 필드를 입력하세요.' });
    }

    try {
        const hashedPw = await bcrypt.hash(password, 10);
        await pool.execute(
            'INSERT INTO users (email, password, username) VALUES (?, ?, ?)',
            [email, hashedPw, username]
        );
        return res.status(201).json({ message: '회원가입 성공' });
    } catch (err) {
        console.error('회원가입 에러:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: '이미 존재하는 이메일입니다.' });
        }
        return res.status(500).json({ error: '서버 오류로 회원가입에 실패했습니다.' });
    }
});

// -------------------------
// 2) 로그인 (/login)
// -------------------------
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: '이메일과 비밀번호를 입력하세요.' });
    }

    try {
        const [rows] = await pool.execute(
            'SELECT id, password, username FROM users WHERE email = ?',
            [email]
        );
        if (rows.length === 0) {
            return res.status(401).json({ error: '잘못된 이메일 또는 비밀번호입니다.' });
        }

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: '잘못된 이메일 또는 비밀번호입니다.' });
        }

        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        return res.json({ token, username: user.username });
    } catch (err) {
        console.error('로그인 에러:', err);
        return res.status(500).json({ error: '서버 오류로 로그인에 실패했습니다.' });
    }
});

module.exports = router;
