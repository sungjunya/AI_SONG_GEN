// server/routes/auth.js

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const pool = require('../db');

// 프로젝트 루트의 .env를 읽어옴
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const router = express.Router();

// —————————————————————————————————————————————————
// 1) 회원가입 (POST /signup)
//    - request body: { email, password, username }
//    - password는 bcrypt로 해시 저장
// —————————————————————————————————————————————————
router.post('/signup', async (req, res) => {
    const { email, password, username } = req.body;
    if (!email || !password || !username) {
        return res.status(400).json({ error: '이메일, 비밀번호, 사용자 이름을 모두 입력하세요.' });
    }

    try {
        // 이메일 중복 확인
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: '이미 사용 중인 이메일입니다.' });
        }

        // 비밀번호 해시
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 사용자 정보 저장
        await pool.query(
            'INSERT INTO users (email, password, username) VALUES (?, ?, ?)',
            [email, hashedPassword, username]
        );

        res.json({ message: '회원가입이 완료되었습니다.' });
    } catch (err) {
        console.error('회원가입 에러:', err);
        res.status(500).json({ error: '회원가입 중 오류가 발생했습니다.' });
    }
});


// —————————————————————————————————————————————————
// 2) 로그인 (POST /login)
//    - request body: { email, password }
//    - DB에서 email로 사용자 조회 → bcrypt.compare → JWT 발급
//    - 응답: { token, username }
// —————————————————————————————————————————————————
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: '이메일과 비밀번호를 입력하세요.' });
    }

    try {
        // DB에서 사용자 조회
        const [rows] = await pool.query('SELECT id, password, username FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(400).json({ error: '존재하지 않는 이메일입니다.' });
        }
        const user = rows[0];

        // 비밀번호 비교
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(400).json({ error: '비밀번호가 올바르지 않습니다.' });
        }

        // JWT 토큰 발급 (payload: { userId, username })
        const payload = { userId: user.id, username: user.username };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ token, username: user.username });
    } catch (err) {
        console.error('로그인 에러:', err);
        res.status(500).json({ error: '로그인 중 오류가 발생했습니다.' });
    }
});

module.exports = { router };
