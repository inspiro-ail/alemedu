const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
const appJsPath = path.join(__dirname, '..', 'js', 'app.js');

// --- 1. Modify index.html ---
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Remove nav buttons from sidebars
const teacherNavBtn = `<a href="physics_lab.html" target="_blank" class="nav-btn" style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); margin-top: 8px; color: #34d399; text-align:center; text-decoration:none; display:block;">⚗️ Физ. Лаборатория</a>`;
indexContent = indexContent.split(teacherNavBtn).join('');

// Update subject-detail-view header to include subject-lab-btn-container
const oldHeader = `<div style="display:flex; align-items:center; gap:16px; margin-bottom:24px;">
                            <button onclick="closeSubject()" class="btn-secondary" style="padding: 8px 16px;">⬅ Назад</button>
                            <h2 id="current-subject-title" style="margin:0;">Название предмета</h2>
                        </div>`;

const newHeader = `<div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; flex-wrap:wrap; gap:16px;">
                            <div style="display:flex; align-items:center; gap:16px;">
                                <button onclick="closeSubject()" class="btn-secondary" style="padding: 8px 16px;">⬅ Назад</button>
                                <h2 id="current-subject-title" style="margin:0;">Название предмета</h2>
                            </div>
                            <div id="subject-lab-btn-container"></div>
                        </div>`;

if (indexContent.includes(oldHeader)) {
    indexContent = indexContent.replace(oldHeader, newHeader);
}

// Update physics-lab-panel header & add lab banner inside panel
const oldPanelHeader = `<div style="display:flex; align-items:center; justify-content:space-between; padding:14px 18px; background:rgba(139,92,246,0.12); border-bottom:1px solid rgba(139,92,246,0.25);">
                                        <div style="display:flex; align-items:center; gap:10px;">
                                            <span style="font-size:1.3rem;">⚛️</span>
                                            <div>
                                                <span style="font-weight:700; color:white; font-size:0.95rem;">Виртуальная Лаборатория Физики</span>
                                                <div style="font-size:0.72rem; color:#a78bfa;">Интерактивные симуляции законов природы</div>
                                            </div>
                                        </div>
                                        <span style="font-size:0.7rem; color:#c084fc; background:rgba(139,92,246,0.2); padding:3px 8px; border-radius:20px; border:1px solid rgba(139,92,246,0.3);">HTML5 Canvas</span>
                                    </div>`;

const newPanelHeader = `<div style="display:flex; align-items:center; justify-content:space-between; padding:14px 18px; background:rgba(139,92,246,0.12); border-bottom:1px solid rgba(139,92,246,0.25);">
                                        <div style="display:flex; align-items:center; gap:10px;">
                                            <span style="font-size:1.3rem;">⚛️</span>
                                            <div>
                                                <span style="font-weight:700; color:white; font-size:0.95rem;">Виртуальная Лаборатория Физики</span>
                                                <div style="font-size:0.72rem; color:#a78bfa;">Интерактивные симуляции законов природы</div>
                                            </div>
                                        </div>
                                        <a href="physics_lab.html" target="_blank" style="padding:6px 12px; background:linear-gradient(135deg, #10b981, #059669); color:white; font-size:0.76rem; font-weight:700; border-radius:10px; text-decoration:none; display:inline-flex; align-items:center; gap:5px; box-shadow:0 4px 12px rgba(16,185,129,0.3); transition:all 0.2s;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
                                            🔬 efizika (8 в 1) ↗
                                        </a>
                                    </div>
                                    <div style="padding:10px 14px; background:rgba(16,185,129,0.06); border-bottom:1px solid rgba(16,185,129,0.15);">
                                        <a href="physics_lab.html" target="_blank" style="display:flex; align-items:center; justify-content:space-between; width:100%; padding:9px 14px; background:linear-gradient(135deg, rgba(16,185,129,0.22), rgba(139,92,246,0.25)); border:1px solid rgba(52,211,153,0.4); border-radius:12px; color:white; text-decoration:none; transition:all 0.2s; box-shadow:0 4px 14px rgba(16,185,129,0.15);" onmouseover="this.style.transform='translateY(-1px)';" onmouseout="this.style.transform='none';">
                                            <div style="display:flex; align-items:center; gap:10px;">
                                                <span style="font-size:1.3rem;">🔬</span>
                                                <div>
                                                    <div style="font-weight:700; font-size:0.83rem; color:#34d399;">3D/Canvas Лаборатория efizika.ru</div>
                                                    <div style="font-size:0.71rem; color:#cbd5e1;">8 интерактивных экспериментальных установок</div>
                                                </div>
                                            </div>
                                            <span style="background:#10b981; color:white; font-size:0.75rem; font-weight:700; padding:6px 12px; border-radius:8px; display:inline-flex; align-items:center; gap:4px; white-space:nowrap;">Открыть 🚀</span>
                                        </a>
                                    </div>`;

if (indexContent.includes(oldPanelHeader)) {
    indexContent = indexContent.replace(oldPanelHeader, newPanelHeader);
}

fs.writeFileSync(indexPath, indexContent, 'utf8');
console.log('✅ index.html updated');

// --- 2. Modify js/app.js ---
let appJsContent = fs.readFileSync(appJsPath, 'utf8');

const targetInAppJs = `// Show Virtual Physics Laboratory only for Физика
        const physicsPanel = document.getElementById('physics-lab-panel');
        if (physicsPanel) {
            const isPhys = (subject === 'Физика' || subject === '\\u0424\\u0438\\u0437\\u0438\\u043a\\u0430');
            physicsPanel.style.display = isPhys ? 'flex' : 'none';
            if (isPhys && typeof window.switchPhysicsTab === 'function') {
                window.switchPhysicsTab('mechanics');
            }
        }`;

const replacementInAppJs = `// Show Virtual Physics Laboratory & Action Button only for Физика
        const physicsPanel = document.getElementById('physics-lab-panel');
        const isPhys = (subject === 'Физика' || subject === '\\u0424\\u0438\\u0437\\u0438\\u043a\\u0430');
        if (physicsPanel) {
            physicsPanel.style.display = isPhys ? 'flex' : 'none';
            if (isPhys && typeof window.switchPhysicsTab === 'function') {
                window.switchPhysicsTab('mechanics');
            }
        }
        const labBtnContainer = document.getElementById('subject-lab-btn-container');
        if (labBtnContainer) {
            if (isPhys) {
                labBtnContainer.innerHTML = \`<a href="physics_lab.html" target="_blank" style="padding: 9px 18px; background: linear-gradient(135deg, #10b981, #059669); color: white; border-radius: 12px; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; font-weight: 700; font-size: 0.88rem; box-shadow: 0 4px 15px rgba(16,185,129,0.3); transition: all 0.2s;" onmouseover="this.style.transform='scale(1.03)'" onmouseout="this.style.transform='scale(1)'">⚗️ Интерактивная Лаборатория (efizika) ↗</a>\`;
            } else {
                labBtnContainer.innerHTML = '';
            }
        }`;

if (appJsContent.includes(targetInAppJs)) {
    appJsContent = appJsContent.replace(targetInAppJs, replacementInAppJs);
    fs.writeFileSync(appJsPath, appJsContent, 'utf8');
    console.log('✅ js/app.js updated');
} else {
    console.log('⚠️ targetInAppJs pattern not found in app.js!');
}
