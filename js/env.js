// ============================================================
// ENV.JS — Centralized API Keys & Config
// Do NOT commit this file to public version control (add to .gitignore)
// ============================================================

// Auto-detect environment: if opened via file://, use localhost:3000 as backend.
// Otherwise (Vercel, Railway, Render), use the relative path so it hits the deployed proxy.js
const isFileProtocol = location.protocol === 'file:';
const PROXY_BASE = isFileProtocol ? 'http://localhost:3000' : '';
const PROXY_URL = PROXY_BASE + '/proxy?url=';

const wrapUrl = (url) => PROXY_URL + url;

window.ENV = {
    // AlemLLM — Used for AI task generation, exam analytics, etc.
    LLM_API_KEY: 'sk-zdCkdfqoNH3KKTjIkNenhQ',
    KAZLLM_API_KEY: 'sk-TIGit4Rn5qA5WuX_Kknplw',
    IMAGE_API_KEY: 'sk-ksE6w_pWRZeFDpfxkRRQSQ',
    LLM_API_URL: wrapUrl('https://llm.alem.ai/v1/chat/completions'),

    // Google Gemini — Used for OCR / handwriting recognition & grading
    GEMINI_API_KEY: 'AIzaSyBDH-OqX-HMePDbl_H-DnShppdQxCCnRt4',

    // Score API
    SCORE_API_KEY: 'md8HkMaM0h5caToGDN9n5TWXg7e9fY5dTQCpxKd2',
    SCORE_API_URL: wrapUrl('https://reranker-llm.alem.ai/v1/score'),

    // Video Summarization Pipeline
    GOOGLE_DRIVE_API_KEY: 'AIzaSyDR618pi2OtsT_oeSEbA4cX7_9xPVFGmhY',
    CORS_PROXY: isFileProtocol ? 'http://localhost:3000' : '',

    ALEM_STT_KEY: 'sk-U_f-0qoMqQo1TEERGjVEMg',
    ALEM_STT_URL: wrapUrl('https://llm.alem.ai/v1/audio/transcriptions'),

    DEEPSEEK_OCR_KEY: 'sk-pA4EgnU_6-vEovEkuZyt8A',
    DEEPSEEK_OCR_URL: wrapUrl('https://llm.alem.ai/v1/chat/completions')
};

// Global Smart Fetch with Proxy Fallback
window.fetchApi = async function(url, options) {
    try {
        return await fetch(url, options);
    } catch (err) {
        if (typeof url === 'string' && url.includes('localhost:3000/proxy?url=')) {
            const directUrl = url.replace(/^http:\/\/localhost:3000\/proxy\?url=/, '');
            console.warn(`[Proxy Fallback] Local proxy unreachable, trying direct URL: ${directUrl}`);
            return await fetch(directUrl, options);
        }
        throw err;
    }
};

console.log(`[ENV] Mode: ${isFileProtocol ? '🔧 LOCAL (proxy → localhost:3000)' : '🌐 PRODUCTION (direct API calls via relative path)'}`);

