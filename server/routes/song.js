const express = require('express');
const pool = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');
const router = express.Router();

router.post('/songs', verifyToken, async (req, res) => {
    const { prompt, lyrics, style } = req.body;
    const userId = req.user.id;

    if (!prompt) {
        return res.status(400).json({ error: '프롬프트는 필수입니다.' });
    }

    try {
        // 1) 가사 임시 저장 (원격 서버에 직접 쓸 수도 있지만, 현재는 로컬 서버 기준으로 저장)
        const lyricsDir = path.join(__dirname, '../lyrics');
        if (!fs.existsSync(lyricsDir)) {
            fs.mkdirSync(lyricsDir, { recursive: true });
        }
        const lyricsPath = path.join(lyricsDir, `lyrics_${userId}_${Date.now()}.txt`);
        fs.writeFileSync(lyricsPath, lyrics || prompt, 'utf-8');

        // 2) Bark 원격 실행할 때, 고유 파일명 만들어서 인자로 전달
        const timestamp = Date.now();
        const remoteOutputFileName = `audio_${userId}_${timestamp}.wav`;
        const remoteOutputPath = `/home/student_15032/audio/${remoteOutputFileName}`;

        // SSH 명령어: lyrics 파일도 원격 서버에 복사해서 실행하려면 별도 처리 필요
        // 여기서는 Bark 스크립트가 lyrics.txt를 직접 읽는 게 아니라 인자로 텍스트를 넘겨 실행하도록 수정하는 게 더 좋음
        // 하지만 지금은 간단히 lyrics.txt 원격 복사부터 하겠습니다.

        // lyrics 파일을 원격 서버에 복사 (scp)
        const scpLyricsCmd = `scp -P 10022 ${lyricsPath} student_15032@116.124.191.174:/home/student_15032/lyrics/lyrics.txt`;

        exec(scpLyricsCmd, (scpErr) => {
            if (scpErr) {
                console.error('가사 파일 전송 실패:', scpErr);
                return res.status(500).json({ error: '가사 전송 실패' });
            }

            // Bark 실행 (음성 생성, output 파일명 인자로 전달)
            const barkCmd = `ssh -p 10022 student_15032@116.124.191.174 "source /home/student_15032/bark_env/bin/activate && python3 /home/student_15032/bark/bark_generate.py ${remoteOutputPath}"`;

            exec(barkCmd, (barkErr, stdout, stderr) => {
                if (barkErr) {
                    console.error('Bark 실행 실패:', barkErr);
                    console.error(stderr);
                    return res.status(500).json({ error: '음성 생성 실패' });
                }

                // 음원 서버로 복사
                const localAudioDir = path.join(__dirname, '../public/audio');
                if (!fs.existsSync(localAudioDir)) {
                    fs.mkdirSync(localAudioDir, { recursive: true });
                }
                const scpAudioCmd = `scp -P 10022 student_15032@116.124.191.174:${remoteOutputPath} ${path.join(localAudioDir, remoteOutputFileName)}`;

                exec(scpAudioCmd, async (scpAudioErr) => {
                    if (scpAudioErr) {
                        console.error('음원 다운로드 실패:', scpAudioErr);
                        return res.status(500).json({ error: '음원 다운로드 실패' });
                    }

                    const audioUrl = `/audio/${remoteOutputFileName}`;

                    // DB에 저장
                    try {
                        await pool.query(
                            'INSERT INTO songs (user_id, prompt, lyrics, audio_url, style) VALUES (?, ?, ?, ?, ?)',
                            [userId, prompt, lyrics || null, audioUrl, style || null]
                        );
                        res.json({ message: '노래 생성 및 저장 완료', audioUrl });
                    } catch (dbErr) {
                        console.error('DB 저장 실패:', dbErr);
                        res.status(500).json({ error: 'DB 저장 실패' });
                    }
                });
            });
        });
    } catch (err) {
        console.error('서버 처리 오류:', err);
        res.status(500).json({ error: '서버 처리 오류' });
    }
});

module.exports = router;
