// server/routes/ai.js

const express = require('express');
const axios = require('axios');
const router = express.Router();

// ------------------------------
// 1) 가사 생성 (/generate-lyrics)
// ------------------------------
router.post('/generate-lyrics', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: '프롬프트가 필요합니다.' });
    }
    try {
        const apiKey = process.env.OPENAI_API_KEY;
        const { data } = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: '너는 한국어로 감성적인 노래 가사를 만드는 전문가야.' },
                    { role: 'user', content: `한국어로 ${prompt}을 주제로 한 감성적인 노래 가사를 4줄로 만들어줘.` }
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
        res.json({ lyrics: data.choices[0].message.content.trim() });
    } catch (e) {
        console.error('가사 생성 에러:', e);
        res.status(500).json({ error: '가사 생성 실패: ' + e.message });
    }
});

// ------------------------------
// 2) 멜로디 설명 생성 (/generate-melody)
// ------------------------------
router.post('/generate-melody', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: '프롬프트가 필요합니다.' });
    }
    try {
        const apiKey = process.env.OPENAI_API_KEY;
        const { data } = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: '너는 한국어로 노래의 멜로디와 음악 스타일을 설명하는 전문가야.' },
                    { role: 'user', content: `한국어로 ${prompt}을 주제로 한 멜로디와 음악 스타일을 설명해줘.` }
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
        res.json({ melody: data.choices[0].message.content.trim() });
    } catch (e) {
        console.error('멜로디 생성 에러:', e);
        res.status(500).json({ error: '멜로디 생성 실패: ' + e.message });
    }
});

module.exports = router;
