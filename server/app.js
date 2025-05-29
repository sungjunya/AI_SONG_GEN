// server/app.js
const fs = require('fs');
const path = require('path');


const dotenvPath = path.resolve(__dirname, '.env');
require('dotenv').config({ path: dotenvPath, debug: true });



const express = require('express');
const dbRouter = require('./routes/mysql');
const aiRouter = require('./routes/server');

const app = express();

// ④ Express 미들웨어 설정
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(dbRouter);
app.use(aiRouter);

// ⑤ 서버 시작
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});
