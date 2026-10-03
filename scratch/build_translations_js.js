const fs = require('fs');
const path = require('path');

const dictPath = path.join(__dirname, 'extracted_dict.json');
const rawDict = JSON.parse(fs.readFileSync(dictPath, 'utf8'));

// Additional key UI mappings
const additionalPairs = [
    ["Вход", "Кіру"],
    ["Регистрация", "Тіркелу"],
    ["Ваше имя", "Сіздің атыңыз"],
    ["Студент", "Оқушы"],
    ["Учитель", "Мұғалім"],
    ["Я:", "Мен:"],
    ["Ваш предмет (только для учителей)", "Сіздің пәніңіз (тек мұғалімдер үшін)"],
    ["Код класса", "Сынып коды"],
    ["Пароль", "Құпия сөз"],
    ["Войти в систему", "Жүйеге кіру"],
    ["Зарегистрироваться", "Тіркелу"],
    ["Выйти", "Шығу"],
    ["Преподаватель", "Оқытушы"],
    ["Ученик", "Оқушы"],
    ["Мой кабинет", "Мой кабинет"],
    ["Мои Классы", "Менің сыныптарым"],
    ["Экзамены", "Емтихандар"],
    ["Рейтинг класса", "Сынып рейтингі"],
    ["Журнал оценок", "Бағалар журналы"],
    ["Календарь", "Күнтізбе"],
    ["Викторина ИИ", "ЖИ Викторинасы"],
    ["Колесо удачи", "Тағдыр дөңгелегі"],
    ["Личный кабинет", "Жеке кабинет"],
    ["Мои Уроки", "Менің сабақтарым"],
    ["Мои Оценки", "Менің бағаларым"],
    ["Лента новостей", "Жаңалықтар таспасы"],
    ["Образовательная платформа будущего", "Болашақтың білім беру платформасы"],
    ["Физика", "Физика"],
    ["Естествознание", "Жаратылыстану"],
    ["Информатика", "Информатика"],
    ["Математика", "Математика"],
    ["История Казахстана", "Қазақстан тарихы"],
    ["Самопознание", "Өзін-өзі тану"]
];

const allDict = [...additionalPairs, ...rawDict];

// Deduplicate
const uniquePairs = [];
const seen = new Set();
for (const [ru, kz] of allDict) {
    if (!ru || !kz || ru === kz) continue;
    const key = `${ru.trim()}|||${kz.trim()}`;
    if (!seen.has(key)) {
        seen.add(key);
        uniquePairs.push([ru.trim(), kz.trim()]);
    }
}

const jsContent = `// AlemEdu Dynamic i18n & Bilingual Switcher (RU / KZ)
(function () {
    const DICTIONARY = ${JSON.stringify(uniquePairs, null, 4)};

    let currentLang = localStorage.getItem('alem_lang') || 'ru';

    // Bi-directional lookup maps
    const ruToKzMap = new Map();
    const kzToRuMap = new Map();

    DICTIONARY.forEach(([ru, kz]) => {
        ruToKzMap.set(ru, kz);
        kzToRuMap.set(kz, ru);
    });

    window.t = function (text) {
        if (!text || typeof text !== 'string') return text;
        const trimmed = text.trim();
        if (currentLang === 'kz') {
            return ruToKzMap.get(trimmed) || text;
        } else {
            return kzToRuMap.get(trimmed) || text;
        }
    };

    window.getCurrentLang = function () {
        return currentLang;
    };

    function replaceInTextNode(node, fromMap) {
        let val = node.nodeValue;
        if (!val || !val.trim()) return;
        
        let updated = val;
        for (const [fromStr, toStr] of fromMap.entries()) {
            if (updated.includes(fromStr)) {
                updated = updated.split(fromStr).join(toStr);
            }
        }
        if (updated !== val) {
            node.nodeValue = updated;
        }
    }

    function translateDOM(targetLang) {
        const fromMap = targetLang === 'kz' ? ruToKzMap : kzToRuMap;

        // 1. Text nodes
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function (node) {
                    const parent = node.parentElement;
                    if (!parent) return NodeFilter.FILTER_REJECT;
                    const tag = parent.tagName.toLowerCase();
                    if (tag === 'script' || tag === 'style' || tag === 'noscript') return NodeFilter.FILTER_REJECT;
                    if (!node.nodeValue.trim()) return NodeFilter.FILTER_SKIP;
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        let node;
        const nodesToProcess = [];
        while ((node = walker.nextNode())) {
            nodesToProcess.push(node);
        }

        nodesToProcess.forEach(n => replaceInTextNode(n, fromMap));

        // 2. Placeholders
        document.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(el => {
            let ph = el.getAttribute('placeholder');
            if (ph && ph.trim()) {
                let updatedPh = ph;
                for (const [fromStr, toStr] of fromMap.entries()) {
                    if (updatedPh.includes(fromStr)) {
                        updatedPh = updatedPh.split(fromStr).join(toStr);
                    }
                }
                if (updatedPh !== ph) {
                    el.setAttribute('placeholder', updatedPh);
                }
            }
        });

        // 3. Option elements
        document.querySelectorAll('option').forEach(opt => {
            let txt = opt.textContent;
            if (txt && txt.trim()) {
                let updatedTxt = txt;
                for (const [fromStr, toStr] of fromMap.entries()) {
                    if (updatedTxt.includes(fromStr)) {
                        updatedTxt = updatedTxt.split(fromStr).join(toStr);
                    }
                }
                if (updatedTxt !== txt) {
                    opt.textContent = updatedTxt;
                }
            }
        });

        // 4. Update UI language switcher buttons
        document.querySelectorAll('.lang-btn').forEach(btn => {
            if (btn.getAttribute('data-lang') === targetLang) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        document.documentElement.setAttribute('lang', targetLang);
    }

    function setLanguage(lang) {
        if (lang !== 'ru' && lang !== 'kz') return;
        if (currentLang === lang) return;

        const prevLang = currentLang;
        currentLang = lang;
        localStorage.setItem('alem_lang', lang);

        translateDOM(lang);
        console.log(\`🌐 Language switched from \${prevLang} to \${lang}\`);
    }

    window.setLanguage = setLanguage;

    // Apply saved language on page load
    window.addEventListener('DOMContentLoaded', () => {
        if (currentLang === 'kz') {
            translateDOM('kz');
        }
    });

    console.log(\`🌐 AlemEdu Bilingual System Loaded (\${DICTIONARY.length} terms). Current lang: \${currentLang}\`);
})();
`;

fs.writeFileSync(path.join(__dirname, '..', 'js', 'translations.js'), jsContent, 'utf8');
console.log('✅ Updated js/translations.js successfully!');
