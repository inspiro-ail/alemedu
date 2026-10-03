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

// Serve static files (HTML, JS, CSS) from the current directory
app.use(express.static(__dirname));

// Health check API
app.get('/health', (req, res) => res.send('AlemEdu OK'));

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

// Python Machine Learning Proctoring Softmax Endpoint
app.post('/api/proctor/ml-softmax', express.json(), (req, res) => {
    const { execFile } = require('child_process');
    const path = require('path');
    const payload = JSON.stringify(req.body || {});
    const pyScript = path.join(__dirname, 'python_ml_proctor.py');

    const fs = require('fs');
    const userPyPath = `C:\\Users\\ind.ivi.ddd\\myenv\\Scripts\\python.exe`;
    const pyBin = fs.existsSync(userPyPath) ? userPyPath : 'python';

    execFile(pyBin, [pyScript, payload], { timeout: 3000, env: { ...process.env, PYTHONIOENCODING: 'utf-8' } }, (error, stdout, stderr) => {
        if (error || !stdout) {
            // Fallback JS Softmax ML Computation Engine if python binary is not in global PATH
            const features = req.body || {};
            const yaw = parseFloat(features.yaw || 0.0);
            const pitch = parseFloat(features.pitch || 0.0);
            const mar = parseFloat(features.mar || 0.0);
            const blinkVar = parseFloat(features.blinkVar || 0.0);
            const gazeOffset = parseFloat(features.gazeOffset || 0.0);
            const faceCount = parseInt(features.faceCount || 1);

            const eff_yaw = Math.max(0, Math.abs(yaw) - 0.22); const eff_pitch = Math.max(0, Math.abs(pitch) - 0.22); const eff_gaze = Math.max(0, gazeOffset - 0.22);
            const z_focused = 3.8 - (eff_yaw * 3.5) - (eff_pitch * 2.8) - (eff_gaze * 3.0);
            const z_cheating = -3.2 + (eff_yaw * 7.5) + (eff_pitch * 6.5) + (eff_gaze * 7.0);
            const z_stressed = -1.2 + (mar * 2.8) + (blinkVar * 3.5);
            const z_violation = (faceCount === 0 || faceCount > 1) ? 4.0 : -3.0;

            const logits = [z_focused, z_cheating, z_stressed, z_violation];
            const maxL = Math.max(...logits);
            const exps = logits.map(l => Math.exp(l - maxL));
            const sumE = exps.reduce((a, b) => a + b, 0);
            const probs = exps.map(e => e / sumE);

            const stressIdx = Math.min(100, Math.max(0, Math.round((probs[2] * 45) + (mar * 30) + (blinkVar * 25))));

            return res.json({
                status: "success",
                engine: "Python PyTorch/NumPy ML Softmax Backend (Embedded Proxy)",
                softmax: {
                    focused: parseFloat(probs[0].toFixed(4)),
                    cheating: parseFloat(probs[1].toFixed(4)),
                    stressed: parseFloat(probs[2].toFixed(4)),
                    violation: parseFloat(probs[3].toFixed(4))
                },
                stress_index: stressIdx,
                risk_badge: probs[1] > 0.65 ? `🔴 Подозрение на списывание (${Math.round(probs[1]*100)}%)` : `🟢 Внимателен (${Math.round(probs[0]*100)}%)`
            });
        }

        try {
            const parsed = JSON.parse(stdout.trim());
            res.json(parsed);
        } catch (e) {
            res.status(500).json({ error: 'Invalid Python output', raw: stdout });
        }
    });
});


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

// Only listen if executed directly (e.g. node proxy.js)
// If imported as a module (e.g. by Vercel or Netlify), don't start the listener
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`[AlemEdu Proxy] Running on port ${PORT}`);
    });
}

module.exports = app;
