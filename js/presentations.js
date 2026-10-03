/**
 * AlemEdu - Interactive AI Presentation Generator & Fullscreen Classroom Presenter
 * Supports Physics, CS, Math, Natural Sciences, History, and Self-Knowledge
 */

window.presentationsState = {
    presentations: [],
    currentEditing: null,
    player: {
        active: false,
        presentation: null,
        currentSlide: 0,
        laserActive: false,
        fullscreen: false,
        notesVisible: false
    }
};

// Initial Sample Presentations if none saved
const DEFAULT_PRESENTATIONS = [
    {
        id: "pres_phys_newton",
        title: "Законы Ньютона и Механика",
        subject: "Физика",
        grade: "10 класс",
        theme: "space-violet",
        slideCount: 5,
        createdAt: "2026-10-03",
        author: "Учитель Физики",
        slides: [
            {
                id: 1,
                layout: "title",
                title: "Законы Ньютона",
                subtitle: "Фундамент классической механики и движения тел",
                tag: "10 КЛАСС • ФИЗИКА • МЕХАНИКА",
                points: [
                    "Инерциальные системы отсчета",
                    "Связь силы, массы и ускорения",
                    "Взаимодействие тел и силы реакции"
                ],
                visual: "⚛️",
                notes: "Начните урок с примера торможения автобуса или запуска ракеты в космос."
            },
            {
                id: 2,
                layout: "content-bullets",
                title: "1-й Закон Ньютона (Закон Инерции)",
                subtitle: "Принцип движения без действия внешних сил",
                points: [
                    "Существуют такие системы отсчета (инерциальные), в которых тело сохраняет состояние покоя или равномерного прямолинейного движения, пока на него не подействуют внешние силы.",
                    "Пример: В глубоком космосе корабль летит с постоянной скоростью без работы двигателей.",
                    "Масса — мера инертности тела: чем больше масса, тем труднее изменить его скорость."
                ],
                visual: "🚗",
                notes: "Спросите у класса: почему при резком повороте машины нас заносит в сторону?"
            },
            {
                id: 3,
                layout: "code-formula",
                title: "2-й Закон Ньютона — Уравнение Движения",
                subtitle: "Математическое выражение связи Силы и Ускорения",
                formula: "F⃗ = m · a⃗   ⇒   a⃗ = F⃗ / m",
                points: [
                    "Ускорение a⃗ прямо пропорционально равнодействующей всех сил F⃗ и обратно пропорционально массе m.",
                    "Единица измерения силы: 1 Ньютон (1 Н = 1 кг·м/с²).",
                    "Если на тело действуют несколько сил, F⃗ представляет собой их векторную сумму (равнодействующую)."
                ],
                visual: "📐",
                notes: "Разберите задачу: под действием силы 20 Н брусок массой 4 кг получает ускорение 5 м/с²."
            },
            {
                id: 4,
                layout: "two-column",
                title: "3-й Закон Ньютона — Действие и Противодействие",
                col1Title: "Сила Действия (F₁₂)",
                col1Points: [
                    "Первое тело действует на второе с силой F₁₂",
                    "Направлена в сторону воздействия",
                    "Пример: Сгорающий газ выталкивается из сопла ракеты вниз"
                ],
                col2Title: "Сила Противодействия (F₂₁)",
                col2Points: [
                    "Второе тело действует на первое с силой F₂₁",
                    "F₁₂ = -F₂₁ (равны по модулю, противоположны по направлению)",
                    "Пример: Газ толкает ракету вверх в космос!"
                ],
                visual: "🚀",
                notes: "Акцентируйте внимание: эти силы приложены к РАЗНЫМ телам, поэтому они НЕ компенсируют друг друга!"
            },
            {
                id: 5,
                layout: "quiz",
                title: "Интерактивная проверка знаний 🧠",
                question: "Космический аппарат летит в мега-пространстве с выключенным двигателем. Какое движение он совершает по 1-му закону Ньютона?",
                options: [
                    "A) Постепенно замедляется из-за отсутствия энергии",
                    "B) Двигается бесконечно с постоянной скоростью прямолинейно",
                    "C) Начинает вращаться по круговой орбите",
                    "D) Мгновенно останавливается"
                ],
                correctIndex: 1,
                explanation: "Правильно! В отсутствие внешних сил (сопротивления воздуха и трения) тело сохраняет свою скорость по инерции!"
            }
        ]
    },
    {
        id: "pres_py_intro",
        title: "Введение в Python и ИИ",
        subject: "Информатика",
        grade: "9 класс",
        theme: "cyber",
        slideCount: 4,
        createdAt: "2026-10-03",
        author: "Учитель Информатики",
        slides: [
            {
                id: 1,
                layout: "title",
                title: "Язык Программирования Python",
                subtitle: "От базовых скриптов до машинного обучения и нейросетей",
                tag: "9-11 КЛАСС • ИНФОРМАТИКА",
                points: ["Простой и читаемый синтаксис", "Динамическая типизация", "Мировая экосистема ИИ (TensorFlow, PyTorch)"],
                visual: "🐍",
                notes: "Покажите насколько Python лаконичен по сравнению с C++ или Java."
            },
            {
                id: 2,
                layout: "code-formula",
                title: "Переменные и Базовые Типы Данных",
                subtitle: "Работа с числами, строками и списками",
                codeSnippet: `# Переменные в Python\nname = "AlemEdu AI"\nstudents_count = 28\nis_active = True\nscores = [95, 88, 100, 92]\n\nprint(f"Класс {name}: средний балл {sum(scores)/len(scores):.1f}")`,
                points: [
                    "Строки (str), Целые числа (int), Дробные (float), Логические (bool).",
                    "Списки (list) позволяют хранить упорядоченные коллекции элементов.",
                    "F-строки (f\"...\") — удобный способ форматирования текста с переменными."
                ],
                visual: "💻",
                notes: "Предложите ученикам изменить список `scores` и посчитать результат."
            },
            {
                id: 3,
                layout: "content-bullets",
                title: "Условные Операторы (if - elif - else)",
                subtitle: "Принятие решений в алгоритмах",
                points: [
                    "Оператор if проверяет истинность логического выражения (True / False).",
                    "Блоки кода выделяются отступами (4 пробела или Tab) — это ключевая особенность Python!",
                    "elif используется для проверки нескольких альтернативных условий."
                ],
                visual: "🔀",
                notes: "Объясните важность синтаксических отступов (indentation)."
            },
            {
                id: 4,
                layout: "quiz",
                title: "Блиц-тест по Python ⚡",
                question: "Что выведет следующий код на Python: print(len([10, 20, 30]) * 2)?",
                options: [
                    "A) 6",
                    "B) [10, 20, 30, 10, 20, 30]",
                    "C) 60",
                    "D) Ошибка типа (TypeError)"
                ],
                correctIndex: 0,
                explanation: "Верно! Длина списка len([10, 20, 30]) равна 3. 3 * 2 = 6."
            }
        ]
    }
];

