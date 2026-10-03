const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
const appJsPath = path.join(__dirname, '..', 'js', 'app.js');

let indexContent = fs.readFileSync(indexPath, 'utf8');

// 1. Add Teacher Nav Button
const teacherNavTarget = `<button class="nav-btn" data-view="t-view-wheel" style="background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.2); margin-top: 8px; color: #fbbf24;">🎡 Колесо удачи</button>`;
const teacherNavBtn = `<button class="nav-btn" data-view="t-view-wheel" style="background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.2); margin-top: 8px; color: #fbbf24;">🎡 Колесо удачи</button>
                    <button class="nav-btn" data-view="t-view-presentations" style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.2); margin-top: 8px; color: #c084fc;">📊 ИИ Презентации</button>`;

if (indexContent.includes(teacherNavTarget)) {
    indexContent = indexContent.replace(teacherNavTarget, teacherNavBtn);
}

// 2. Add Student Nav Button
const studentNavTarget = `<button class="nav-btn" data-view="s-view-calendar">📅 Календарь</button>`;
const studentNavBtn = `<button class="nav-btn" data-view="s-view-calendar">📅 Календарь</button>
                    <button class="nav-btn" data-view="s-view-presentations">📊 Презентации</button>`;

if (indexContent.includes(studentNavTarget)) {
    indexContent = indexContent.replace(studentNavTarget, studentNavBtn);
}

