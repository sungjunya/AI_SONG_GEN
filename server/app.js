// server/app.js

const path = require('path');
const express = require('express');

// dotenv를 프로젝트 루트 `.env`에서 로드
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();

// ──────────────────────────────────────────────────────────────────────
// 1) 기본 미들웨어 설정
app.use(express.json());

// 정적 파일 서빙 (public 폴더 안의 index.html, script.js, style.css 등)
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

// ──────────────────────────────────────────────────────────────────────
// 2) 라우터 모듈 로드
const { router: authRouter } = require('./routes/auth');
const aiRouter = require('./routes/ai');
const songRouter = require('./routes/song');
const favRouter = require('./routes/favorites');
const commentRouter = require('./routes/comments');
const requestRouter = require('./routes/requests'); // (필요 시)

// ──────────────────────────────────────────────────────────────────────
// 3) 라우터 연결 순서
//   1) 인증(회원가입/로그인)
app.use(authRouter);

//   2) AI(가사/멜로디 생성)
app.use(aiRouter);

//   3) 노래 저장/조회 (내 노래 조회, 공개 노래 조회)
app.use(songRouter);

//   4) 좋아요 기능 (추가/취소, 개수 조회, 유저 좋아요 여부)
app.use(favRouter);

//   5) 댓글 기능
app.use(commentRouter);

//   6) 노래 요청 기능(선택)
app.use(requestRouter);

app.use('/audio', express.static(path.join(__dirname, 'audio')));

//   7) 존재하지 않는 경로에 대한 404 응답
app.use((req, res) => {
    res.status(404).json({ error: '존재하지 않는 엔드포인트입니다.' });
});

// ──────────────────────────────────────────────────────────────────────
// 4) 서버 실행
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});