// Initialize Presentations in localStorage / Firebase
window.initPresentations = function() {
    try {
        const local = localStorage.getItem('alemedu_presentations');
        if (local) {
            window.presentationsState.presentations = JSON.parse(local);
        } else {
            window.presentationsState.presentations = DEFAULT_PRESENTATIONS;
            localStorage.setItem('alemedu_presentations', JSON.stringify(DEFAULT_PRESENTATIONS));
        }
    } catch (e) {
        console.error('Error loading local presentations:', e);
        window.presentationsState.presentations = DEFAULT_PRESENTATIONS;
    }
    window.syncPresentationsWithFirebase();
};

// Sync with Firebase Firestore
window.syncPresentationsWithFirebase = async function() {
    if (!window.fireDB) return;
    try {
        const snap = await window.fireDB.collection('presentations').get();
        if (!snap.empty) {
            const list = [];
            snap.forEach(doc => {
                list.push({ id: doc.id, ...doc.data() });
            });
            window.presentationsState.presentations = list;
            localStorage.setItem('alemedu_presentations', JSON.stringify(list));
            window.renderPresentationsList();
        }
    } catch (e) {
        console.log('Firebase presentations fetch fallback to local:', e.message);
    }
};

// Render Presentations List in Teacher or Student View
window.renderPresentationsList = function() {
    const tGrid = document.getElementById('t-presentations-grid');
    const sGrid = document.getElementById('s-presentations-grid');
    const list = window.presentationsState.presentations || [];

    const buildCardHTML = (item, isTeacher = true) => `
        <div class="presentation-card" style="background:rgba(15,23,42,0.8); border:1px solid rgba(139,92,246,0.3); border-radius:16px; padding:20px; display:flex; flex-direction:column; justify-content:space-between; transition:transform 0.2s, box-shadow 0.2s; box-shadow:0 10px 30px rgba(0,0,0,0.3);" onmouseover="this.style.transform='translateY(-4px)'; this.style.borderColor='rgba(168,85,247,0.6)'" onmouseout="this.style.transform='none'; this.style.borderColor='rgba(139,92,246,0.3)'">
            <div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <span style="background:rgba(139,92,246,0.2); color:#c084fc; border:1px solid rgba(139,92,246,0.4); padding:4px 10px; border-radius:20px; font-size:0.75rem; font-weight:700;">${item.subject || 'Предмет'}</span>
                    <span style="color:#94a3b8; font-size:0.75rem;">${item.slides ? item.slides.length : 0} слайдов</span>
                </div>
                <h3 style="color:white; font-size:1.15rem; font-weight:700; margin:0 0 8px 0; line-height:1.3;">${item.title}</h3>
                <div style="font-size:0.8rem; color:#94a3b8; margin-bottom:16px;">
                    <span>🎓 ${item.grade || 'Все классы'}</span> • <span>📅 ${item.createdAt || '2026'}</span>
                </div>
            </div>
            <div style="display:flex; gap:8px; border-top:1px solid rgba(255,255,255,0.08); padding-top:14px; margin-top:10px;">
                <button onclick="window.startPresentation('${item.id}')" style="flex:1; padding:9px 14px; background:linear-gradient(135deg,#8b5cf6,#ec4899); color:white; border:none; border-radius:10px; font-size:0.82rem; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; box-shadow:0 4px 12px rgba(139,92,246,0.3);">
                    ▶️ Запустить
                </button>
                ${isTeacher ? `
                <button onclick="window.openPresentationEditor('${item.id}')" title="Редактировать" style="padding:9px 12px; background:rgba(255,255,255,0.08); color:#e2e8f0; border:1px solid rgba(255,255,255,0.15); border-radius:10px; font-size:0.85rem; cursor:pointer;">
                    ✏️
                </button>
                <button onclick="window.deletePresentation('${item.id}')" title="Удалить" style="padding:9px 12px; background:rgba(239,68,68,0.15); color:#fca5a5; border:1px solid rgba(239,68,68,0.3); border-radius:10px; font-size:0.85rem; cursor:pointer;">
                    🗑️
                </button>
                ` : ''}
            </div>
        </div>
    `;

    if (tGrid) {
        if (list.length === 0) {
            tGrid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:50px; color:#94a3b8;">У вас пока нет созданных презентаций. Нажмите «✨ Сгенерировать с ИИ» чтобы создать первую!</div>`;
        } else {
            tGrid.innerHTML = list.map(item => buildCardHTML(item, true)).join('');
        }
    }

    if (sGrid) {
        if (list.length === 0) {
            sGrid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:50px; color:#94a3b8;">Пока нет доступных презентаций от учителей.</div>`;
        } else {
            sGrid.innerHTML = list.map(item => buildCardHTML(item, false)).join('');
        }
    }
};

