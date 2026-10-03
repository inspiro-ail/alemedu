const fs = require('fs');

const textbookSubViewRu = `
                <!-- ==========================
                     SUB-VIEW 1.7: TEXTBOOKS (PDF)
                     ========================== -->
                <div id="t-view-textbooks" class="teacher-subview" style="display: none; width: 100%; padding: 30px; overflow-y: auto;">
                    <div style="max-width: 1000px; margin: 0 auto; width: 100%;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:16px;">
                            <div>
                                <h2 style="font-size:1.6rem; font-weight:700; background:linear-gradient(135deg,#a855f7,#ec4899); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;">📖 Учебники (PDF) для ИИ</h2>
                                <p style="color:#64748b; font-size:0.85rem; margin-top:4px;">Загрузите PDF учебник для класса, чтобы ИИ генерировал задания строго по программе</p>
                            </div>
                        </div>

                        <!-- Upload PDF Form -->
                        <div class="task-form-panel" style="background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.05); padding:24px; border-radius:16px; margin-bottom: 24px;">
                            <h3>📤 Загрузить учебник (PDF)</h3>
                            <div style="display:flex; gap:12px; flex-wrap:wrap; margin-top:16px;">
                                <div class="form-group" style="flex:1; min-width:180px;">
                                    <label>Код класса</label>
                                    <input type="text" id="pdf-class-code" value="ALEM-101" placeholder="ALEM-101">
                                </div>
                                <div class="form-group" style="flex:2; min-width:240px;">
                                    <label>Название / Описание учебника</label>
                                    <input type="text" id="pdf-title" placeholder="Физика 10 класс (Казахстан)">
                                </div>
                            </div>
                            <div class="form-group" style="margin-top:16px;">
                                <label>Выберите PDF файл (до 25 МБ)</label>
                                <input type="file" id="pdf-file-input" accept="application/pdf" style="padding:10px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.2); border-radius:8px; width:100%; color:white;">
                            </div>
                            <div id="pdf-upload-progress" style="display:none; margin-top:12px; font-size:0.85rem; color:#a78bfa; font-weight:600;">
                                ⏳ Извлечение текста из PDF и обучение ИИ...
                            </div>
                            <button id="upload-pdf-btn" onclick="window.uploadClassTextbookPdf()" class="btn-primary" style="margin-top:20px; background:linear-gradient(135deg,#8b5cf6,#d946ef);">🚀 Загрузить и обучить ИИ</button>
                        </div>

                        <!-- Existing Textbooks List -->
                        <div style="background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.05); padding:24px; border-radius:16px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                                <h3>📚 Загруженные учебники</h3>
                                <button onclick="window.loadTeacherTextbooks()" class="btn-secondary" style="padding: 6px 12px; font-size: 0.85rem;">🔄 Обновить</button>
                            </div>
                            <div id="teacher-textbooks-list" style="display:flex; flex-direction:column; gap:12px;">
                                <div style="color:#64748b; font-size:0.9rem;">Нажмите "Обновить" для загрузки списка.</div>
                            </div>
                        </div>
                    </div>
                </div>`;

const textbookSubViewKz = `
                <!-- ==========================
                     SUB-VIEW 1.7: TEXTBOOKS (PDF)
                     ========================== -->
                <div id="t-view-textbooks" class="teacher-subview" style="display: none; width: 100%; padding: 30px; overflow-y: auto;">
                    <div style="max-width: 1000px; margin: 0 auto; width: 100%;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:16px;">
                            <div>
                                <h2 style="font-size:1.6rem; font-weight:700; background:linear-gradient(135deg,#a855f7,#ec4899); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;">📖 Оқулықтар (PDF) ЖИ үшін</h2>
                                <p style="color:#64748b; font-size:0.85rem; margin-top:4px;">Сыныпқа арналған PDF оқулықты жүктеңіз, ЖИ тапсырмаларды бағдарлама бойынша генерациялайды</p>
                            </div>
                        </div>

                        <!-- Upload PDF Form -->
                        <div class="task-form-panel" style="background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.05); padding:24px; border-radius:16px; margin-bottom: 24px;">
                            <h3>📤 Оқулықты жүктеу (PDF)</h3>
                            <div style="display:flex; gap:12px; flex-wrap:wrap; margin-top:16px;">
                                <div class="form-group" style="flex:1; min-width:180px;">
                                    <label>Сынып коды</label>
                                    <input type="text" id="pdf-class-code" value="ALEM-101" placeholder="ALEM-101">
                                </div>
                                <div class="form-group" style="flex:2; min-width:240px;">
                                    <label>Оқулықтың аты / Сипаттамасы</label>
                                    <input type="text" id="pdf-title" placeholder="Физика 10 сынып (Қазақстан)">
                                </div>
                            </div>
                            <div class="form-group" style="margin-top:16px;">
                                <label>PDF файлын таңдаңыз (25 МБ дейін)</label>
                                <input type="file" id="pdf-file-input" accept="application/pdf" style="padding:10px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.2); border-radius:8px; width:100%; color:white;">
                            </div>
                            <div id="pdf-upload-progress" style="display:none; margin-top:12px; font-size:0.85rem; color:#a78bfa; font-weight:600;">
                                ⏳ PDF форматынан мәтінді алу және ЖИ оқыту...
                            </div>
                            <button id="upload-pdf-btn" onclick="window.uploadClassTextbookPdf()" class="btn-primary" style="margin-top:20px; background:linear-gradient(135deg,#8b5cf6,#d946ef);">🚀 Жүктеу және ЖИ оқыту</button>
                        </div>

                        <!-- Existing Textbooks List -->
                        <div style="background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.05); padding:24px; border-radius:16px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                                <h3>📚 Жүктелген оқулықтар</h3>
                                <button onclick="window.loadTeacherTextbooks()" class="btn-secondary" style="padding: 6px 12px; font-size: 0.85rem;">🔄 Жаңарту</button>
                            </div>
                            <div id="teacher-textbooks-list" style="display:flex; flex-direction:column; gap:12px;">
                                <div style="color:#64748b; font-size:0.9rem;">Тізімді жүктеу үшін "Жаңарту" батырмасын басыңыз.</div>
                            </div>
                        </div>
                    </div>
                </div>`;

