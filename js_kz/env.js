// ============================================================
// ENV.JS — Centralized API Keys & Config
// Do NOT commit this file to public version control (add to .gitignore)
// ============================================================

// Auto-detect: use local proxy only when running from file:// or localhost
// When hosted on a real domain, we call the APIs directly (no proxy needed)
const isLocal = location.protocol === 'file:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
const LOCAL_PROXY = 'http://localhost:3000/proxy?url=';

const wrapUrl = (url) => isLocal ? LOCAL_PROXY + url : url;

window.ENV = {
    // AlemLLM — Used for AI task generation, exam analytics, etc.
    LLM_API_KEY: 'sk-zdCkdfqoNH3KKTjIkNenhQ',
    IMAGE_API_KEY: 'sk-ksE6w_pWRZeFDpfxkRRQSQ',
    LLM_API_URL: wrapUrl('https://llm.alem.ai/v1/chat/completions'),

    // Google Gemini — Used for OCR / handwriting recognition & grading
    GEMINI_API_KEY: 'AIzaSyBDH-OqX-HMePDbl_H-DnShppdQxCCnRt4',

    // Score API
    SCORE_API_KEY: 'md8HkMaM0h5caToGDN9n5TWXg7e9fY5dTQCpxKd2',
    SCORE_API_URL: wrapUrl('https://reranker-llm.alem.ai/v1/score'),

    // Video Summarization Pipeline
    GOOGLE_DRIVE_API_KEY: 'AIzaSyDR618pi2OtsT_oeSEbA4cX7_9xPVFGmhY',
    CORS_PROXY: isLocal ? LOCAL_PROXY : '',

    ALEM_STT_KEY: 'sk-U_f-0qoMqQo1TEERGjVEMg',
    ALEM_STT_URL: wrapUrl('https://llm.alem.ai/v1/audio/transcriptions'),

    DEEPSEEK_OCR_KEY: 'sk-pA4EgnU_6-vEovEkuZyt8A',
    DEEPSEEK_OCR_URL: wrapUrl('https://llm.alem.ai/v1/chat/completions'),

    // Kazakh specific AI endpoints
    KAZ_LLM_API_KEY: 'sk-TIGit4Rn5qA5WuX_Kknplw',
    KAZ_LLM_API_URL: wrapUrl('https://llm.alem.ai/v1/chat/completions'),
    KAZ_STT_KEY: 'sk-gRXBIx-VbuQkcQGjMe9NnA',
    KAZ_STT_URL: wrapUrl('https://llm.alem.ai/v1/audio/transcriptions')
};

console.log(`[ENV] Mode: ${isLocal ? '🔧 LOCAL (proxy → localhost:3000)' : '🌐 PRODUCTION (direct API calls)'}`);
