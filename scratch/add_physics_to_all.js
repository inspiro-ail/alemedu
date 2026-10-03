const fs = require('fs');

// 1. Update index.html
let indexHtml = fs.readFileSync('index.html', 'utf8');
const physCardRu = `                        <div class="subject-card" onclick="openSubject('Физика')" style="--subj-color: #8b5cf6; --subj-bg: rgba(139,92,246,0.1);">
                            <div class="subj-icon">⚛️</div>
                            <div class="subj-info">
                                <h3>Физика</h3>
                                <span>Законы природы & Лаборатория</span>
                            </div>
                        </div>`;

if (!indexHtml.includes("openSubject('Физика')")) {
    indexHtml = indexHtml.replace(
        `<div class="subject-card" onclick="openSubject('Естествознание')"`,
        physCardRu + `\n                        <div class="subject-card" onclick="openSubject('Естествознание')"`
    );
    fs.writeFileSync('index.html', indexHtml, 'utf8');
    console.log("Added Physics card to index.html!");
} else {
    console.log("Physics card already in index.html");
}

// 2. Update index_kz.html
let indexKzHtml = fs.readFileSync('index_kz.html', 'utf8');
const physCardKz = `                        <div class="subject-card" onclick="openSubject('Физика')" style="--subj-color: #8b5cf6; --subj-bg: rgba(139,92,246,0.1);">
                            <div class="subj-icon">⚛️</div>
                            <div class="subj-info">
                                <h3>Физика</h3>
                                <span>Табиғат заңдары & Зертхана</span>
                            </div>
                        </div>`;

if (!indexKzHtml.includes("openSubject('Физика')")) {
    indexKzHtml = indexKzHtml.replace(
        `<div class="subject-card" onclick="openSubject('Жаратылыстану')"`,
        physCardKz + `\n                        <div class="subject-card" onclick="openSubject('Жаратылыстану')"`
    );
    fs.writeFileSync('index_kz.html', indexKzHtml, 'utf8');
    console.log("Added Physics card to index_kz.html!");
} else {
    console.log("Physics card already in index_kz.html");
}

// 3. Update js/app.js subjects array
let jsApp = fs.readFileSync('js/app.js', 'utf8');
if (!jsApp.includes("'Физика'") || jsApp.includes("const subjects = ['Естествознание'")) {
    jsApp = jsApp.replace(
        `const subjects = ['Естествознание', 'Информатика', 'Математика', 'История Казахстана', 'Самопознание'];`,
        `const subjects = ['Физика', 'Естествознание', 'Информатика', 'Математика', 'История Казахстана', 'Самопознание'];`
    );
    jsApp = jsApp.replace(
        `if (s === 'Естествознание') icon = '🌍';`,
        `if (s === 'Физика') icon = '⚛️';\n                if (s === 'Естествознание') icon = '🌍';`
    );
    fs.writeFileSync('js/app.js', jsApp, 'utf8');
    console.log("Updated subjects array in js/app.js!");
}

// 4. Update js_kz/app.js subjects array
let jsKzApp = fs.readFileSync('js_kz/app.js', 'utf8');
if (!jsKzApp.includes("'Физика'") || jsKzApp.includes("const subjects = ['Жаратылыстану'")) {
    jsKzApp = jsKzApp.replace(
        `const subjects = ['Жаратылыстану', 'Информатика', 'Математика', 'Қазақстан тарихы', 'Өзін-өзі тану'];`,
        `const subjects = ['Физика', 'Жаратылыстану', 'Информатика', 'Математика', 'Қазақстан тарихы', 'Өзін-өзі тану'];`
    );
    jsKzApp = jsKzApp.replace(
        `if (s === 'Жаратылыстану') icon = '🌍';`,
        `if (s === 'Физика') icon = '⚛️';\n                if (s === 'Жаратылыстану') icon = '🌍';`
    );
    fs.writeFileSync('js_kz/app.js', jsKzApp, 'utf8');
    console.log("Updated subjects array in js_kz/app.js!");
}

console.log("DONE updating physics subject everywhere!");
