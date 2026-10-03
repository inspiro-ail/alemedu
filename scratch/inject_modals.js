const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

if (!html.includes('id="presentation-editor-modal"')) {
    const modals = `
<!-- Presentation Editor Modal -->
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
`;
    html = html.replace('</body>', modals + '\n</body>');
    fs.writeFileSync(indexPath, html, 'utf8');
    console.log("Injected modals!");
} else {
    console.log("Modals already exist.");
}