// Smart AI Presentation Generator
window.generateAiPresentation = async function() {
    const topicInput = document.getElementById('pres-ai-topic');
    const subjectSelect = document.getElementById('pres-ai-subject');
    const gradeSelect = document.getElementById('pres-ai-grade');
    const countSelect = document.getElementById('pres-ai-count');
    const themeSelect = document.getElementById('pres-ai-theme');
    const btn = document.getElementById('pres-ai-gen-btn');

    const topic = topicInput ? topicInput.value.trim() : '';
    if (!topic) {
        alert('Пожалуйста, введите тему презентации!');
        return;
    }

    const subject = subjectSelect ? subjectSelect.value : 'Физика';
    const grade = gradeSelect ? gradeSelect.value : '10 класс';
    const slideCount = parseInt(countSelect ? countSelect.value : '5', 10);
    const theme = themeSelect ? themeSelect.value : 'space-violet';

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '✨ ИИ генерирует слайды... (до 10-15 сек)';
    }

    try {
        const promptText = `Создай образовательную презентацию на тему "${topic}" для предмета "${subject}" (${grade}). 
Количество слайдов: ${slideCount}.
Ответь ТОЛЬКО в формате JSON, без маркдауна и лишних слов.
Формат JSON:
[
  {
    "id": 1,
    "layout": "title", // варианты: title, content-bullets, code-formula, two-column, quiz
    "title": "Заголовок слайда",
    "subtitle": "Подзаголовок слайда",
    "points": ["пункт 1", "пункт 2", "пункт 3"],
    "visual": "emoji",
    "notes": "заметки для учителя (speaker notes)",
    "col1Title": "Только для two-column",
    "col1Points": ["Только для two-column"],
    "col2Title": "Только для two-column",
    "col2Points": ["Только для two-column"],
    "formula": "Только для code-formula",
    "codeSnippet": "Только для code-formula",
    "question": "Только для quiz",
    "options": ["ответ 1", "ответ 2", "ответ 3", "ответ 4"],
    "correctIndex": 0, // Только для quiz
    "explanation": "Только для quiz"
  }
]
ОБЯЗАТЕЛЬНО: сделай каждый слайд уникальным и релевантным. Убедись, что JSON строго валиден.`;

        const fetchFn = window.fetchApi || fetch;
        const response = await fetchFn(window.ENV.LLM_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.ENV.LLM_API_KEY}`
            },
            body: JSON.stringify({
                model: "alemllm",
                messages: [{ role: "user", content: promptText }]
            })
        });

        if (!response.ok) {
            throw new Error(`Ошибка API: ${response.status}`);
        }

        const data = await response.json();
        let aiText = data.choices[0].message.content.trim();
        
        // Remove markdown formatting if any
        if (aiText.startsWith('```json')) {
            aiText = aiText.replace(/^```json/, '').replace(/```$/, '').trim();
        } else if (aiText.startsWith('```')) {
            aiText = aiText.replace(/^```/, '').replace(/```$/, '').trim();
        }

        const generatedSlides = JSON.parse(aiText);

        const newPres = {
            id: 'pres_' + Date.now(),
            title: topic,
            subject: subject,
            grade: grade,
            theme: theme,
            slideCount: generatedSlides.length,
            createdAt: new Date().toISOString().split('T')[0],
            author: (window.currentUser && window.currentUser.email) ? window.currentUser.email : 'Учитель AlemEdu',
            slides: generatedSlides
        };

        window.presentationsState.presentations.unshift(newPres);
        window.savePresentationsToStorage();

        if (topicInput) topicInput.value = '';
        window.renderPresentationsList();
        
        // Open Editor to review/customize
        window.openPresentationEditor(newPres.id);
    } catch (err) {
        console.error("AI Gen Error:", err);
        alert('Произошла ошибка при генерации презентации: ' + err.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '✨ Сгенерировать презентацию с ИИ';
        }
    }
};

