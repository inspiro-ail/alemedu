// ============================================================
// Video-to-Summary Pipeline
// ============================================================

window.VideoPipeline = {
    // Pipeline state
    isRunning: false,

    // 1. Extract File ID from Google Drive URL
    extractDriveFileId(url) {
        try {
            const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
            if (match && match[1]) return match[1];
            const urlObj = new URL(url);
            return urlObj.searchParams.get('id');
        } catch (e) {
            console.error("Invalid URL format:", e);
            return null;
        }
    },

    // Check optimization
    async checkLessonExists(fileId) {
        try {
            const snapshot = await window.fireDB.collection('lessons').where('fileId', '==', fileId).get();
            if (!snapshot.empty) {
                // Return the existing one
                return snapshot.docs[0].data();
            }
            return null;
        } catch (e) {
            console.error("Error checking Firestore:", e);
            return null;
        }
    },

    // Source access - Build download URL
    getDownloadUrl(fileId) {
        return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${window.ENV.GOOGLE_DRIVE_API_KEY}`;
    },

    // Pipeline entry point
    async runPipeline(videoUrl, title, subject, onProgress) {
        if (this.isRunning) {
            throw new Error("Pipeline is already running!");
        }
        this.isRunning = true;

        try {
            const fileId = this.extractDriveFileId(videoUrl);
            if (!fileId) throw new Error("Could not extract Google Drive file ID. Make sure it's a valid link.");

            onProgress("Проверка кэша уроков...");
            const existingLesson = await this.checkLessonExists(fileId);
            if (existingLesson) {
                onProgress("Урок найден в базе! Загрузка кэшированной версии...");
                return existingLesson; // returning directly
            }

            const downloadUrl = this.getDownloadUrl(fileId);
            
            // 1. Fetch the video as Blob for STT
            onProgress("Скачивание видео/аудио для распознавания речи...");
            let videoBlob;
            try {
                const response = await fetch(downloadUrl);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                videoBlob = await response.blob();
            } catch (fetchError) {
                console.error("Fetch error, could be CORS.", fetchError);
                throw new Error("Не удалось скачать видео. Возможно, проблема с CORS или доступом по ссылке.");
            }
            
            console.log(`[VideoPipeline] Downloaded video blob: type=${videoBlob.type}, size=${videoBlob.size} bytes`);
            if (videoBlob.size < 100000) {
                console.warn("[VideoPipeline] Warning: Video blob is unusually small. It might be an HTML error page (like a Google Drive virus scan warning) instead of the actual media file!");
            }

            // 2. Process Audio (Alem STT)
            onProgress("Извлечение аудио из видео (это может занять минуту)...");
            const transcriptionText = await this.processAudioSTT(videoBlob);
            
            // 3. Intelligence & Synthesis (Alem LLM)
            onProgress("Генерация структурированного конспекта ИИ...");
            const summaryText = await this.synthesizeSummary(transcriptionText);

            // 5. Persistence (Firestore)
            onProgress("Сохранение результатов...");
            const currentUser = window.fireAuth.currentUser;
            const tid = currentUser ? currentUser.uid : "unknown_teacher";
            const newDoc = {
                // CamelCase matching prompt
                fileId: fileId,
                videoUrl: videoUrl,
                summaryText: summaryText,
                createdAt: new Date().toISOString(),
                teacherId: tid,
                // Additional fields
                transcription: transcriptionText,
                title: title,
                subject: subject,
                // Legacy snake_case for UI compatibility
                teacher_id: tid,
                video_url: videoUrl,
                created_at: firebase.firestore.FieldValue.serverTimestamp()
            };

            await window.fireDB.collection('lessons').add(newDoc);
            return newDoc;

        } catch (e) {
            console.error("Pipeline failed:", e);
            throw e;
        } finally {
            this.isRunning = false;
        }
    },

    async processVisuals(fileId) {
        try {
            console.log(`[processVisuals] Starting visual generation for fileId: ${fileId}`);
            const snapshot = await window.fireDB.collection('lessons').where('fileId', '==', fileId).get();
            if (snapshot.empty) throw new Error("Lesson not found");
            const doc = snapshot.docs[0];
            const summaryText = doc.data().summaryText;
            
            if (!summaryText) throw new Error("No summaryText available to generate visuals");

            const systemPrompt = `Act as an Educational Content Designer. Scan the provided summary for any: 1. Processes/Cycles, 2. Statistical data/Trends, 3. Complex terminology. For each found element, generate a highly detailed English image prompt for an AI Image Generator. Constraint: The prompts must request a clean, modern vector style on a white background with NO TEXT OR LABELS inside the image.

Output MUST be a valid JSON array of objects, with each object having properties: "type" (string, e.g. "Process", "Trend", "Terminology"), "concept" (string, the name of the concept), "prompt" (string, the detailed image prompt). Send ONLY the array.`;

            const response = await fetch(window.ENV.LLM_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.ENV.LLM_API_KEY}`
                },
                body: JSON.stringify({
                    model: "alemllm",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: summaryText }
                    ],
                    temperature: 0.3
                })
            });

            if (!response.ok) throw new Error(`LLM Error: ${response.status} ${response.statusText}`);
            const data = await response.json();
            
            let jsonString = data.choices[0].message.content;
            
            // Try to parse the JSON response
            const match = jsonString.match(/\[[\s\S]*\]/);
            const items = JSON.parse(match ? match[0] : "[]");
            
            if (!Array.isArray(items) || items.length === 0) {
                console.log("[processVisuals] No concepts found by LLM or failed to parse JSON.");
                return;
            }

            const visualAssets = [];
            for (let item of items) {
                if (!item.prompt || !item.concept) continue;
                console.log(`[processVisuals] Generating image for concept: ${item.concept}`);
                try {
                    // Use dedicated /image-gen proxy when running locally (avoids CORS issues)
                    const imageGenUrl = (window.location.protocol === 'file:')
                        ? 'http://localhost:3000/image-gen'
                        : '/image-gen';

                    const imgRes = await fetch(imageGenUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${window.ENV.IMAGE_API_KEY}`
                        },
                        body: JSON.stringify({
                            model: "text-to-image",
                            prompt: item.prompt,
                            n: 1,
                            size: "1024x1024"
                        })
                    });
                    
                    if (imgRes.ok) {
                        const imgData = await imgRes.json();
                        let imgUrl = "";
                        if (imgData.data && imgData.data[0]) {
                            if (imgData.data[0].url) {
                                imgUrl = imgData.data[0].url;
                            } else if (imgData.data[0].b64_json) {
                                imgUrl = `data:image/png;base64,${imgData.data[0].b64_json}`;
                            }
                        }

                        if (imgUrl) {
                            visualAssets.push({
                                type: item.type || 'Concept',
                                concept: item.concept,
                                imageUrl: imgUrl
                            });
                        }
                    } else {
                        console.error(`[processVisuals] Image API error for ${item.concept}`, await imgRes.text());
                    }
                } catch(imgErr) {
                    console.error(`[processVisuals] Failed to fetch image for ${item.concept}:`, imgErr);
                }
            }

            if (visualAssets.length > 0) {
                // Keep any existing ones just in case? No, overwrite with new generation
                await doc.ref.update({ visualAssets: visualAssets });
                console.log(`[processVisuals] Successfully saved ${visualAssets.length} visuals to Firestore.`);
            }

        } catch (e) {
            console.error("[processVisuals] Error:", e);
        }
    },

    // Extract audio from video blob using AudioContext, downsample to 16kHz mono WAV
    async extractAudioAsWav(videoBlob) {
        console.log(`[VideoPipeline] Extracting audio from ${(videoBlob.size / 1024 / 1024).toFixed(1)}MB video...`);
        
        const arrayBuffer = await videoBlob.arrayBuffer();
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
        
        // Decode the video's audio track
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        await audioCtx.close();
        
        // Mix down to mono at 16kHz
        const sampleRate = audioBuffer.sampleRate;
        const numberOfChannels = audioBuffer.numberOfChannels;
        const length = audioBuffer.length;
        const monoData = new Float32Array(length);
        
        for (let ch = 0; ch < numberOfChannels; ch++) {
            const channelData = audioBuffer.getChannelData(ch);
            for (let i = 0; i < length; i++) {
                monoData[i] += channelData[i] / numberOfChannels;
            }
        }

        // Encode as 16-bit PCM WAV
        const wavBuffer = this.encodeWAV(monoData, sampleRate);
        const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
        console.log(`[VideoPipeline] Extracted audio WAV: ${(wavBlob.size / 1024).toFixed(1)}KB`);
        return wavBlob;
    },

    // Encode Float32 PCM audio as WAV ArrayBuffer
    encodeWAV(samples, sampleRate) {
        const buffer = new ArrayBuffer(44 + samples.length * 2);
        const view = new DataView(buffer);
        const writeString = (offset, str) => { for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)); };
        
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + samples.length * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);        // Subchunk1Size (PCM)
        view.setUint16(20, 1, true);          // AudioFormat (PCM = 1)
        view.setUint16(22, 1, true);          // NumChannels (Mono)
        view.setUint32(24, sampleRate, true); // SampleRate
        view.setUint32(28, sampleRate * 2, true); // ByteRate
        view.setUint16(32, 2, true);          // BlockAlign
        view.setUint16(34, 16, true);         // BitsPerSample
        writeString(36, 'data');
        view.setUint32(40, samples.length * 2, true);
        
        // Convert float32 samples to int16
        let offset = 44;
        for (let i = 0; i < samples.length; i++) {
            const s = Math.max(-1, Math.min(1, samples[i]));
            view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
            offset += 2;
        }
        return buffer;
    },

    async processAudioSTT(videoBlob) {
        // Extract just the audio track as a small WAV (typically 5-30MB vs 400MB+ video)
        const wavBlob = await this.extractAudioAsWav(videoBlob);

        const formData = new FormData();
        formData.append("model", "speech-to-text");
        formData.append("file", wavBlob, "audio.wav");
        formData.append("language", "ru");

        const response = await fetch(window.ENV.ALEM_STT_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${window.ENV.ALEM_STT_KEY}`
            },
            body: formData
        });

        if (!response.ok) {
            let errorDetails = response.statusText;
            try {
                const errJson = await response.json();
                errorDetails += ` — ${JSON.stringify(errJson)}`;
            } catch(e) {
                try { errorDetails += ` — ${await response.text()}`; } catch(e2) {}
            }
            throw new Error(`STT API Error: ${errorDetails}`);
        }
        
        const data = await response.json();
        return data.text || "Нет распознанной речи.";
    },


    async synthesizeSummary(transcriptionText) {
        const systemPrompt = `You are a professional teaching assistant in Kazakhstan. Based on the provided speech transcript, create a comprehensive, structured lesson summary in Russian. Use headings, bullet points, and highlight key definitions.`;
        
        const userInput = `--- Speech Transcript ---\n${transcriptionText}`;

        // Use LLM_API_KEY for synthesis (ALEM_STT_KEY is restricted to speech-to-text only)
        const response = await fetch(window.ENV.LLM_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.ENV.LLM_API_KEY}`
            },
            body: JSON.stringify({
                model: "alemllm",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userInput }
                ],
                temperature: 0.3
            })
        });

        if (!response.ok) {
            let errorDetails = response.statusText;
            try {
                const errJson = await response.json();
                errorDetails += ` — ${JSON.stringify(errJson)}`;
            } catch(e) {}
            throw new Error(`LLM Error: ${errorDetails}`);
        }

        const data = await response.json();
        if (data.choices && data.choices[0] && data.choices[0].message) {
            return data.choices[0].message.content;
        }
        return "Не удалось сгенерировать конспект.";
    }
};
