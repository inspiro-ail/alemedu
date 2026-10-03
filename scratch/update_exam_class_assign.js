const fs = require('fs');

// HTML Select Dropdown Template for Russian
const classSelectRu = `                                <div class="form-group">
                                    <label>Выберите целевой класс для сдачи экзамена</label>
                                    <select id="exam-schedule-class-select"
                                        style="width:100%; color: white; background: rgba(0,0,0,0.3); padding:10px; border-radius:8px; border:1px solid rgba(255,255,255,0.2);" onchange="window.handleExamClassSelectChange(this)">
                                        <option value="ALEM-101">🏫 ALEM-101 (Стандартный класс)</option>
                                        <option value="10-А">🏫 10-А класс</option>
                                        <option value="10-Б">🏫 10-Б класс</option>
                                        <option value="11-А">🏫 11-А класс</option>
                                        <option value="9-А">🏫 9-А класс</option>
                                        <option value="__custom__">➕ Ввести другой код класса...</option>
                                    </select>
                                    <input type="text" id="exam-schedule-class" placeholder="Например: ALEM-102" style="display:none; margin-top:10px; color:white; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.2); padding:10px; border-radius:8px; width:100%;">
                                </div>`;

// HTML Select Dropdown Template for Kazakh
const classSelectKz = `                                <div class="form-group">
                                    <label>Емтихан тапсыратын сыныпты таңдаңыз</label>
                                    <select id="exam-schedule-class-select"
                                        style="width:100%; color: white; background: rgba(0,0,0,0.3); padding:10px; border-radius:8px; border:1px solid rgba(255,255,255,0.2);" onchange="window.handleExamClassSelectChange(this)">
                                        <option value="ALEM-101">🏫 ALEM-101 (Негізгі сынып)</option>
                                        <option value="10-А">🏫 10-А сыныбы</option>
                                        <option value="10-Б">🏫 10-Б сыныбы</option>
                                        <option value="11-А">🏫 11-А сыныбы</option>
                                        <option value="9-А">🏫 9-А сыныбы</option>
                                        <option value="__custom__">➕ Басқа сынып кодын енгізу...</option>
                                    </select>
                                    <input type="text" id="exam-schedule-class" placeholder="Мысалы: ALEM-102" style="display:none; margin-top:10px; color:white; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.2); padding:10px; border-radius:8px; width:100%;">
                                </div>`;

// 1. Update index.html
let indexHtml = fs.readFileSync('index.html', 'utf8');
indexHtml = indexHtml.replace(
    `<div class="form-group">\n                                    <label>Код класса</label>\n                                    <input type="text" id="exam-schedule-class" placeholder="Например: ALEM-101">\n                                </div>`,
    classSelectRu
);
fs.writeFileSync('index.html', indexHtml, 'utf8');
console.log('Updated class assignment select in index.html!');

// 2. Update index_kz.html
let indexKzHtml = fs.readFileSync('index_kz.html', 'utf8');
indexKzHtml = indexKzHtml.replace(
    `<div class="form-group">\n                                    <label>Сынып коды</label>\n                                    <input type="text" id="exam-schedule-class" placeholder="Мысалы: ALEM-101">\n                                </div>`,
    classSelectKz
);
fs.writeFileSync('index_kz.html', indexKzHtml, 'utf8');
console.log('Updated class assignment select in index_kz.html!');

// 3. Update js/app.js and js_kz/app.js logic
const jsClassAssignHelper = `
    window.handleExamClassSelectChange = (sel) => {
        const customInput = document.getElementById('exam-schedule-class');
        if (!customInput) return;
        if (sel.value === '__custom__') {
            customInput.style.display = 'block';
            customInput.focus();
        } else {
            customInput.style.display = 'none';
            customInput.value = sel.value;
        }
    };
`;

function injectJsHelper(filePath) {
    let js = fs.readFileSync(filePath, 'utf8');
    if (!js.includes('handleExamClassSelectChange')) {
        js += '\n' + jsClassAssignHelper;
    }

    // Update assignExamBtn listener to correctly take selected class
    js = js.replace(
        `const clsCode = document.getElementById('exam-schedule-class').value.trim();`,
        `const selEl = document.getElementById('exam-schedule-class-select');\n            const customEl = document.getElementById('exam-schedule-class');\n            const clsCode = (selEl && selEl.value !== '__custom__') ? selEl.value : (customEl ? customEl.value.trim() : '');`
    );

    fs.writeFileSync(filePath, js, 'utf8');
    console.log(`Updated exam class assignment JS logic in ${filePath}!`);
}

injectJsHelper('js/app.js');
injectJsHelper('js_kz/app.js');
