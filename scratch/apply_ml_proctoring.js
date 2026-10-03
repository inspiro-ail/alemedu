const fs = require('fs');

// --- 1. MEDIA PIPE CDN SCRIPTS FOR HEAD ---
const mediaPipeCdn = `    <!-- MediaPipe 3D FaceMesh ML Engine -->
    <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js" crossorigin="anonymous"></script>
`;

// --- 2. PROCTORING HUD HTML (RU) ---
const proctoringHudRu = `                        <!-- AI ML Proctoring HUD Floating Wrapper -->
                        <div id="camera-feed-wrapper"
                            style="position:absolute; top:80px; right:24px; z-index:100; border-radius:16px; overflow:hidden; border:2px solid rgba(139,92,246,0.6); background:rgba(15,23,42,0.95); box-shadow:0 12px 36px rgba(0,0,0,0.6); width:240px; display:flex; flex-direction:column;">
                            
                            <!-- Video Feed & Mesh Overlay Container -->
                            <div style="position:relative; width:100%; height:150px; background:#000;">
                                <video id="proctor-video" autoplay muted playsinline
                                    style="width:100%; height:100%; object-fit:cover; display:block; transform: scaleX(-1);"></video>
                                <canvas id="proctor-mesh-canvas" width="240" height="150"
                                    style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none;"></canvas>

                                <!-- Live Badge -->
                                <div style="position:absolute; top:8px; left:8px; display:flex; align-items:center; gap:6px; background:rgba(0,0,0,0.6); padding:3px 8px; border-radius:12px; backdrop-filter:blur(4px); border:1px solid rgba(255,255,255,0.1);">
                                    <div class="live-dot" style="width:8px; height:8px; background:#ef4444; border-radius:50%; box-shadow:0 0 8px #ef4444;"></div>
                                    <span style="font-size:0.65rem; font-weight:800; color:white; letter-spacing:0.05em;">AI ML LIVE</span>
                                </div>

                                <!-- Cheat Risk Badge -->
                                <div id="ml-proctor-risk-badge" style="position:absolute; bottom:8px; left:8px; font-size:0.68rem; font-weight:700; padding:3px 8px; border-radius:8px; background:rgba(16,185,129,0.85); color:white; box-shadow:0 2px 6px rgba(0,0,0,0.4);">
                                    🟢 Внимателен (0% рисков)
                                </div>
                                <canvas id="snapshot-canvas" style="display:none;"></canvas>
                            </div>

                            <!-- Softmax Probabilities HUD -->
                            <div style="padding:10px 12px; display:flex; flex-direction:column; gap:6px; background:rgba(0,0,0,0.4); border-top:1px solid rgba(255,255,255,0.08);">
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
                                    <span style="font-size:0.68rem; color:#a78bfa; font-weight:700;">🧠 Softmax Classification:</span>
                                    <span style="font-size:0.65rem; color:#64748b;" id="ml-fps-counter">30 FPS</span>
                                </div>

                                <!-- 1. Focused Probability -->
                                <div>
                                    <div style="display:flex; justify-content:space-between; font-size:0.65rem; color:#cbd5e1; margin-bottom:2px;">
                                        <span>🎯 Внимателен (Focused):</span>
                                        <b id="softmax-prob-focused" style="color:#10b981;">95%</b>
                                    </div>
                                    <div style="width:100%; height:4px; background:rgba(255,255,255,0.1); border-radius:2px; overflow:hidden;">
                                        <div id="softmax-bar-focused" style="width:95%; height:100%; background:#10b981; transition:width 0.2s;"></div>
                                    </div>
                                </div>

                                <!-- 2. Cheating Probability -->
                                <div>
                                    <div style="display:flex; justify-content:space-between; font-size:0.65rem; color:#cbd5e1; margin-bottom:2px;">
                                        <span>👀 Списывание (Looking Away):</span>
                                        <b id="softmax-prob-cheating" style="color:#f59e0b;">3%</b>
                                    </div>
                                    <div style="width:100%; height:4px; background:rgba(255,255,255,0.1); border-radius:2px; overflow:hidden;">
                                        <div id="softmax-bar-cheating" style="width:3%; height:100%; background:#f59e0b; transition:width 0.2s;"></div>
                                    </div>
                                </div>

                                <!-- 3. Stressed Probability -->
                                <div>
                                    <div style="display:flex; justify-content:space-between; font-size:0.65rem; color:#cbd5e1; margin-bottom:2px;">
                                        <span>😰 Стресс / Волнение (Stress):</span>
                                        <b id="softmax-prob-stressed" style="color:#a78bfa;">2%</b>
                                    </div>
                                    <div style="width:100%; height:4px; background:rgba(255,255,255,0.1); border-radius:2px; overflow:hidden;">
                                        <div id="softmax-bar-stressed" style="width:2%; height:100%; background:#a78bfa; transition:width 0.2s;"></div>
                                    </div>
                                </div>

                                <!-- Live Stress Index Meter -->
                                <div style="margin-top:4px; padding-top:6px; border-top:1px solid rgba(255,255,255,0.05);">
                                    <div style="display:flex; justify-content:space-between; font-size:0.68rem; font-weight:700; color:#e2e8f0; margin-bottom:3px;">
                                        <span>📈 Индекс стресса лица:</span>
                                        <b id="ml-stress-meter-val" style="color:#10b981;">18% (Норма)</b>
                                    </div>
                                    <div style="width:100%; height:6px; background:rgba(255,255,255,0.1); border-radius:3px; overflow:hidden;">
                                        <div id="ml-stress-meter-bar" style="width:18%; height:100%; background:linear-gradient(90deg, #10b981, #f59e0b); transition:width 0.3s;"></div>
                                    </div>
                                </div>
                            </div>
                        </div>`;

