const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
let content = fs.readFileSync(indexPath, 'utf8');

// Replace 1: auth-header
const t1Old = `<div class="auth-header">
                    <h1>AlemEdu</h1>
                    <p>Образовательная платформа будущего</p>
                </div>`;
const t1New = `<div class="auth-header" style="position: relative;">
                    <div style="position: absolute; top: -5px; right: 0;">
                        <div class="lang-switcher">
                            <button class="lang-btn active" data-lang="ru" onclick="setLanguage('ru')">RU</button>
                            <button class="lang-btn" data-lang="kz" onclick="setLanguage('kz')">KZ</button>
                        </div>
                    </div>
                    <h1>AlemEdu</h1>
                    <p>Образовательная платформа будущего</p>
                </div>`;

// Replace 2: teacher user-profile
const t2Old = `<div class="user-profile">
                        <span id="t-user-name">Преподаватель</span>
                        <button id="t-logout" class="logout-btn">Выйти</button>
                    </div>`;
const t2New = `<div class="user-profile" style="display: flex; align-items: center; gap: 12px;">
                        <div class="lang-switcher">
                            <button class="lang-btn active" data-lang="ru" onclick="setLanguage('ru')">RU</button>
                            <button class="lang-btn" data-lang="kz" onclick="setLanguage('kz')">KZ</button>
                        </div>
                        <span id="t-user-name">Преподаватель</span>
                        <button id="t-logout" class="logout-btn">Выйти</button>
                    </div>`;

// Replace 3: student user-profile
const t3Old = `<div class="user-profile">
                        <div style="display: flex; flex-direction: column; text-align: right;">
                            <span id="s-user-name" style="font-weight: 600;">Студент</span>
                            <span id="s-class-badge" style="font-size: 0.8rem; color: #10b981;">Класс: ALEM-101</span>
                        </div>
                        <button id="s-logout" class="logout-btn">Выйти</button>
                    </div>`;
const t3New = `<div class="user-profile" style="display: flex; align-items: center; gap: 12px;">
                        <div class="lang-switcher">
                            <button class="lang-btn active" data-lang="ru" onclick="setLanguage('ru')">RU</button>
                            <button class="lang-btn" data-lang="kz" onclick="setLanguage('kz')">KZ</button>
                        </div>
                        <div style="display: flex; flex-direction: column; text-align: right;">
                            <span id="s-user-name" style="font-weight: 600;">Студент</span>
                            <span id="s-class-badge" style="font-size: 0.8rem; color: #10b981;">Класс: ALEM-101</span>
                        </div>
                        <button id="s-logout" class="logout-btn">Выйти</button>
                    </div>`;

function normalize(str) {
    return str.replace(/\r\n/g, '\n');
}

let normContent = normalize(content);

let c1 = normContent.includes(normalize(t1Old));
let c2 = normContent.includes(normalize(t2Old));
let c3 = normContent.includes(normalize(t3Old));

console.log('Matches:', { c1, c2, c3 });

if (c1) normContent = normContent.replace(normalize(t1Old), normalize(t1New));
if (c2) normContent = normContent.replace(normalize(t2Old), normalize(t2New));
if (c3) normContent = normContent.replace(normalize(t3Old), normalize(t3New));

fs.writeFileSync(indexPath, normContent, 'utf8');
console.log('✅ Updated index.html successfully!');