function processFile(filename, textbookSubView) {
    console.log(`\n=================== REPAIRING & INJECTING ${filename} ===================`);
    let html = fs.readFileSync(filename, 'utf8');

    // Remove duplicate gradebook in index.html if present
    if (filename === 'index.html') {
        const dupGradebookRegex = /<!-- ==========================\s+SUB-VIEW 6: GRADEBOOK \(TEACHER\)[\s\S]*?<\/div>\s+<\/div>\s+<\/div>\s+<\/div>/;
        html = html.replace(dupGradebookRegex, '');
    }

    // Fix line 282 in index_kz.html (remove 1 extra closing div after t-view-workspace)
    if (filename === 'index_kz.html') {
        const extraDivRegex = /(\s*<\/div>\s*<\/div>\s*<\/div>)\s*<\/div>(\s*<!-- ==========================\s+SUB-VIEW 1\.5: LESSONS)/;
        html = html.replace(extraDivRegex, '$1$2');
    }

    // Insert t-view-textbooks before SUB-VIEW 2: CLASS MANAGEMENT if not present
    if (!html.includes('id="t-view-textbooks"')) {
        const targetMarker = /<!-- ==========================\s+SUB-VIEW 2: CLASS MANAGEMENT/;
        html = html.replace(targetMarker, textbookSubView + '\n\n                <!-- ==========================\n                     SUB-VIEW 2: CLASS MANAGEMENT');
    }

    fs.writeFileSync(filename, html, 'utf8');

    // Validation step
    const lines = html.split('\n');
    let teacherStart = -1;
    let studentStart = -1;

    lines.forEach((l, i) => {
        if (l.includes('id="teacher-view"')) teacherStart = i;
        if (l.includes('id="student-view"')) studentStart = i;
    });

    let depth = 0;
    let errors = 0;
    let subviews = [];

    for (let i = 0; i < lines.length; i++) {
        const lineNo = i + 1;
        const line = lines[i];

        const openCount = (line.match(/<div[\s>]/gi) || []).length;
        const closeCount = (line.match(/<\/div>/gi) || []).length;

        const depthBefore = depth;
        depth += (openCount - closeCount);

        if (i >= teacherStart && i < studentStart) {
            if (line.includes('id="t-view-') || line.includes('class="teacher-subview"')) {
                const match = line.match(/id=["']([^"']+)["']/);
                const id = match ? match[1] : 'unknown';
                subviews.push({ id, lineNo, depthBefore });
                if (depthBefore !== 4) {
                    console.log(`❌ L${lineNo} [${id}] Depth before tag: ${depthBefore} (Expected: 4)`);
                    errors++;
                } else {
                    console.log(`✅ L${lineNo} [${id}] PERFECT! Depth before tag is 4.`);
                }
            }
        }
    }

    const totalOpen = (html.match(/<div[\s>]/gi) || []).length;
    const totalClose = (html.match(/<\/div>/gi) || []).length;

    console.log(`Subviews count (${subviews.length}):`, subviews.map(s => s.id));
    console.log(`Total <div> balance in ${filename}: Open=${totalOpen}, Close=${totalClose}`);

    if (errors === 0 && totalOpen === totalClose) {
        console.log(`🎉🎉🎉 ${filename} IS 100% PERFECT! ALL SUBVIEWS ARE SIBLINGS AT DEPTH 4 AND TOTAL DIV TAGS ARE ABSOLUTELY BALANCED! 🎉🎉🎉`);
    } else {
        console.log(`⚠️ ${filename}: ${errors} errors, Tag diff = ${totalOpen - totalClose}`);
    }
}

processFile('index.html', textbookSubViewRu);
processFile('index_kz.html', textbookSubViewKz);
