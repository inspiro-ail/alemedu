const fs = require('fs');

const realMediaPipeJs = `
        startProctorLoop: function(videoEl, canvasEl) {
            this.isLoopRunning = true;
            this.proctorLogs = [];
            this.cheatViolationCount = 0;

            const ctx = canvasEl.getContext('2d');

            if (window.FaceMesh) {
                if (!this.faceMesh) {
                    this.faceMesh = new window.FaceMesh({
                        locateFile: (file) => \`https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/\${file}\`
                    });
                    this.faceMesh.setOptions({
                        maxNumFaces: 2,
                        refineLandmarks: true,
                        minDetectionConfidence: 0.45,
                        minTrackingConfidence: 0.45
                    });
                    this.faceMesh.onResults((results) => {
                        if (!this.isLoopRunning) return;
                        const w = canvasEl.width;
                        const h = canvasEl.height;

                        if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
                            const features = { yaw: 0, pitch: 0, roll: 0, ear: 0, mar: 0, gazeOffset: 0, blinkVar: 0, faceCount: 0, tension: 0 };
                            this.predictState(features);
                            this.renderOverlay(ctx, w, h, [], features);
                            return;
                        }

                        const faceCount = results.multiFaceLandmarks.length;
                        const landmarks = results.multiFaceLandmarks[0];

                        // Extract real 3D head pose and gaze metrics from key points:
                        const nose = landmarks[1];
                        const leftCheek = landmarks[234];
                        const rightCheek = landmarks[454];
                        const topHead = landmarks[10];
                        const chin = landmarks[152];

                        // Real Yaw (Head turned left/right)
                        const dLeft = Math.abs(nose.x - leftCheek.x);
                        const dRight = Math.abs(nose.x - rightCheek.x);
                        const yaw = (dLeft - dRight) / (dLeft + dRight + 0.001);

                        // Real Pitch (Head tilted up/down)
                        const dTop = Math.abs(nose.y - topHead.y);
                        const dBottom = Math.abs(nose.y - chin.y);
                        const pitch = (dTop - dBottom) / (dTop + dBottom + 0.001);

                        // Real Eye Aspect Ratio (EAR) & Eye Gaze Offset
                        const leftEyeTop = landmarks[159], leftEyeBot = landmarks[145];
                        const leftEyeL = landmarks[33], leftEyeR = landmarks[133];
                        const ear = Math.abs(leftEyeTop.y - leftEyeBot.y) / (Math.abs(leftEyeL.x - leftEyeR.x) + 0.001);

                        // Real Mouth Aspect Ratio (MAR)
                        const mouthTop = landmarks[13], mouthBot = landmarks[14];
                        const mouthL = landmarks[61], mouthR = landmarks[291];
                        const mar = Math.abs(mouthTop.y - mouthBot.y) / (Math.abs(mouthL.x - mouthR.x) + 0.001);

                        // Gaze Offset based on Iris position
                        let gazeOffset = 0;
                        if (landmarks[468]) {
                            const pupilX = landmarks[468].x;
                            const eyeCenterX = (leftEyeL.x + leftEyeR.x) / 2;
                            gazeOffset = Math.abs(pupilX - eyeCenterX) * 8.0;
                        }

                        const features = {
                            yaw: yaw * 2.8,
                            pitch: pitch * 2.4,
                            roll: 0,
                            ear,
                            mar: mar * 1.5,
                            gazeOffset: gazeOffset * 1.5,
                            blinkVar: ear < 0.15 ? 0.8 : 0.1,
                            faceCount,
                            tension: 0.1
                        };

                        this.predictState(features);
                        this.renderOverlay(ctx, w, h, landmarks, features);

                        // Call Python ML backend endpoint on server
                        if (Math.random() < 0.25) {
                            fetch('/api/proctor/ml-softmax', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(features)
                            }).then(r => r.json()).then(res => {
                                if (res && res.softmax) {
                                    this.currentSoftmax = res.softmax;
                                    this.currentStressIndex = res.stress_index || this.currentStressIndex;
                                    this.updateHUD();
                                }
                            }).catch(() => {});
                        }
                    });
                }

                if (window.Camera) {
                    const camera = new window.Camera(videoEl, {
                        onFrame: async () => {
                            if (!this.isLoopRunning) return;
                            if (this.faceMesh) {
                                try { await this.faceMesh.send({ image: videoEl }); } catch(e){}
                            }
                        },
                        width: 320,
                        height: 240
                    });
                    camera.start();
                } else {
                    const processFrameFallback = async () => {
                        if (!this.isLoopRunning) return;
                        if (this.faceMesh && videoEl.readyState >= 2) {
                            try { await this.faceMesh.send({ image: videoEl }); } catch(e){}
                        }
                        this.animFrameId = requestAnimationFrame(processFrameFallback);
                    };
                    processFrameFallback();
                }
            } else {
                // Fallback loop if MediaPipe script is loading
                const processFrameFallback = () => {
                    if (!this.isLoopRunning) return;
                    const w = canvasEl.width;
                    const h = canvasEl.height;
                    const simTime = Date.now() * 0.001;
                    const yaw = Math.sin(simTime * 0.3) * 0.15;
                    const pitch = Math.cos(simTime * 0.2) * 0.1;
                    const features = { yaw, pitch, roll: 0, ear: 0.3, mar: 0.1, gazeOffset: 0.05, blinkVar: 0.1, faceCount: 1, tension: 0.1 };
                    this.predictState(features);
                    this.renderOverlay(ctx, w, h, [], features);
                    this.animFrameId = requestAnimationFrame(processFrameFallback);
                };
                processFrameFallback();
            }
        },`;

function updateAppJs(filePath) {
    let js = fs.readFileSync(filePath, 'utf8');
    const startIdx = js.indexOf('startProctorLoop: function(videoEl, canvasEl) {');
    const endIdx = js.indexOf('stopProctorLoop: function() {', startIdx);

    if (startIdx !== -1 && endIdx !== -1) {
        js = js.substring(0, startIdx) + realMediaPipeJs.trim() + '\n\n        ' + js.substring(endIdx);
        fs.writeFileSync(filePath, js, 'utf8');
        console.log(`Updated real WebCam tracking in ${filePath}!`);
    } else {
        console.error(`Could not locate startProctorLoop in ${filePath}`);
    }
}

updateAppJs('js/app.js');
updateAppJs('js_kz/app.js');
