const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const https = require('https');

// Helper: forward a POST request server-side using native https module (no fetch needed)
function forwardPost(url, headers, body) {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url);
        const options = {
            hostname: parsed.hostname,
            port: parsed.port || 443,
            path: parsed.pathname + parsed.search,
            method: 'POST',
            headers: { ...headers, 'Content-Length': Buffer.byteLength(body) }
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: data }));
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

const app = express();
app.use(cors());

// Health check — Render pings this to know the server is alive
app.get('/', (req, res) => res.send('AlemEdu Proxy OK'));

// Dedicated Alem image generation endpoint
app.post('/image-gen', async (req, res) => {
    try {
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', async () => {
            try {
                const body = Buffer.concat(chunks).toString();
                const authHeader = req.headers['authorization'] || '';
                const result = await forwardPost(
                    'https://llm.alem.ai/v1/images/generations',
                    { 'Content-Type': 'application/json', 'Authorization': authHeader },
                    body
                );
                console.log(`[image-gen] Status: ${result.status}, Body: ${result.body}`);
                res.status(result.status).set('Content-Type', 'application/json').send(result.body);
            } catch (e) {
                console.error('[image-gen] Inner error:', e.message);
                res.status(500).json({ error: e.message });
            }
        });
    } catch (e) {
        console.error('[image-gen] Error:', e.message);
        res.status(500).json({ error: e.message });
    }
});

// OpenAI DALL-E image generation endpoint removed as we use Alem AI exclusively.

app.use('/proxy', createProxyMiddleware({
    router: (req) => {
        const targetUrl = new URL(req.query.url);
        return `${targetUrl.protocol}//${targetUrl.host}`;
    },
    changeOrigin: true,
    pathRewrite: (path, req) => {
        const targetUrl = new URL(req.query.url);
        return targetUrl.pathname + targetUrl.search;
    },
    onProxyReq: (proxyReq, req) => {
        console.log(`[Proxy] → ${req.query.url}`);
    },
    onError: (err, req, res) => {
        console.error('Proxy Error:', err.message);
        if (!res.headersSent) res.status(500).send('Proxy Error: ' + err.message);
    }
}));

// Use PORT env variable for cloud hosting (Render, Railway, etc.) or fallback to 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`[AlemEdu Proxy] Running on port ${PORT}`);
});