// 3. Add Teacher View (t-view-presentations)
const tViewWheelEnd = `</div> <!-- End of t-view-wheel -->`;
const tViewPresentations = `</div> <!-- End of t-view-wheel -->

                    <!-- View: Presentations (Teacher) -->
                    <div id="t-view-presentations" class="teacher-subview" style="display: none; width: 100%; padding: 30px; overflow-y: auto;">
                        <div style="max-width: 1200px; margin: 0 auto; width: 100%;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:16px;">
                                <div>
                                    <h2 style="font-size:1.8rem; font-weight:700; background:linear-gradient(135deg,#c084fc,#38bdf8); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; margin:0;">📊 Конструктор Презентаций ИИ</h2>
                                    <p style="color:#94a3b8; font-size:0.85rem; margin-top:4px;">Генерируйте интерактивные слайды с формулами, кодом и тестами за секунды</p>
                                </div>
                                <button onclick="window.openPresentationEditor('new')" style="padding:10px 20px; background:linear-gradient(135deg,#10b981,#059669); color:white; border:none; border-radius:12px; font-weight:700; font-size:0.88rem; cursor:pointer; display:flex; align-items:center; gap:8px; box-shadow:0 4px 15px rgba(16,185,129,0.3);">
                                    ➕ Создать вручную
                                </button>
                            </div>

                            <!-- AI Generator Panel -->
                            <div style="background:rgba(15,23,42,0.8); border:1px solid rgba(139,92,246,0.35); border-radius:20px; padding:24px; margin-bottom:30px; box-shadow:0 10px 30px rgba(0,0,0,0.3);">
                                <h3 style="color:white; font-size:1.15rem; margin:0 0 16px 0; display:flex; align-items:center; gap:8px;">
                                    <span>✨</span> Генератор Презентаций AlemEdu AI
                                </h3>
                                <div style="display:grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr; gap:14px; margin-bottom:18px;">
                                    <div>
                                        <label style="font-size:0.78rem; color:#94a3b8; display:block; margin-bottom:6px;">Тема урока / Презентации:</label>
                                        <input type="text" id="pres-ai-topic" placeholder="Например: Законы Ньютона и механика" style="width:100%; padding:10px 14px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.15); border-radius:10px; color:white; font-size:0.88rem; outline:none;">
                                    </div>
                                    <div>
                                        <label style="font-size:0.78rem; color:#94a3b8; display:block; margin-bottom:6px;">Предмет:</label>
                                        <select id="pres-ai-subject" style="width:100%; padding:10px 12px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.15); border-radius:10px; color:white; font-size:0.85rem; outline:none;">
                                            <option value="Физика">⚛️ Физика</option>
                                            <option value="Информатика">🐍 Информатика</option>
                                            <option value="Естествознание">🌿 Естествознание</option>
                                            <option value="Математика">📐 Математика</option>
                                            <option value="История Казахстана">🇰🇿 История Казахстана</option>
                                            <option value="Самопознание">🧘 Самопознание</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style="font-size:0.78rem; color:#94a3b8; display:block; margin-bottom:6px;">Класс:</label>
                                        <select id="pres-ai-grade" style="width:100%; padding:10px 12px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.15); border-radius:10px; color:white; font-size:0.85rem; outline:none;">
                                            <option value="7 класс">7 класс</option>
                                            <option value="8 класс">8 класс</option>
                                            <option value="9 класс">9 класс</option>
                                            <option value="10 класс" selected>10 класс</option>
                                            <option value="11 класс">11 класс</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style="font-size:0.78rem; color:#94a3b8; display:block; margin-bottom:6px;">Кол-во слайдов:</label>
                                        <select id="pres-ai-count" style="width:100%; padding:10px 12px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.15); border-radius:10px; color:white; font-size:0.85rem; outline:none;">
                                            <option value="4">4 слайда</option>
                                            <option value="5" selected>5 слайдов</option>
                                            <option value="6">6 слайдов</option>
                                            <option value="8">8 слайдов</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style="font-size:0.78rem; color:#94a3b8; display:block; margin-bottom:6px;">Тема оформления:</label>
                                        <select id="pres-ai-theme" style="width:100%; padding:10px 12px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.15); border-radius:10px; color:white; font-size:0.85rem; outline:none;">
                                            <option value="space-violet">🌌 Фиолетовый Космос</option>
                                            <option value="cyber">⚡ Киберпанк Синий</option>
                                            <option value="emerald">🌿 Изумрудная Наука</option>
                                            <option value="amber">☀️ Янтарное Золото</option>
                                        </select>
                                    </div>
                                </div>
                                <button id="pres-ai-gen-btn" onclick="window.generateAiPresentation()" style="width:100%; padding:12px; background:linear-gradient(135deg,#8b5cf6,#ec4899); border:none; border-radius:12px; color:white; font-size:0.95rem; font-weight:700; cursor:pointer; box-shadow:0 4px 15px rgba(139,92,246,0.3); transition:all 0.2s;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
                                    ✨ Сгенерировать презентацию с ИИ
                                </button>
                            </div>

                            <!-- Saved Presentations Header & Grid -->
                            <h3 style="color:white; font-size:1.3rem; margin:0 0 16px 0;">📚 Мои Презентации</h3>
                            <div id="t-presentations-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap:20px;">
                                <!-- Rendered by presentations.js -->
                            </div>
                        </div>
                    </div>`;

if (indexContent.includes(tViewWheelEnd)) {
    indexContent = indexContent.replace(tViewWheelEnd, tViewPresentations);
}

// 4. Add Student View (s-view-presentations)
const sViewExamsEnd = `</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Student Result Modal -->`;

const sViewPresentations = `</div>
                </div>

                <!-- View: Presentations (Student) -->
                <div id="s-view-presentations" class="student-subview student-workspace" style="display:none; padding:30px; overflow-y:auto;">
                    <div style="max-width: 1200px; margin: 0 auto; width: 100%;">
                        <div style="margin-bottom:24px;">
                            <h2 style="font-size:1.8rem; font-weight:700; color:white; margin:0;">📊 Учебные Презентации</h2>
                            <p style="color:#94a3b8; font-size:0.85rem; margin-top:4px;">Интерактивные презентации от ваших учителей по предметам</p>
                        </div>
                        <div id="s-presentations-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap:20px;">
                            <!-- Rendered by presentations.js -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Student Result Modal -->`;

if (indexContent.includes(sViewExamsEnd)) {
    indexContent = indexContent.replace(sViewExamsEnd, sViewPresentations);
}

