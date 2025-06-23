// server/routes/ai.js

const express = require('express');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const router = express.Router();

// —————————————————————————————————————————————————
// 1) 가사 생성 (POST /generate-lyrics)
//    - request body: { prompt }
//    - OpenAI Chat Completion 호출
//    - 응답: { lyrics: "생성된 가사" }
// —————————————————————————————————————————————————
router.post('/generate-lyrics', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: '프롬프트가 필요합니다.' });
    }

    try {
        const apiKey = process.env.OPENAI_API_KEY;
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: '너는 한국어로 감성적인 노래 가사를 만드는 전문가야.' },
                    { role: 'user', content: `한국어로 "${prompt}"을 주제로 감성적인 노래 가사로 만들어줘.` }
                ],
                max_tokens: 100,
                temperature: 0.9
            },
            {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const lyrics = response.data.choices[0].message.content.trim();
        res.json({ lyrics });
    } catch (err) {
        console.error('가사 생성 실패:', err);
        res.status(500).json({ error: '가사 생성에 실패했습니다.' });
    }
});

// —————————————————————————————————————————————————
// 2) 멜로디 설명 생성 (POST /generate-melody)
//    - request body: { prompt }
//    - OpenAI Chat Completion 호출
//    - 응답: { melody: "생성된 멜로디 설명" }
// —————————————————————————————————————————————————
router.post('/generate-melody', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: '프롬프트가 필요합니다.' });
    }

    try {
        const apiKey = process.env.OPENAI_API_KEY;
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: '너는 한국어로 노래의 멜로디와 음악 스타일을 설명하는 전문가야.' },
                    { role: 'user', content: `한국어로 "${prompt}"을 주제로 감성적인 멜로디와 음악 스타일을 4~5문장으로 설명해줘.` }
                ],
                max_tokens: 150,
                temperature: 0.8
            },
            {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const melody = response.data.choices[0].message.content.trim();
        res.json({ melody });
    } catch (err) {
        console.error('멜로디 생성 실패:', err);
        res.status(500).json({ error: '멜로디 생성에 실패했습니다.' });
    }
});

module.exports = router;
