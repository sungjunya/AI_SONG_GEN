// server/routes/ai.js
const express = require('express')
const axios = require('axios')
const jwt = require('jsonwebtoken')
const router = express.Router()

// 가사 생성
router.post('/generate-lyrics', async (req, res) => {
    const { prompt } = req.body
    if (!prompt) return res.status(400).json({ error: '프롬프트가 필요합니다.' })

    try {
        const apiKey = process.env.OPENAI_API_KEY
        const { data } = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: '한국어로 감성적인 노래 가사를 만드는 전문가.' },
                    { role: 'user', content: `한국어로 ${prompt} 주제 감성 가사 4줄 생성.` }
                ],
                max_tokens: 100,
                temperature: 0.9,
            },
            { headers: { Authorization: `Bearer ${apiKey}` } }
        )
        res.json({ lyrics: data.choices[0].message.content.trim() })
    } catch (e) {
        console.error(e)
        res.status(500).json({ error: '가사 생성 실패' })
    }
})

// 멜로디 설명 생성
router.post('/generate-melody', async (req, res) => {
    const { prompt } = req.body
    if (!prompt) return res.status(400).json({ error: '프롬프트가 필요합니다.' })

    try {
        const apiKey = process.env.OPENAI_API_KEY
        const { data } = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: '노래 멜로디와 스타일 설명 전문가.' },
                    { role: 'user', content: `한국어로 ${prompt} 주제 멜로디 설명 5문장.` }
                ],
                max_tokens: 150,
                temperature: 0.8,
            },
            { headers: { Authorization: `Bearer ${apiKey}` } }
        )
        res.json({ melody: data.choices[0].message.content.trim() })
    } catch (e) {
        console.error(e)
        res.status(500).json({ error: '멜로디 생성 실패' })
    }
})

module.exports = router
