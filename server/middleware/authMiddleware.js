// server/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

/**
 * verifyToken 미들웨어
 *  - 요청 헤더 Authorization: "Bearer <토큰>" 형식으로 JWT를 전달받음
 *  - 유효하면 req.user = { id, username } 정보를 붙이고 next()
 *  - 유효하지 않으면 401 또는 403 응답
 */
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (!authHeader) {
        return res.status(401).json({ error: '토큰이 제공되지 않았습니다.' });
    }

    // "Bearer <토큰>" 구조라면 공백으로 분리
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ error: '올바른 인증 헤더 형식이 아닙니다.' });
    }

    const token = parts[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: '유효하지 않은 토큰입니다.' });
        }
        // decoded 안에 payload: { userId, username, iat, exp } 등이 들어있다고 가정
        req.user = {
            id: decoded.userId,
            username: decoded.username
        };
        next();
    });
}

module.exports = { verifyToken };
