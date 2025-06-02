// server/routes/auth.js

const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// MySQL 커넥션 풀 생성
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// ------------------------------
// 1) 회원가입
// ------------------------------
router.post('/signup', async (req, res) => {
    const { email, password, username } = req.body;
    if (!email || !password || !username) {
        return res.status(400).json({ error: '모든 필드를 입력하세요.' });
    }
    try {
        // 비밀번호 해싱
        const hashed = await bcrypt.hash(password, 10);
        await pool.execute(
            'INSERT INTO users (email, password, username) VALUES (?, ?, ?)',
            [email, hashed, username]
        );
        return res.status(201).json({ message: '회원가입 성공' });
    } catch (err) {
        console.error('회원가입 에러:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: '이미 존재하는 이메일입니다.' });
        }
        return res.status(500).json({ error: '가입 실패: ' + err.message });
    }
});

// ------------------------------
// 2) 로그인
// ------------------------------
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
            return res.status(401).json({ error: '잘못된 이메일 또는 비밀번호' });
        }
        const user = rows[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: '잘못된 이메일 또는 비밀번호' });
        }
        // JWT 발급
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        return res.json({ token, username: user.username });
    } catch (err) {
        console.error('로그인 에러:', err);
        return res.status(500).json({ error: '로그인 실패: ' + err.message });
    }
});

// ------------------------------
// 3) 프로필 정보 조회 (/me)
// ------------------------------
async function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: '로그인 정보가 없습니다.' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        req.username = decoded.username;
        next();
    } catch (err) {
        return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
    }
}

router.get('/me', verifyToken, async (req, res) => {
    // 단순히 userId와 username을 리턴
    res.json({ userId: req.userId, username: req.username });
});

module.exports = router;
