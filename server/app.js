// server/app.js

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const path = require('path');

const authRouter = require('./routes/auth');
const aiRouter = require('./routes/ai');
const songRouter = require('./routes/song');
const favoritesRouter = require('./routes/favorites');
const commentsRouter = require('./routes/comments');
const requestsRouter = require('./routes/requests');

const app = express();

// 1) JSON body 파싱
app.use(express.json());

// 2) public 폴더 내 정적 파일 서빙
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

// 3) 라우터 연결 (순서 상관 없음)
app.use(authRouter);        // /signup, /login
app.use(aiRouter);          // /generate-lyrics, /generate-melody
app.use(songRouter);        // /songs, /my-songs
app.use(favoritesRouter);   // /favorites
app.use(commentsRouter);    // /comments
app.use(requestsRouter);    // /requests

// 4) (선택) 잘못된 경로 요청에 대한 처리
app.use((req, res) => {
    res.status(404).json({ error: '존재하지 않는 엔드포인트입니다.' });
});

// 5) 서버 실행
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
    console.log(`⏺ 현재 작업 디렉터리: ${process.cwd()}`);
    console.log(`⏺ __dirname (app.js 위치): ${__dirname}`);
    console.log(`⏺ 정적 서빙 경로(publicDir): ${publicDir}`);
});