// --- 3. PROCTORING HUD HTML (KZ) ---
const proctoringHudKz = proctoringHudRu
    .replace('🟢 Внимателен (0% рисков)', '🟢 Зейінді (0% қауіп)')
    .replace('🎯 Внимателен (Focused):', '🎯 Зейінді (Focused):')
    .replace('👀 Списывание (Looking Away):', '👀 Сығалау (Looking Away):')
    .replace('😰 Стресс / Волнение (Stress):', '😰 Стресс / Толқу (Stress):')
    .replace('📈 Индекс стресса лица:', '📈 Бет стресс индексі:')
    .replace('18% (Норма)', '18% (Қалыпты)');

// --- 4. TEACHER RESULT REPORT SECTION ---
const teacherReportHtmlRu = `
                                 <!-- ML Softmax Proctoring Report Container -->
                                 <div id="exam-proctoring-ml-report" style="margin-top:24px; padding:20px; background:rgba(15,23,42,0.9); border:1px solid rgba(139,92,246,0.3); border-radius:16px; display:none;">
                                     <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;">
                                         <div style="display:flex; align-items:center; gap:10px;">
                                             <span style="font-size:1.4rem;">🧠</span>
                                             <div>
                                                 <h4 style="color:#white; margin:0; font-size:1.05rem;">ИИ ML Softmax Прокторинг Отчет</h4>
                                                 <div style="font-size:0.75rem; color:#a78bfa;">Анализ 468 точек лица, Softmax-вероятностей и уровня стресса</div>
                                             </div>
                                         </div>
                                         <span style="font-size:0.75rem; padding:4px 10px; border-radius:20px; background:rgba(139,92,246,0.2); color:#c084fc; border:1px solid rgba(139,92,246,0.4);">MediaPipe FaceMesh</span>
                                     </div>
                                     <div id="exam-proctoring-ml-content"></div>
                                 </div>`;

const teacherReportHtmlKz = teacherReportHtmlRu
    .replace('ИИ ML Softmax Прокторинг Отчет', 'ИИ ML Softmax Прокторинг Есебі')
    .replace('Анализ 468 точек лица, Softmax-вероятностей и уровня стресса', '468 бет нүктелерін, Softmax ықтималдықтарын және стресс деңгейін талдау');

// Apply to index.html
let indexHtml = fs.readFileSync('index.html', 'utf8');
if (!indexHtml.includes('face_mesh.js')) {
    indexHtml = indexHtml.replace('</head>', mediaPipeCdn + '</head>');
}
// Replace camera-feed-wrapper
const camStartRu = indexHtml.indexOf('<div id="camera-feed-wrapper"');
if (camStartRu !== -1) {
    const camEndRu = indexHtml.indexOf('</div>', camStartRu) + 6;
    // Find nested closing div correctly
    let depth = 0;
    let finalEnd = -1;
    for (let i = camStartRu; i < indexHtml.length; i++) {
        if (indexHtml.substr(i, 4) === '<div') depth++;
        if (indexHtml.substr(i, 6) === '</div>') {
            depth--;
            if (depth === 0) {
                finalEnd = i + 6;
                break;
            }
        }
    }
    if (finalEnd !== -1) {
        indexHtml = indexHtml.substring(0, camStartRu) + proctoringHudRu + indexHtml.substring(finalEnd);
    }
}
// Add teacher proctoring report section
if (!indexHtml.includes('id="exam-proctoring-ml-report"')) {
    indexHtml = indexHtml.replace(
        '<div id="exam-analytics-table-container"',
        teacherReportHtmlRu + '\n                                <div id="exam-analytics-table-container"'
    );
}
fs.writeFileSync('index.html', indexHtml, 'utf8');
console.log('Updated index.html with ML Proctoring HUD & CDN!');

// Apply to index_kz.html
let indexKzHtml = fs.readFileSync('index_kz.html', 'utf8');
if (!indexKzHtml.includes('face_mesh.js')) {
    indexKzHtml = indexKzHtml.replace('</head>', mediaPipeCdn + '</head>');
}
const camStartKz = indexKzHtml.indexOf('<div id="camera-feed-wrapper"');
if (camStartKz !== -1) {
    let depth = 0;
    let finalEnd = -1;
    for (let i = camStartKz; i < indexKzHtml.length; i++) {
        if (indexKzHtml.substr(i, 4) === '<div') depth++;
        if (indexKzHtml.substr(i, 6) === '</div>') {
            depth--;
            if (depth === 0) {
                finalEnd = i + 6;
                break;
            }
        }
    }
    if (finalEnd !== -1) {
        indexKzHtml = indexKzHtml.substring(0, camStartKz) + proctoringHudKz + indexKzHtml.substring(finalEnd);
    }
}
if (!indexKzHtml.includes('id="exam-proctoring-ml-report"')) {
    indexKzHtml = indexKzHtml.replace(
        '<div id="exam-analytics-table-container"',
        teacherReportHtmlKz + '\n                                <div id="exam-analytics-table-container"'
    );
}
fs.writeFileSync('index_kz.html', indexKzHtml, 'utf8');
console.log('Updated index_kz.html with ML Proctoring HUD & CDN!');