// Generates educational slide structure based on Subject & Topic
window.buildSlidesForTopic = function(topic, subject, grade, count) {
    const slides = [];

    // Slide 1: Title Slide
    let visualIcon = '⚛️';
    if (subject === 'Информатика') visualIcon = '💻';
    if (subject === 'Естествознание') visualIcon = '🌿';
    if (subject === 'Математика') visualIcon = '📐';
    if (subject === 'История Казахстана') visualIcon = '🇰🇿';
    if (subject === 'Самопознание') visualIcon = '🧘';

    slides.push({
        id: 1,
        layout: 'title',
        title: topic,
        subtitle: `Интерактивный учебный материал для ${grade}`,
        tag: `${grade.toUpperCase()} • ${subject.toUpperCase()}`,
        points: [
            `Основы и ключевые понятия темы «${topic}»`,
            "Практические примеры и явления в реальном мире",
            "Интерактивная проверка усвоения знаний"
        ],
        visual: visualIcon,
        notes: `Презентация подготовлена для ${grade} по предмету ${subject}.`
    });

    // Slide 2: Core Concept & Definitions
    slides.push({
        id: 2,
        layout: 'content-bullets',
        title: `Главные понятия: ${topic}`,
        subtitle: 'Определения, термины и физическая/логическая суть',
        points: [
            `Сущность феномена «${topic}» заключается в фундаментальных законах природы и науки.`,
            `Ключевые величины и параметры, определяющие поведение системы.`,
            `Значение изучения темы в современном научно-техническом прогрессе.`
        ],
        visual: '💡',
        notes: "Подробно разберите каждый тезис со слушателями."
    });

    // Slide 3: Formula / Code / Deep Detail
    if (subject === 'Информатика') {
        slides.push({
            id: 3,
            layout: 'code-formula',
            title: 'Программная реализация и Код',
            subtitle: 'Алгоритмический пример на Python',
            codeSnippet: `# Код для темы: ${topic}\ndef process_data(value):\n    print(f"Обработка темы ${topic}: {value}")\n    return value * 2\n\nresult = process_data(42)\nprint("Результат работы:", result)`,
            points: [
                "Функции и структуры данных в языке Python.",
                "Оптимизация сложности алгоритма O(N).",
                "Применение библиотеки в практических задачах."
            ],
            visual: '⚡',
            notes: "Попросите учеников запустить этот код в Python компиляторе AlemEdu."
        });
    } else if (subject === 'Математика' || subject === 'Физика') {
        slides.push({
            id: 3,
            layout: 'code-formula',
            title: 'Формулы и Математическая Модель',
            subtitle: 'Уравнения и количественный анализ',
            formula: "E = m · c²   |   F⃗ = m · a⃗   |   W = ∫ F dx",
            points: [
                "Связь физических параметров через формулы и коэффициенты.",
                "Единицы измерения в системе СИ (Международная система единиц).",
                "Графическая интерпретация зависимостей параметров."
            ],
            visual: '📊',
            notes: "Обратите внимание на физический смысл коэффициентов в формуле."
        });
    } else {
        slides.push({
            id: 3,
            layout: 'two-column',
            title: 'Сравнительный анализ и Факты',
            col1Title: 'Основные свойства',
            col1Points: [
                "Характерные признаки и закономерности",
                "Стабильность и факторы воздействия",
                "Примеры проявления в природе"
            ],
            col2Title: 'Применение на практике',
            col2Points: [
                "Использование в современной промышленности",
                "Экологический и социальный аспект",
                "Перспективы научных исследований"
            ],
            visual: '🔬',
            notes: "Сравните колонки с ребятами на уроке."
        });
    }

    // Slide 4: Real-world Application / 2-Column
    if (count >= 4) {
        slides.push({
            id: 4,
            layout: 'two-column',
            title: `${topic} в Реальной Жизни`,
            col1Title: 'Где мы встречаем?',
            col1Points: [
                "В повседневных природных явлениях вокруг нас",
                "В современной технике, гаджетах и транспорте",
                "В производственных процессах предприятий"
            ],
            col2Title: 'Почему это важно знать?',
            col2Points: [
                "Понимать причины происходящих событий",
                "Безопасность и эффективное использование ресурсов",
                "База для успешного сдачи экзаменов и СОР/СОЧ"
            ],
            visual: '🌍',
            notes: "Приведите личный пример из жизни."
        });
    }

    // Slide 5: Quiz Slide
    slides.push({
        id: slides.length + 1,
        layout: 'quiz',
        title: 'Контрольный Вопрос 🧠',
        question: `Какой главный вывод можно сделать по теме «${topic}»?`,
        options: [
            `A) ${topic} является ключевым понятием в курсе ${subject}`,
            `B) Это явление происходит случайно и не подчиняется законам`,
            `C) Формулы и алгоритмы темы не применяются на практике`,
            `D) Ни один из вариантов не верен`
        ],
        correctIndex: 0,
        explanation: `Отлично! Тема «${topic}» действительно лежит в основе многих законов науки и практики.`
    });

    return slides.slice(0, count);
};

// Save state to localStorage & Firebase
window.savePresentationsToStorage = async function() {
    const list = window.presentationsState.presentations;
    localStorage.setItem('alemedu_presentations', JSON.stringify(list));

    if (window.fireDB) {
        try {
            // Push top item to Firestore
            if (list.length > 0) {
                const item = list[0];
                await window.fireDB.collection('presentations').doc(item.id).set(item, { merge: true });
            }
        } catch (e) {
            console.error('Error saving presentation to Firebase:', e);
        }
    }
};

