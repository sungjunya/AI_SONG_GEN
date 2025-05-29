require('dotenv').config();
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Hugging Face: 가사 생성 (gpt2)
const generateHFLyrics = async (prompt) => {
    const url = 'https://api-inference.huggingface.co/models/gpt2';
    const headers = {
        Authorization: `Bearer ${process.env.HF_API_TOKEN}`,
        'Content-Type': 'application/json',
    };
    const data = {
        inputs: prompt,
        parameters: { max_length: 100, num_return_sequences: 1, temperature: 0.9 },
    };

    try {
        const response = await axios.post(url, data, { headers });
        return response.data[0].generated_text;
    } catch (error) {
        throw new Error(`Hugging Face 가사 생성 에러: ${error.response ? error.response.data : error.message}`);
    }
};

// Hugging Face: 음악 생성 (facebook/musicgen-large)
const generateHFMusic = async (prompt, outputPath) => {
    const url = 'https://api-inference.huggingface.co/models/facebook/musicgen-large';
    const headers = {
        Authorization: `Bearer ${process.env.HF_API_TOKEN}`,
        'Content-Type': 'application/json',
    };
    const data = {
        inputs: prompt,
        parameters: { max_new_tokens: 256, do_sample: true, temperature: 0.7 },
    };

    try {
        const response = await axios.post(url, data, { headers, responseType: 'arraybuffer' });
        fs.writeFileSync(outputPath, response.data);
        return outputPath;
    } catch (error) {
        throw new Error(`Hugging Face 음악 생성 에러: ${error.response ? error.response.data : error.message}`);
    }
};

// Clarifai: 가사 생성 (meta-llama-2-7b-chat)
const generateClarifaiLyrics = async (prompt) => {
    const modelId = 'meta-llama-2-7b-chat'; // Clarifai의 텍스트 생성 모델 ID
    const url = `https://api.clarifai.com/v2/models/${modelId}/outputs`;
    const headers = {
        Authorization: `Key ${process.env.CLARIFAI_API_KEY}`,
        'Content-Type': 'application/json',
    };
    const data = {
        inputs: [
            {
                data: {
                    text: {
                        raw: prompt,
                    },
                },
            },
        ],
    };

    try {
        const response = await axios.post(url, data, { headers });
        return response.data.outputs[0].data.text.raw;
    } catch (error) {
        throw new Error(`Clarifai 가사 생성 에러: ${error.response ? error.response.data : error.message}`);
    }
};

// API 엔드포인트: 가사 생성
app.post('/generate-lyrics', async (req, res) => {
    const { prompt, provider = 'clarifai' } = req.body; // 기본적으로 Clarifai 사용
    if (!prompt) {
        return res.status(400).json({ error: '프롬프트가 필요합니다.' });
    }

    try {
        let lyrics;
        if (provider === 'huggingface') {
            lyrics = await generateHFLyrics(prompt);
        } else {
            lyrics = await generateClarifaiLyrics(prompt);
        }
        res.json({ lyrics });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API 엔드포인트: 음악 생성
app.post('/generate-music', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: '프롬프트가 필요합니다.' });
    }

    try {
        const outputPath = path.join(__dirname, 'public', 'output.wav');
        await generateHFMusic(prompt, outputPath);
        res.json({ message: '음악 생성 완료', path: '/output.wav' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API 엔드포인트: 오디오 파일 제공
app.get('/audio', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'output.wav');
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).json({ error: '오디오 파일이 없습니다.' });
    }
});

// 서버 시작
const PORT = 3000;
app.listen(PORT, () => console.log(`서버 실행 중: http://localhost:${PORT}`));