// 5. Add Presentation Modals before </body>
const bodyEnd = `<!-- Application scripts -->
<script src="js/env.js"></script>
<script src="js/firebase-config.js"></script>
<script src="js/translations.js?v=1"></script>
<script src="js/videoPipeline.js?v=5"></script>
<script src="js/app.js?v=5"></script>
</body>`;

const modalsAndScripts = `<!-- Presentation Editor Modal -->
<div id="presentation-editor-modal" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); backdrop-filter:blur(10px); z-index:9000; align-items:center; justify-content:center; padding:20px;">
    <div style="background:#0f172a; border:1px solid rgba(139,92,246,0.3); border-radius:24px; max-width:1000px; width:100%; max-height:90vh; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 25px 60px rgba(0,0,0,0.6);">
        <!-- Modal Header -->
        <div style="display:flex; align-items:center; justify-content:space-between; padding:18px 24px; background:rgba(139,92,246,0.1); border-bottom:1px solid rgba(139,92,246,0.2);">
            <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:1.4rem;">✏️</span>
                <h3 style="color:white; margin:0; font-size:1.2rem;">Редактор Презентации</h3>
            </div>
            <button onclick="window.closePresentationEditor()" style="background:none; border:none; color:#cbd5e1; font-size:1.5rem; cursor:pointer;">&times;</button>
        </div>

        <!-- Meta Settings -->
        <div style="padding:16px 24px; background:rgba(0,0,0,0.2); border-bottom:1px solid rgba(255,255,255,0.05); display:grid; grid-template-columns: 2fr 1fr 1fr; gap:14px;">
            <div>
                <label style="font-size:0.75rem; color:#94a3b8; display:block; margin-bottom:4px;">Название презентации:</label>
                <input type="text" id="edit-pres-title" style="width:100%; padding:8px 12px; background:#1e293b; color:white; border:1px solid rgba(255,255,255,0.1); border-radius:8px; outline:none;">
            </div>
            <div>
                <label style="font-size:0.75rem; color:#94a3b8; display:block; margin-bottom:4px;">Предмет:</label>
                <select id="edit-pres-subject" style="width:100%; padding:8px 12px; background:#1e293b; color:white; border:1px solid rgba(255,255,255,0.1); border-radius:8px; outline:none;">
                    <option value="Физика">Физика</option>
                    <option value="Информатика">Информатика</option>
                    <option value="Естествознание">Естествознание</option>
                    <option value="Математика">Математика</option>
                    <option value="История Казахстана">История Казахстана</option>
                    <option value="Самопознание">Самопознание</option>
                </select>
            </div>
            <div>
                <label style="font-size:0.75rem; color:#94a3b8; display:block; margin-bottom:4px;">Тема оформления:</label>
                <select id="edit-pres-theme" style="width:100%; padding:8px 12px; background:#1e293b; color:white; border:1px solid rgba(255,255,255,0.1); border-radius:8px; outline:none;">
                    <option value="space-violet">Фиолетовый Космос</option>
                    <option value="cyber">Киберпанк Синий</option>
                    <option value="emerald">Изумрудная Наука</option>
                    <option value="amber">Янтарное Золото</option>
                </select>
            </div>
        </div>

        <!-- Slide Tabs & Slide Editor Form -->
        <div style="flex:1; display:flex; flex-direction:column; padding:20px; overflow-y:auto; gap:16px;">
            <div id="editor-slide-tabs" style="display:flex; gap:8px; overflow-x:auto; padding-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.08);"></div>
            <div id="editor-slide-form" style="background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.05); border-radius:16px; padding:20px;"></div>
        </div>

        <!-- Modal Footer Actions -->
        <div style="padding:16px 24px; background:rgba(0,0,0,0.3); border-top:1px solid rgba(255,255,255,0.08); display:flex; justify-content:flex-end; gap:12px;">
            <button onclick="window.closePresentationEditor()" class="btn-secondary" style="padding:8px 18px;">Отмена</button>
            <button onclick="window.saveEditorChanges()" style="padding:8px 24px; background:linear-gradient(135deg,#10b981,#059669); color:white; border:none; border-radius:10px; font-weight:700; cursor:pointer;">💾 Сохранить презентацию</button>
        </div>
    </div>
</div>

<!-- Fullscreen Presentation Player Modal -->
<div id="presentation-player-modal" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:#060913; z-index:9999; flex-direction:column; overflow:hidden;">
    <!-- Top Control Header -->
    <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 24px; background:rgba(15,23,42,0.9); border-bottom:1px solid rgba(255,255,255,0.1); backdrop-filter:blur(10px); z-index:10;">
        <div style="display:flex; align-items:center; gap:14px;">
            <span style="font-size:1.4rem;">📊</span>
            <div>
                <h3 id="player-pres-title" style="color:white; margin:0; font-size:1.05rem; font-weight:700;">Название презентации</h3>
            </div>
        </div>
        <div style="display:flex; align-items:center; gap:14px;">
            <span id="player-slide-counter" style="background:rgba(139,92,246,0.25); color:#c084fc; border:1px solid rgba(139,92,246,0.4); padding:4px 14px; border-radius:20px; font-size:0.85rem; font-weight:700;">1 / 5</span>
            <button id="laser-toggle-btn" onclick="window.toggleLaserPointer()" style="padding:6px 14px; background:rgba(255,255,255,0.1); color:#cbd5e1; border:1px solid rgba(255,255,255,0.15); border-radius:8px; font-size:0.8rem; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:6px;">
                🔴 Указка (L)
            </button>
            <button onclick="window.toggleSpeakerNotes()" style="padding:6px 14px; background:rgba(255,255,255,0.1); color:#cbd5e1; border:1px solid rgba(255,255,255,0.15); border-radius:8px; font-size:0.8rem; font-weight:600; cursor:pointer;">
                📝 Заметки
            </button>
            <button onclick="window.closePresentationPlayer()" style="background:rgba(239,68,68,0.2); color:#fca5a5; border:1px solid rgba(239,68,68,0.4); padding:6px 16px; border-radius:8px; font-weight:700; font-size:0.85rem; cursor:pointer;">
                ✕ Выйти (Esc)
            </button>
        </div>
    </div>

    <!-- Slide Stage Canvas & Content -->
    <div id="player-slide-stage" style="flex:1; position:relative; display:flex; align-items:center; justify-content:center; padding:40px; overflow:hidden;">
        <!-- Laser Dot Overlay -->
        <div id="player-laser-dot" style="display:none; position:absolute; width:12px; height:12px; background:#ef4444; border-radius:50%; box-shadow:0 0 15px #ef4444, 0 0 30px #ef4444; pointer-events:none; transform:translate(-50%, -50%); z-index:100;"></div>
        
        <!-- Speaker Notes Box -->
        <div id="player-speaker-notes" style="display:none; position:absolute; bottom:20px; left:20px; right:20px; background:rgba(15,23,42,0.92); border:1px solid rgba(139,92,246,0.4); border-radius:14px; padding:16px; color:#c084fc; font-size:0.95rem; z-index:20; backdrop-filter:blur(8px);"></div>

        <!-- Inner Content Card -->
        <div style="max-width:1100px; width:100%; height:100%; max-height:650px; background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.1); border-radius:24px; padding:40px; display:flex; flex-direction:column; position:relative; box-shadow:0 30px 80px rgba(0,0,0,0.5);">
            <div id="player-slide-content" style="flex:1; width:100%; height:100%;"></div>
        </div>
    </div>

    <!-- Bottom Progress & Navigation Bar -->
    <div style="background:rgba(15,23,42,0.95); border-top:1px solid rgba(255,255,255,0.1); padding:12px 24px; display:flex; align-items:center; justify-content:space-between;">
        <button onclick="window.playerPrevSlide()" style="padding:10px 24px; background:rgba(255,255,255,0.1); color:white; border:1px solid rgba(255,255,255,0.2); border-radius:12px; font-weight:700; font-size:0.9rem; cursor:pointer;">
            ⬅ Назад (←)
        </button>

        <!-- Progress bar -->
        <div style="flex:1; max-width:500px; margin:0 20px; background:rgba(255,255,255,0.1); height:8px; border-radius:4px; overflow:hidden;">
            <div id="player-progress-bar" style="width:20%; height:100%; background:linear-gradient(90deg,#8b5cf6,#ec4899); transition:width 0.3s ease;"></div>
        </div>

        <button onclick="window.playerNextSlide()" style="padding:10px 24px; background:linear-gradient(135deg,#8b5cf6,#ec4899); color:white; border:none; border-radius:12px; font-weight:700; font-size:0.9rem; cursor:pointer; box-shadow:0 4px 15px rgba(139,92,246,0.3);">
            Далее (→) ➡️
        </button>
    </div>
</div>

<!-- Application scripts -->
<script src="js/env.js"></script>
<script src="js/firebase-config.js"></script>
<script src="js/translations.js?v=1"></script>
<script src="js/videoPipeline.js?v=5"></script>
<script src="js/presentations.js?v=1"></script>
<script src="js/app.js?v=5"></script>
</body>`;