// Delete Presentation
window.deletePresentation = async function(id) {
    if (!confirm('Вы уверены, что хотите удалить эту презентацию?')) return;
    window.presentationsState.presentations = window.presentationsState.presentations.filter(p => p.id !== id);
    window.savePresentationsToStorage();
    window.renderPresentationsList();

    if (window.fireDB) {
        try {
            await window.fireDB.collection('presentations').doc(id).delete();
        } catch(e) {}
    }
};

// Open Editor Modal
window.openPresentationEditor = function(id) {
    let pres = window.presentationsState.presentations.find(p => p.id === id);
    if (!pres) return;

    window.presentationsState.currentEditing = JSON.parse(JSON.stringify(pres));
    const modal = document.getElementById('presentation-editor-modal');
    if (!modal) return;

    document.getElementById('edit-pres-title').value = pres.title || '';
    document.getElementById('edit-pres-subject').value = pres.subject || 'Физика';
    document.getElementById('edit-pres-theme').value = pres.theme || 'space-violet';

    window.renderEditorSlideTabs();
    window.renderEditorCurrentSlide();

    modal.style.display = 'flex';
};

window.closePresentationEditor = function() {
    const modal = document.getElementById('presentation-editor-modal');
    if (modal) modal.style.display = 'none';
};

let activeEditorSlideIdx = 0;

window.renderEditorSlideTabs = function() {
    const pres = window.presentationsState.currentEditing;
    const tabsContainer = document.getElementById('editor-slide-tabs');
    if (!pres || !tabsContainer) return;

    tabsContainer.innerHTML = pres.slides.map((s, idx) => `
        <button onclick="window.selectEditorSlide(${idx})" style="padding:8px 14px; background:${idx === activeEditorSlideIdx ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.05)'}; color:${idx === activeEditorSlideIdx ? '#c084fc' : '#cbd5e1'}; border:1px solid ${idx === activeEditorSlideIdx ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.1)'}; border-radius:8px; font-weight:700; cursor:pointer; white-space:nowrap;">
            Слайд ${idx + 1}
        </button>
    `).join('') + `
        <button onclick="window.addSlideToEditing()" style="padding:8px 14px; background:rgba(16,185,129,0.2); color:#34d399; border:1px solid rgba(16,185,129,0.4); border-radius:8px; font-weight:700; cursor:pointer;">
            + Слайд
        </button>
    `;
};

window.selectEditorSlide = function(idx) {
    activeEditorSlideIdx = idx;
    window.renderEditorSlideTabs();
    window.renderEditorCurrentSlide();
};

window.addSlideToEditing = function() {
    const pres = window.presentationsState.currentEditing;
    if (!pres) return;
    pres.slides.push({
        id: pres.slides.length + 1,
        layout: 'content-bullets',
        title: 'Новый Слайд',
        subtitle: 'Подзаголовок слайда',
        points: ['Тезис 1', 'Тезис 2'],
        visual: '📌',
        notes: 'Заметки учителя'
    });
    activeEditorSlideIdx = pres.slides.length - 1;
    window.renderEditorSlideTabs();
    window.renderEditorCurrentSlide();
};

