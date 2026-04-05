// ==========================================
// TRANSLATIONS.JS - UI Localization
// ==========================================

const kkTranslationDict = {
    // --- Teacher Nav ---
    "👤 Личный кабинет": "👤 Жеке кабинет",
    "🤖 ИИ & Задачи": "🤖 ЖИ & Тапсырмалар",
    "📚 Уроки (Видео)": "📚 Сабақтар (Бейне)",
    "👥 Мои Классы": "👥 Менің сыныптарым",
    "📑 Экзамены": "📑 Емтихандар",
    "🏆 Рейтинг класса": "🏆 Сынып рейтингі",
    "📊 Журнал оценок": "📊 Бағалау журналы",
    "📅 Календарь": "📅 Күнтізбе",
    "🎯 Викторина ИИ": "🎯 ЖИ Викторинасы",
    "🎡 Колесо удачи": "🎡 Сәттілік дөңгелегі",

    // --- Student Nav ---
    "👨‍🏫 Предметы": "👨‍🏫 Пәндер",
    "🏆 Рейтинг моего класса": "🏆 Менің сыныбымның рейтингі",
    "📊 Мои Оценки": "📊 Менің бағаларым",

    // --- Headers & Profile ---
    "Преподаватель": "Мұғалім",
    "Студент": "Студент",
    "Выйти": "Шығу",
    "Сохранить изменения": "Өзгерістерді сақтау",
    "Изменить пароль": "Құпиясөзді өзгерту",
    "Глобальная статистика": "Жалпы статистика",
    "Учеников": "Оқушылар",
    "Классов": "Сыныптар",
    "Решено задач": "Шешілген тапсырмалар",
    "Экзаменов": "Емтихандар",

    // --- Chat / AI Workspace ---
    "📝 Задача": "📝 Тапсырма",
    "📊 Все результаты": "📊 Барлық нәтижелер",
    "Создать задачу 📝": "Тапсырма құру 📝",
    "Текст задачи (заполняется ИИ)": "Тапсырма мәтіні (ЖИ толтырады)",
    "Отправить классу (Код)": "Сыныпқа жіберу (Код)",
    "Дедлайн (необязательно)": "Дедлайн (міндетті емес)",
    "Отправить в класс": "Сыныпқа жіберу",

    // --- Common words ---
    "Название урока": "Сабақ атауы",
    "Код класса": "Сынып коды",
    "Начало": "Басталуы",
    "Конец": "Аяқталуы",
    "💾 Сохранить": "💾 Сақтау",
    "📅 Расписание": "📅 Кесте",
    "Нет занятий на сегодня": "Бүгінге сабақ жоқ",
    "Выберите день в календаре": "Күнтізбеден күнді таңдаңыз",
    "Месяц Год": "Ай Жыл",

    // --- Video & UI elements ---
    "✨ ИИ-Конспект": "✨ ЖИ-Конспект",
    "Сгенерировать визуальные материалы": "Көрнекіліктерді жасау",
    "Сгенерировать тест по уроку": "Сабақ бойынша тест жасау",
    "Отправить ответы": "Жауаптарды жіберу"
};

window.applyLocalization = () => {
    if (window.currentUser && window.currentUser.lang === 'kk') {
        const translateNode = (node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent.trim();
                // Simple strict matching for full strings
                if (kkTranslationDict[text]) {
                    node.textContent = node.textContent.replace(text, kkTranslationDict[text]);
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                // Do not translate script or style tags
                if (node.tagName === 'SCRIPT' || node.tagName === 'STYLE') return;

                // Handle placeholders
                if (node.hasAttribute('placeholder')) {
                    const placeholder = node.getAttribute('placeholder').trim();
                    if (kkTranslationDict[placeholder]) {
                        node.setAttribute('placeholder', kkTranslationDict[placeholder]);
                    }
                }

                node.childNodes.forEach(translateNode);
            }
        };

        const teacherView = document.getElementById('teacher-view');
        const studentView = document.getElementById('s-view-dashboard')?.parentElement;

        if (teacherView) translateNode(teacherView);
        if (studentView) translateNode(studentView);
        
        console.log("[i18n] UI translated to Kazakh");
    }
};

window.t = (key) => {
    if (window.currentUser && window.currentUser.lang === 'kk' && kkTranslationDict[key]) {
        return kkTranslationDict[key];
    }
    return key;
};