if (indexContent.includes(bodyEnd)) {
    indexContent = indexContent.replace(bodyEnd, modalsAndScripts);
}

fs.writeFileSync(indexPath, indexContent, 'utf8');
console.log('✅ index.html updated with Presentation views & player modal');

// 6. Update js/app.js to include t-view-presentations and s-view-presentations in tab switchers
let appJsContent = fs.readFileSync(appJsPath, 'utf8');

const tViewsOld = `['t-view-profile', 't-view-workspace', 't-view-textbooks', 't-view-lessons', 't-view-classes', 't-view-exams', 't-view-ranking', 't-view-gradebook', 't-view-calendar', 't-view-kahoot', 't-view-wheel']`;
const tViewsNew = `['t-view-profile', 't-view-workspace', 't-view-textbooks', 't-view-lessons', 't-view-classes', 't-view-exams', 't-view-ranking', 't-view-gradebook', 't-view-calendar', 't-view-kahoot', 't-view-wheel', 't-view-presentations']`;

const tFlexViewsOld = `['t-view-workspace', 't-view-kahoot', 't-view-wheel']`;
const tFlexViewsNew = `['t-view-workspace', 't-view-kahoot', 't-view-wheel', 't-view-presentations']`;

if (appJsContent.includes(tViewsOld)) {
    appJsContent = appJsContent.replace(tViewsOld, tViewsNew);
}
if (appJsContent.includes(tFlexViewsOld)) {
    appJsContent = appJsContent.replace(tFlexViewsOld, tFlexViewsNew);
}