window.renderEditorCurrentSlide = function() {
    const pres = window.presentationsState.currentEditing;
    const formContainer = document.getElementById('editor-slide-form');
    if (!pres || !formContainer) return;

    const slide = pres.slides[activeEditorSlideIdx];
    if (!slide) return;

    formContainer.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h4 style="color:#c084fc; margin:0;">Редактирование Слайда №${activeEditorSlideIdx + 1}</h4>
                <button onclick="window.deleteEditorCurrentSlide()" style="background:rgba(239,68,68,0.15); color:#fca5a5; border:1px solid rgba(239,68,68,0.3); padding:4px 10px; border-radius:6px; font-size:0.78rem; cursor:pointer;">Удалить слайд</button>
            </div>
            <div>
                <label style="font-size:0.8rem; color:#94a3b8; display:block; margin-bottom:4px;">Тип макета (Layout):</label>
                <select id="slide-edit-layout" onchange="window.updateEditorSlideField('layout', this.value)" style="width:100%; padding:8px; background:#1e293b; color:white; border:1px solid rgba(255,255,255,0.1); border-radius:8px;">
                    <option value="title" ${slide.layout === 'title' ? 'selected' : ''}>Титульный слайд</option>
                    <option value="content-bullets" ${slide.layout === 'content-bullets' ? 'selected' : ''}>Текст + Списки</option>
                    <option value="code-formula" ${slide.layout === 'code-formula' ? 'selected' : ''}>Формула / Код Python</option>
                    <option value="two-column" ${slide.layout === 'two-column' ? 'selected' : ''}>2 Две колонки (Сравнение)</option>
                    <option value="quiz" ${slide.layout === 'quiz' ? 'selected' : ''}>Интерактивный Вопрос (Тест)</option>
                </select>
            </div>
            <div>
                <label style="font-size:0.8rem; color:#94a3b8; display:block; margin-bottom:4px;">Заголовок слайда:</label>
                <input type="text" value="${slide.title || ''}" oninput="window.updateEditorSlideField('title', this.value)" style="width:100%; padding:8px 12px; background:#1e293b; color:white; border:1px solid rgba(255,255,255,0.1); border-radius:8px;">
            </div>
            <div>
                <label style="font-size:0.8rem; color:#94a3b8; display:block; margin-bottom:4px;">Подзаголовок / Описание:</label>
                <input type="text" value="${slide.subtitle || ''}" oninput="window.updateEditorSlideField('subtitle', this.value)" style="width:100%; padding:8px 12px; background:#1e293b; color:white; border:1px solid rgba(255,255,255,0.1); border-radius:8px;">
            </div>
            <div>
                <label style="font-size:0.8rem; color:#94a3b8; display:block; margin-bottom:4px;">Тезисы (каждая строчка — новый пункт):</label>
                <textarea oninput="window.updateEditorSlideField('points', this.value.split('\\n'))" style="width:100%; height:80px; padding:8px 12px; background:#1e293b; color:white; border:1px solid rgba(255,255,255,0.1); border-radius:8px;">${(slide.points || []).join('\n')}</textarea>
            </div>
            <div>
                <label style="font-size:0.8rem; color:#94a3b8; display:block; margin-bottom:4px;">Заметки учителя (Speaker Notes):</label>
                <input type="text" value="${slide.notes || ''}" oninput="window.updateEditorSlideField('notes', this.value)" style="width:100%; padding:8px 12px; background:#1e293b; color:white; border:1px solid rgba(255,255,255,0.1); border-radius:8px;">
            </div>
        </div>
    `;
};

window.updateEditorSlideField = function(field, val) {
    const pres = window.presentationsState.currentEditing;
    if (!pres || !pres.slides[activeEditorSlideIdx]) return;
    pres.slides[activeEditorSlideIdx][field] = val;
};

window.deleteEditorCurrentSlide = function() {
    const pres = window.presentationsState.currentEditing;
    if (!pres || pres.slides.length <= 1) {
        alert('В презентации должен оставаться хотя бы 1 слайд!');
        return;
    }
    pres.slides.splice(activeEditorSlideIdx, 1);
    activeEditorSlideIdx = Math.max(0, activeEditorSlideIdx - 1);
    window.renderEditorSlideTabs();
    window.renderEditorCurrentSlide();
};

window.saveEditorChanges = function() {
    const pres = window.presentationsState.currentEditing;
    if (!pres) return;

    pres.title = document.getElementById('edit-pres-title').value.trim() || pres.title;
    pres.subject = document.getElementById('edit-pres-subject').value;
    pres.theme = document.getElementById('edit-pres-theme').value;
    pres.slideCount = pres.slides.length;

    const idx = window.presentationsState.presentations.findIndex(p => p.id === pres.id);
    if (idx !== -1) {
        window.presentationsState.presentations[idx] = pres;
    } else {
        window.presentationsState.presentations.unshift(pres);
    }

    window.savePresentationsToStorage();
    window.renderPresentationsList();
    window.closePresentationEditor();
};

// =============================================
// FULLSCREEN PRESENTATION PLAYER ENGINE
// =============================================

window.startPresentation = function(presId) {
    const pres = window.presentationsState.presentations.find(p => p.id === presId);
    if (!pres) return;

    window.presentationsState.player.active = true;
    window.presentationsState.player.presentation = pres;
    window.presentationsState.player.currentSlide = 0;
    window.presentationsState.player.laserActive = false;

    const modal = document.getElementById('presentation-player-modal');
    if (!modal) return;

    modal.style.display = 'flex';
    if (document.body) document.body.style.overflow = 'hidden';

    window.renderPlayerSlide();
    window.setupPlayerKeyboardListeners();
};

window.closePresentationPlayer = function() {
    window.presentationsState.player.active = false;
    const modal = document.getElementById('presentation-player-modal');
    if (modal) modal.style.display = 'none';
    if (document.body) document.body.style.overflow = 'auto';
    window.removePlayerKeyboardListeners();
};

window.playerNextSlide = function() {
    const p = window.presentationsState.player;
    if (!p.presentation) return;
    if (p.currentSlide < p.presentation.slides.length - 1) {
        p.currentSlide++;
        window.renderPlayerSlide();
    }
};

window.playerPrevSlide = function() {
    const p = window.presentationsState.player;
    if (!p.presentation) return;
    if (p.currentSlide > 0) {
        p.currentSlide--;
        window.renderPlayerSlide();
    }
};

window.renderPlayerSlide = function() {
    const p = window.presentationsState.player;
    const pres = p.presentation;
    if (!pres) return;

    const slide = pres.slides[p.currentSlide];
    const total = pres.slides.length;

    // Set Theme
    const stage = document.getElementById('player-slide-stage');
    if (stage) {
        let themeBg = 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)'; // default space violet
        if (pres.theme === 'emerald') themeBg = 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)';
        if (pres.theme === 'cyber') themeBg = 'linear-gradient(135deg, #090d16 0%, #172554 100%)';
        if (pres.theme === 'amber') themeBg = 'linear-gradient(135deg, #451a03 0%, #18181b 100%)';
        stage.style.background = themeBg;
    }

    // Update Counter & Progress
    document.getElementById('player-slide-counter').textContent = `${p.currentSlide + 1} / ${total}`;
    document.getElementById('player-pres-title').textContent = pres.title;
    
    const progressPct = ((p.currentSlide + 1) / total) * 100;
    document.getElementById('player-progress-bar').style.width = `${progressPct}%`;

    // Notes
    const notesElem = document.getElementById('player-speaker-notes');
    if (notesElem) {
        notesElem.textContent = slide.notes ? `💡 Заметки учителя: ${slide.notes}` : 'Заметок к этому слайду нет.';
    }

    // Build Slide Content HTML
    const contentArea = document.getElementById('player-slide-content');
    if (!contentArea) return;

    let slideHTML = '';

    if (slide.layout === 'title') {
        slideHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; height:100%; gap:24px; animation: slideFadeIn 0.4s ease-out;">
                <div style="font-size:4.5rem; filter:drop-shadow(0 10px 20px rgba(0,0,0,0.5));">${slide.visual || '⚛️'}</div>
                <div style="background:rgba(139,92,246,0.2); border:1px solid rgba(139,92,246,0.4); color:#c084fc; padding:6px 18px; border-radius:30px; font-size:0.85rem; font-weight:700; letter-spacing:1px;">${slide.tag || 'ПРЕЗЕНТАЦИЯ'}</div>
                <h1 style="font-size:2.8rem; font-weight:800; color:white; margin:0; line-height:1.2; text-shadow:0 10px 30px rgba(0,0,0,0.5);">${slide.title}</h1>
                <p style="font-size:1.3rem; color:#cbd5e1; max-width:700px; margin:0; line-height:1.5;">${slide.subtitle || ''}</p>
                <div style="display:flex; gap:16px; margin-top:20px; flex-wrap:wrap; justify-content:center;">
                    ${(slide.points || []).map(pt => `<span style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); color:#e2e8f0; padding:8px 16px; border-radius:12px; font-size:0.95rem;">• ${pt}</span>`).join('')}
                </div>
            </div>
        `;
    } else if (slide.layout === 'code-formula') {
        slideHTML = `
            <div style="display:flex; flex-direction:column; height:100%; justify-content:center; gap:20px; animation: slideFadeIn 0.4s ease-out;">
                <div>
                    <h2 style="font-size:2.2rem; font-weight:700; color:white; margin:0 0 6px 0;">${slide.title}</h2>
                    <p style="font-size:1.05rem; color:#a78bfa; margin:0;">${slide.subtitle || ''}</p>
                </div>
                ${slide.formula ? `
                <div style="background:rgba(0,0,0,0.4); border:2px solid rgba(139,92,246,0.5); border-radius:16px; padding:24px; text-align:center; box-shadow:0 10px 30px rgba(0,0,0,0.4);">
                    <div style="font-family:'Courier New', monospace; font-size:2.4rem; font-weight:800; color:#38bdf8; letter-spacing:2px;">${slide.formula}</div>
                </div>
                ` : ''}
                ${slide.codeSnippet ? `
                <div style="background:#090d16; border:1px solid rgba(59,130,246,0.3); border-radius:14px; padding:18px; font-family:'Courier New', monospace; font-size:0.95rem; color:#a3e635; line-height:1.6; white-space:pre-wrap; overflow-x:auto;">${slide.codeSnippet}</div>
                ` : ''}
                <div style="display:flex; flex-direction:column; gap:10px; background:rgba(255,255,255,0.04); padding:18px; border-radius:14px; border:1px solid rgba(255,255,255,0.08);">
                    ${(slide.points || []).map(pt => `<div style="font-size:1.05rem; color:#e2e8f0; display:flex; align-items:flex-start; gap:10px;"><span style="color:#a855f7;">🔹</span> <span>${pt}</span></div>`).join('')}
                </div>
            </div>
        `;
    } else if (slide.layout === 'two-column') {
        slideHTML = `
            <div style="display:flex; flex-direction:column; height:100%; justify-content:center; gap:20px; animation: slideFadeIn 0.4s ease-out;">
                <div>
                    <h2 style="font-size:2.2rem; font-weight:700; color:white; margin:0 0 6px 0;">${slide.title}</h2>
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
                    <div style="background:rgba(59,130,246,0.1); border:1px solid rgba(59,130,246,0.3); border-radius:16px; padding:20px;">
                        <h3 style="color:#60a5fa; font-size:1.2rem; margin:0 0 14px 0;">${slide.col1Title || 'Колонка 1'}</h3>
                        <div style="display:flex; flex-direction:column; gap:10px;">
                            ${(slide.col1Points || []).map(p => `<div style="color:#e2e8f0; font-size:0.95rem;">• ${p}</div>`).join('')}
                        </div>
                    </div>
                    <div style="background:rgba(236,72,153,0.1); border:1px solid rgba(236,72,153,0.3); border-radius:16px; padding:20px;">
                        <h3 style="color:#f472b6; font-size:1.2rem; margin:0 0 14px 0;">${slide.col2Title || 'Колонка 2'}</h3>
                        <div style="display:flex; flex-direction:column; gap:10px;">
                            ${(slide.col2Points || []).map(p => `<div style="color:#e2e8f0; font-size:0.95rem;">• ${p}</div>`).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else if (slide.layout === 'quiz') {
        slideHTML = `
            <div style="display:flex; flex-direction:column; height:100%; justify-content:center; gap:20px; animation: slideFadeIn 0.4s ease-out;">
                <div style="text-align:center;">
                    <span style="background:rgba(245,158,11,0.2); color:#fbbf24; border:1px solid rgba(245,158,11,0.4); padding:4px 14px; border-radius:20px; font-size:0.8rem; font-weight:700;">ИНТЕРАКТИВНЫЙ ОПРОС</span>
                    <h2 style="font-size:2rem; font-weight:700; color:white; margin:12px 0 0 0;">${slide.title}</h2>
                </div>
                <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); border-radius:16px; padding:20px; text-align:center;">
                    <div style="font-size:1.25rem; font-weight:600; color:#e2e8f0;">${slide.question}</div>
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                    ${(slide.options || []).map((opt, idx) => `
                        <button onclick="window.checkSlideQuizAnswer(${idx}, ${slide.correctIndex})" id="quiz-opt-btn-${idx}" style="padding:16px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.15); border-radius:12px; color:white; font-size:1rem; font-weight:600; cursor:pointer; text-align:left; transition:all 0.2s;">
                            ${opt}
                        </button>
                    `).join('')}
                </div>
                <div id="quiz-explanation-box" style="display:none; padding:14px; background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.4); border-radius:12px; color:#34d399; font-size:0.95rem; text-align:center;">
                    ${slide.explanation || 'Правильный ответ! Отличная работа.'}
                </div>
            </div>
        `;
    } else {
        // Content-bullets default
        slideHTML = `
            <div style="display:flex; flex-direction:column; height:100%; justify-content:center; gap:20px; animation: slideFadeIn 0.4s ease-out;">
                <div style="display:flex; align-items:center; gap:14px;">
                    <span style="font-size:2.5rem;">${slide.visual || '📌'}</span>
                    <div>
                        <h2 style="font-size:2.3rem; font-weight:700; color:white; margin:0;">${slide.title}</h2>
                        <p style="font-size:1.1rem; color:#c084fc; margin:4px 0 0 0;">${slide.subtitle || ''}</p>
                    </div>
                </div>
                <div style="display:flex; flex-direction:column; gap:14px; background:rgba(0,0,0,0.3); padding:24px; border-radius:18px; border:1px solid rgba(255,255,255,0.08);">
                    ${(slide.points || []).map(pt => `
                        <div style="font-size:1.15rem; color:#e2e8f0; display:flex; align-items:flex-start; gap:12px; line-height:1.5;">
                            <span style="color:#34d399; font-size:1.3rem;">•</span>
                            <span>${pt}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    contentArea.innerHTML = slideHTML;
};

// Check Quiz Answer
window.checkSlideQuizAnswer = function(optIdx, correctIdx) {
    const isCorrect = (optIdx === correctIdx);
    const btn = document.getElementById(`quiz-opt-btn-${optIdx}`);
    if (btn) {
        if (isCorrect) {
            btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
            btn.style.borderColor = '#34d399';
        } else {
            btn.style.background = 'linear-gradient(135deg, #ef4444, #991b1b)';
            btn.style.borderColor = '#fca5a5';
        }
    }
    const exp = document.getElementById('quiz-explanation-box');
    if (exp) exp.style.display = 'block';
};

// Laser Pointer Toggle
window.toggleLaserPointer = function() {
    const p = window.presentationsState.player;
    p.laserActive = !p.laserActive;
    const btn = document.getElementById('laser-toggle-btn');
    const laserDot = document.getElementById('player-laser-dot');

    if (btn) {
        btn.style.background = p.laserActive ? '#ef4444' : 'rgba(255,255,255,0.1)';
        btn.style.color = p.laserActive ? 'white' : '#cbd5e1';
    }

    const stage = document.getElementById('player-slide-stage');
    if (stage) {
        if (p.laserActive) {
            stage.onmousemove = (e) => {
                const rect = stage.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                if (laserDot) {
                    laserDot.style.display = 'block';
                    laserDot.style.left = `${x}px`;
                    laserDot.style.top = `${y}px`;
                }
            };
        } else {
            stage.onmousemove = null;
            if (laserDot) laserDot.style.display = 'none';
        }
    }
};

// Speaker Notes Toggle
window.toggleSpeakerNotes = function() {
    const notesElem = document.getElementById('player-speaker-notes');
    if (notesElem) {
        notesElem.style.display = (notesElem.style.display === 'none') ? 'block' : 'none';
    }
};

// Keyboard listener setup
window.setupPlayerKeyboardListeners = function() {
    window.playerKeyHandler = function(e) {
        if (!window.presentationsState.player.active) return;
        if (e.key === 'ArrowRight' || e.key === 'Space') {
            window.playerNextSlide();
        } else if (e.key === 'ArrowLeft') {
            window.playerPrevSlide();
        } else if (e.key === 'Escape') {
            window.closePresentationPlayer();
        } else if (e.key === 'l' || e.key === 'L') {
            window.toggleLaserPointer();
        }
    };
    if (typeof window.addEventListener === 'function') {
        window.addEventListener('keydown', window.playerKeyHandler);
    }
};

window.removePlayerKeyboardListeners = function() {
    if (window.playerKeyHandler && typeof window.removeEventListener === 'function') {
        window.removeEventListener('keydown', window.playerKeyHandler);
    }
};

// Auto init on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.initPresentations();
    window.renderPresentationsList();
});