const sViewsOld = `['s-view-exams', 's-view-ranking', 's-view-calendar', 's-view-lessons', 's-view-gradebook']`;
const sViewsNew = `['s-view-exams', 's-view-ranking', 's-view-calendar', 's-view-lessons', 's-view-gradebook', 's-view-presentations']`;

if (appJsContent.includes(sViewsOld)) {
    appJsContent = appJsContent.replace(sViewsOld, sViewsNew);
}

// Add tab listener triggers
const tPresTrigger = `if (targetId === 't-view-presentations') {
                if (typeof window.renderPresentationsList === 'function') window.renderPresentationsList();
            }`;

const sPresTrigger = `if (targetId === 's-view-presentations') {
                if (typeof window.renderPresentationsList === 'function') window.renderPresentationsList();
            }`;

const tProfileMarker = `if (targetId === 't-view-profile') {`;
if (appJsContent.includes(tProfileMarker)) {
    appJsContent = appJsContent.replace(tProfileMarker, `${tPresTrigger}\n\n            ${tProfileMarker}`);
}

const sRankMarker = `if (targetId === 's-view-ranking' && currentUser) {`;
if (appJsContent.includes(sRankMarker)) {
    appJsContent = appJsContent.replace(sRankMarker, `${sPresTrigger}\n\n            ${sRankMarker}`);
}

fs.writeFileSync(appJsPath, appJsContent, 'utf8');
console.log('✅ js/app.js updated with presentation view triggers');
