document.addEventListener('DOMContentLoaded', () => {
    // --- UI Elements ---
    const appContainer = document.getElementById('app-container');
    const authView = document.getElementById('auth-view');
    const teacherView = document.getElementById('teacher-view');
    const studentView = document.getElementById('student-view');

    // Auth Elements
    const authTabs = document.querySelectorAll('.tab-btn');
    const registerFields = document.getElementById('register-fields');
    const classCodeGroup = document.getElementById('class-code-group');
    const roleSelect = document.getElementById('role-select');
    const authForm = document.getElementById('auth-form');
    const errorText = document.getElementById('error-text');
    const submitBtn = document.getElementById('submit-btn');

    // Teacher Elements
    const chatbox = document.getElementById('chatbox');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const taskContentArea = document.getElementById('task-content');
    const taskClassCode = document.getElementById('task-class-code');
    const sendTaskBtn = document.getElementById('send-task-btn');
    const tLogoutBtn = document.getElementById('t-logout');
    const tUserName = document.getElementById('t-user-name');

    // Student Elements
    const studentTasksGrid = document.getElementById('student-tasks');
    const sLogoutBtn = document.getElementById('s-logout');
    const sUserName = document.getElementById('s-user-name');
    const sClassBadge = document.getElementById('s-class-badge');

    let isLoginMode = true;
    let currentUser = null;

    // Helper: Convert any YouTube / Google Drive share URL to an embeddable URL
    function toEmbedUrl(url) {
        if (!url) return '';
        // YouTube: watch?v=ID  |  youtu.be/ID  |  shorts/ID
        const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&autoplay=1`;
        // Google Drive: /file/d/FILE_ID/
        const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
        if (driveMatch) return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
        return url;
    }

    // AlemLLM Auth — keys loaded from js/env.js (window.ENV)
    const LLM_API_KEY = window.ENV.LLM_API_KEY;
    const LLM_API_URL = window.ENV.LLM_API_URL;

    // Google Gemini OCR & Score API Auth
    const GEMINI_API_KEY = window.ENV.GEMINI_API_KEY;
    const SCORE_API_KEY = window.ENV.SCORE_API_KEY;
    const SCORE_API_URL = window.ENV.SCORE_API_URL;

    // Teacher Chat History with strict system prompt
    let conversationHistory = [
        { role: "system", content: "Вы опытный учитель. Ваша цель - генерировать учебные задачи для школьников. ВАЖНО: Выдавайте ТОЛЬКО само условие задачи! НИКОГДА НЕ ПИШИТЕ РЕШЕНИЕ ИЛИ ОТВЕТ. В тексте должна быть только задача." }
    ];

    // Natural Science Chat History (Student) — Global
    window.nsChatHistory = [
        { role: "system", content: "Вы эксперт-натуралист. Ваша задача - объяснять сложные процессы природы простым и интересным языком для школьников. Если процесс можно визуализировать, в конце вашего ответа обязательно напишите техническую метку [GENERATE_IMAGE: <подробный промпт на английском для генерации картинки этого процесса в стиле реалистичной 3D графики или детальной схемы без текста>]." }
    ];

    // --- Authentication Logic ---

    // Toggle Tabs
    authTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            authTabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            isLoginMode = e.target.dataset.mode === 'login';

            if (isLoginMode) {
                registerFields.style.display = 'none';
                submitBtn.textContent = 'Войти / Sign In';
            } else {
                registerFields.style.display = 'block';
                submitBtn.textContent = 'Зарегистрироваться / Sign Up';
                toggleRoleFields(); // Check role to display class code
            }
            errorText.style.display = 'none';
        });
    });

    // Toggle Role dynamically to show Class Code
    roleSelect.addEventListener('change', toggleRoleFields);

    function toggleRoleFields() {
        const isStudent = roleSelect.value === 'student';
        classCodeGroup.style.display = isStudent ? 'flex' : 'none';
        document.getElementById('subject-group').style.display = isStudent ? 'none' : 'block';
    }

    // Submit Auth Form
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorText.style.display = 'none';
        submitBtn.disabled = true;

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const displayName = document.getElementById('display-name').value;
        const role = roleSelect.value;
        const classCode = document.getElementById('class-code').value;

        try {
            if (isLoginMode) {
                await window.fireAuth.signInWithEmailAndPassword(email, password);
                // State change will handle the routing
            } else {
                const userCredential = await window.fireAuth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;

                const subject = document.getElementById('subject-select').value;

                // Store extra metadata in Firestore users collection
                await window.fireDB.collection('users').doc(user.uid).set({
                    email: email,
                    display_name: displayName,
                    role: role,
                    class_code: role === 'student' ? classCode : null,
                    subject: role === 'teacher' ? subject : null
                });

                // State change will handle routing automatically
            }
        } catch (err) {
            errorText.textContent = err.message || "An error occurred.";
            errorText.style.display = "block";
        } finally {
            submitBtn.disabled = false;
        }
    });

    // Listen to Firebase Auth State Changes globally
    window.fireAuth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            try {
                // Fetch user metadata from firestore
                const doc = await window.fireDB.collection('users').doc(user.uid).get();
                if (doc.exists) {
                    const meta = doc.data();

                    authView.classList.remove('active');

                    if (meta.role === 'teacher') {
                        teacherView.classList.add('active');
                        tUserName.textContent = meta.display_name || user.email;
                        initTeacherWorkspace(meta.subject);
                    } else {
                        studentView.classList.add('active');
                        sUserName.textContent = meta.display_name || user.email;
                        sClassBadge.textContent = 'Class: ' + (meta.class_code || 'N/A');
                        // No global task loading anymore
                    }
                } else {
                    console.error("User profile document not found!");
                    errorText.textContent = "Profile missing. Please contact support.";
                    errorText.style.display = "block";
                }
            } catch (err) {
                console.error("Error fetching meta:", err);
            }
        } else {
            // Not logged in
            currentUser = null;
            authView.classList.add('active');
            teacherView.classList.remove('active');
            studentView.classList.remove('active');
        }
    });

    // Logout
    const logout = async () => {
        await window.fireAuth.signOut();
    };

    tLogoutBtn.addEventListener('click', logout);
    sLogoutBtn.addEventListener('click', logout);


    // --- Teacher Logic (AlemLLM + Task Generation) ---

    // Initial bot message
    conversationHistory.push({ role: "assistant", content: "Салем! Вы в режиме учителя. Опишите тему, и я сгенерирую задачу (строго без ответов) для отправки классу." });

    function appendMessage(text, sender) {
        const wrapper = document.createElement('div');
        wrapper.className = `message-wrapper ${sender}`;
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;

        if (window.marked && sender === 'bot') {
            // Pre-escape backslashes so marked.js doesn't eat the MathJax formatting
            messageDiv.innerHTML = marked.parse(text.replace(/\\/g, '\\\\'));
            if (window.MathJax) {
                MathJax.typesetPromise([messageDiv]).catch(() => { });
            }
        } else {
            messageDiv.textContent = text;
        }

        wrapper.appendChild(messageDiv);
        chatbox.appendChild(wrapper);
        chatbox.scrollTop = chatbox.scrollHeight;

        if (sender === 'bot') {
            taskContentArea.value = text;
        }
    }

    // -------- Teacher Top Navigation --------
    const topNavBtns = document.querySelectorAll('.teacher-nav .nav-btn');
    topNavBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = e.target.dataset.view;
            if (!targetId) return;

            topNavBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            ['t-view-profile', 't-view-workspace', 't-view-lessons', 't-view-classes', 't-view-exams', 't-view-ranking', 't-view-gradebook', 't-view-calendar', 't-view-kahoot', 't-view-wheel'].forEach(v => {
                const el = document.getElementById(v);
                if (el) el.style.display = v === targetId ? (['t-view-workspace', 't-view-kahoot', 't-view-wheel'].includes(v) ? 'flex' : 'block') : 'none';
            });

            if (targetId === 't-view-lessons') {
                if (typeof loadTeacherLessons === 'function') loadTeacherLessons();
            }

            if (targetId === 't-view-calendar') {
                const code = document.getElementById('calendar-class-code').value.trim();
                if (code) refreshCalendar(code, 't');
            }

            if (targetId === 't-view-ranking') {
                const code = document.getElementById('t-rank-class-code').value.trim();
                if (code) loadAndRenderRanking(code, null,
                    { content: 't-rank-content', stats: 't-rank-stats', students: 't-rs-students', avgGpa: 't-rs-avg-gpa', top: 't-rs-top', aCount: 't-rs-a-count' });
            }

            if (targetId === 't-view-gradebook') {
                const code = document.getElementById('t-gb-class-code').value.trim();
                if (code) loadAndRenderGradebookTeacher(code);
            }



            if (targetId === 't-view-profile') {
                if(window.loadTeacherCabinet) window.loadTeacherCabinet();
            }
        });
    });

    // -------- Teacher Tab Switcher (Right Panel) --------
    window.switchTeacherTab = (tab) => {
        ['task', 'results'].forEach(t => {
            const el = document.getElementById(`tab-${t}`);
            if (el) el.style.display = t === tab ? 'block' : 'none';
            const btn = document.getElementById(`tab-btn-${t}`);
            if (btn) {
                btn.style.background = t === tab ? 'rgba(99,102,241,0.8)' : 'transparent';
                btn.style.color = t === tab ? 'white' : '#94a3b8';
            }
        });
    };

    // -------- Teacher Workspace Initialization --------
    function initTeacherWorkspace(subject) {
        // --- Subject-Aware Assistant Setup ---
        let systemPrompt = "Вы опытный учитель. Ваша цель - генерировать учебные задачи для школьников. ВАЖНО: Выдавайте ТОЛЬКО само условие задачи! НИКОГДА НЕ ПИШИТЕ РЕШЕНИЕ ИЛИ ОТВЕТ. В тексте должна быть только задача.";
        let welcomeMsg = "Салем! Вы в режиме учителя. Опишите тему, и я сгенерирую задачу (строго без ответов) для отправки классу.";

        const isPsySubject = subject && subject.toString().toLowerCase().trim().includes('самопознание');
        if (isPsySubject) {
            systemPrompt = "Вы опытный учитель-психолог по предмету Самопознание. Ваша цель - помогать в проведении психологических бесед, обсуждении моральных ценностей и самоанализа. Генерируйте упражнения на рефлексию, сценарии тренингов или темы для философских дискуссий.";
            welcomeMsg = "Салем! Вы в режиме учителя Самопознания. Я помогу вам подготовить материалы для психологических тренингов или обсуждения ценностей. Что подготовим сегодня?";
        }

        // Initialize Chat History
        conversationHistory = [{ role: "system", content: systemPrompt }];
        conversationHistory.push({ role: "assistant", content: welcomeMsg });

        chatbox.innerHTML = '';
        appendMessage(welcomeMsg, 'bot');

        // --- Results Tab ---
        const loadResultsBtn = document.getElementById('load-results-btn');
        const submissionsList = document.getElementById('submissions-list');
        const resultsClassCode = document.getElementById('results-class-code');

        loadResultsBtn.addEventListener('click', async () => {
            const code = resultsClassCode.value.trim();
            if (!code) return;
            submissionsList.innerHTML = '<p style="color:#94a3b8">Загрузка...</p>';

            try {
                const snap = await window.fireDB.collection('submissions')
                    .where('class_code', '==', code)
                    .get();

                if (snap.empty) {
                    submissionsList.innerHTML = '<p style="color:#94a3b8">Сдач пока нет.</p>';
                    return;
                }

                const items = [];
                snap.forEach(doc => items.push(doc.data()));
                items.sort((a, b) => {
                    const ta = a.submitted_at ? a.submitted_at.toMillis() : 0;
                    const tb = b.submitted_at ? b.submitted_at.toMillis() : 0;
                    return tb - ta;
                });

                submissionsList.innerHTML = '';
                items.forEach(sub => {
                    const when = sub.submitted_at ? sub.submitted_at.toDate().toLocaleString() : 'Недавно';
                    const card = document.createElement('div');
                    card.style.cssText = 'background:rgba(0,0,0,0.25);border-radius:12px;padding:14px 16px;margin-bottom:10px;border-left:3px solid #10b981;';

                    // Header row: name + score
                    card.innerHTML = `
                        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
                            <div>
                                <div style="font-weight:600;color:#e2e8f0;font-size:0.95rem;">${sub.student_name || 'Ученик'}</div>
                                <div style="font-size:0.75rem;color:#64748b;margin-top:2px;">📅 ${when}</div>
                            </div>
                            <span style="flex-shrink:0;background:rgba(16,185,129,0.2);color:#10b981;padding:4px 12px;border-radius:20px;font-weight:700;font-size:0.95rem;">🏆 ${sub.score}</span>
                        </div>
                        <div style="margin-top:10px;font-size:0.82rem;color:#64748b;padding:6px 8px;background:rgba(255,255,255,0.04);border-radius:6px;line-height:1.5;">📝 ${sub.task_content}</div>
                    `;

                    // Expandable analysis section with proper Markdown+MathJax rendering
                    const details = document.createElement('details');
                    details.style.marginTop = '10px';

                    const summary = document.createElement('summary');
                    summary.style.cssText = 'cursor:pointer;color:#3b82f6;font-size:0.85rem;padding:4px 0;list-style:none;display:flex;align-items:center;gap:6px;';
                    summary.innerHTML = '▶ Показать анализ ошибок';

                    const analysisDiv = document.createElement('div');
                    analysisDiv.style.cssText = 'margin-top:10px;font-size:0.88rem;color:#ddd;line-height:1.7;padding:10px 12px;background:rgba(0,0,0,0.25);border-radius:8px;border-left:2px solid #3b82f6;';
                    analysisDiv.innerHTML = window.marked ? marked.parse((sub.analysis || '').replace(/\\/g, '\\\\')) : (sub.analysis || '');

                    details.addEventListener('toggle', () => {
                        summary.innerHTML = details.open ? '▼ Скрыть анализ' : '▶ Показать анализ ошибок';
                        if (details.open && window.MathJax) {
                            MathJax.typesetPromise([analysisDiv]).catch(() => { });
                        }
                    });

                    details.appendChild(summary);
                    details.appendChild(analysisDiv);
                    card.appendChild(details);
                    submissionsList.appendChild(card);
                });

                if (window.MathJax) MathJax.typesetPromise([submissionsList]).catch(() => { });
            } catch (err) {
                submissionsList.innerHTML = `<p style="color:#ef4444">Ошибка: ${err.message}</p>`;
            }
        });

        // --- Rank Dashboard Tab (Teacher) ---
        const tLoadRankBtn = document.getElementById('t-load-rank-btn');
        if (tLoadRankBtn) {
            tLoadRankBtn.addEventListener('click', () => {
                const code = document.getElementById('t-rank-class-code').value.trim();
                if (!code) return;
                loadAndRenderRanking(code, null,
                    { content: 't-rank-content', stats: 't-rank-stats', students: 't-rs-students', avgGpa: 't-rs-avg-gpa', top: 't-rs-top', aCount: 't-rs-a-count' });
            });
        }

        // --- Classes Tab ---
        const loadClassBtn = document.getElementById('load-class-btn');
        const classStudentsList = document.getElementById('class-students-list');
        const classLookupCode = document.getElementById('class-lookup-code');

        loadClassBtn.addEventListener('click', async () => {
            const code = classLookupCode.value.trim();
            if (!code) return;
            classStudentsList.innerHTML = '<p style="color:#94a3b8;padding:8px 0;">🔍 Поиск учеников...</p>';

            try {
                const snap = await window.fireDB.collection('users')
                    .where('class_code', '==', code)
                    .where('role', '==', 'student')
                    .get();

                if (snap.empty) {
                    classStudentsList.innerHTML = '<p style="color:#94a3b8;padding:8px 0;">Ученики не найдены в этом классе.</p>';
                    return;
                }

                const students = [];
                snap.forEach(doc => students.push({ uid: doc.id, ...doc.data() }));
                students.sort((a, b) => (a.display_name || '').localeCompare(b.display_name || ''));

                // --- Build table ---
                const summary = document.createElement('div');
                summary.style.cssText = 'font-size:0.8rem;color:#64748b;margin-bottom:10px;';
                summary.innerHTML = `Класс <strong style="color:#e2e8f0;">${code}</strong> — учеников: <strong style="color:#10b981;">${students.length}</strong>`;

                const wrap = document.createElement('div');
                wrap.className = 'student-table-wrap';

                const isWellnessTeacher = (currentUser?.meta?.subject || '').toString().toLowerCase().trim().includes('самопознание');
                let psyMap = {};

                if (isWellnessTeacher) {
                    try {
                        const psySnap = await window.fireDB.collection('psy_results')
                            .where('classCode', '==', code)
                            .get();
                        psySnap.forEach(d => {
                            const p = d.data();
                            // Keep the latest result per student per test type or generally latest
                            const existing = psyMap[p.studentUid];
                            if (!existing || (p.timestamp?.toMillis() || 0) > (existing.timestamp?.toMillis() || 0)) {
                                psyMap[p.studentUid] = p;
                            }
                        });
                    } catch (e) {
                        console.error("Error fetching psy results:", e);
                    }
                }

                table.innerHTML = `
                    <thead>
                        <tr>
                            <th style="width:40px;">#</th>
                            <th style="width:36px;"></th>
                            <th>Имя ученика</th>
                            <th>Email</th>
                            ${isWellnessTeacher ? '<th>Благополучие</th>' : ''}
                            <th>Сдач</th>
                            <th style="width:30px;"></th>
                        </tr>
                    </thead>
                    <tbody id="students-tbody"></tbody>
                `;

                wrap.appendChild(table);
                classStudentsList.innerHTML = '';
                classStudentsList.appendChild(summary);
                classStudentsList.appendChild(wrap);

                const tbody = table.querySelector('#students-tbody');

                // Pre-fetch submission counts for ALL students in this class at once
                let submissionCountMap = {};
                try {
                    const allSubs = await window.fireDB.collection('submissions')
                        .where('class_code', '==', code)
                        .get();
                    allSubs.forEach(d => {
                        const uid = d.data().student_uid;
                        submissionCountMap[uid] = (submissionCountMap[uid] || 0) + 1;
                    });
                } catch (_) { }

                students.forEach((s, i) => {
                    const initials = (s.display_name || s.email || '?')[0].toUpperCase();
                    const count = submissionCountMap[s.uid] || 0;

                    // Main student row
                    const tr = document.createElement('tr');
                    tr.className = 'student-row';
                    tr.dataset.uid = s.uid;
                    let wellnessBadge = '';
                    if (isWellnessTeacher) {
                        const p = psyMap[s.uid];
                        if (p) {
                            let color = "#34d399"; // Green
                            let label = "В норме";
                            if (p.testType === 'anxiety' && p.percentage > 40) {
                                color = p.percentage > 70 ? "#f87171" : "#fbbf24";
                                label = p.percentage > 70 ? "Тревожность++" : "Тревожность";
                            } else if (p.testType === 'safety' && p.percentage < 60) {
                                color = p.percentage < 40 ? "#f87171" : "#fbbf24";
                                label = p.percentage < 40 ? "Риск буллинга" : "Безопасность low";
                            }
                            wellnessBadge = `<span style="background:${color}22; color:${color}; padding:2px 8px; border-radius:4px; font-size:0.75rem; border:1px solid ${color}44;">${label}</span>`;
                        } else {
                            wellnessBadge = '<span style="color:#64748b; font-size:0.75rem;">Нет данных</span>';
                        }
                    }

                    tr.innerHTML = `
                        <td style="color:#475569;font-size:0.78rem;">${i + 1}</td>
                        <td>
                            <div class="st-avatar">${initials}</div>
                        </td>
                        <td>
                            <div class="st-name">${s.display_name || 'Без имени'}</div>
                        </td>
                        <td>
                            <div class="st-email">${s.email || '—'}</div>
                        </td>
                        ${isWellnessTeacher ? `<td>${wellnessBadge}</td>` : ''}
                        <td><span class="st-badge">🎓 Ученик</span></td>
                        <td style="font-weight:700;color:${count > 0 ? '#10b981' : '#475569'};">${count}</td>
                        <td><span class="st-chevron">▼</span></td>
                    `;

                    // Detail/grades row (hidden by default)
                    const detailTr = document.createElement('tr');
                    detailTr.className = 'student-detail-row';
                    detailTr.style.display = 'none';
                    const detailTd = document.createElement('td');
                    detailTd.colSpan = isWellnessTeacher ? 8 : 7;
                    const detailInner = document.createElement('div');
                    detailInner.className = 'student-detail-inner';
                    detailInner.innerHTML = '<span style="color:#64748b;font-size:0.82rem;">⏳ Загрузка оценок...</span>';
                    detailTd.appendChild(detailInner);
                    detailTr.appendChild(detailTd);

                    tbody.appendChild(tr);
                    tbody.appendChild(detailTr);

                    // Toggle expand on click
                    let loaded = false;
                    tr.addEventListener('click', async () => {
                        const isOpen = detailTr.style.display !== 'none';

                        if (isOpen) {
                            detailTr.style.display = 'none';
                            tr.classList.remove('expanded');
                            return;
                        }

                        detailTr.style.display = 'table-row';
                        tr.classList.add('expanded');

                        if (loaded) return; // Already fetched

                        // Fetch this student's submissions
                        try {
                            const subSnap = await window.fireDB.collection('submissions')
                                .where('student_uid', '==', s.uid)
                                .get();

                            if (subSnap.empty) {
                                detailInner.innerHTML = `
                                    <h4>📊 Оценки ученика</h4>
                                    <p class="no-grades-msg">Ученик ещё не сдавал работы.</p>
                                `;
                            } else {
                                const subs = [];
                                subSnap.forEach(d => subs.push(d.data()));
                                subs.sort((a, b) => {
                                    const ta = a.submitted_at ? a.submitted_at.toMillis() : 0;
                                    const tb = b.submitted_at ? b.submitted_at.toMillis() : 0;
                                    return tb - ta;
                                });

                                const avg = (() => {
                                    const nums = subs.map(s => {
                                        const m = String(s.score || '').match(/(\d+)/);
                                        return m ? parseInt(m[1]) : null;
                                    }).filter(n => n !== null);
                                    if (!nums.length) return null;
                                    return (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1);
                                })();

                                const chipsHTML = subs.map((sub, idx) => {
                                    const dateStr = sub.submitted_at
                                        ? sub.submitted_at.toDate().toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })
                                        : 'Недавно';
                                    const preview = (sub.task_content || 'Задача').substring(0, 35);
                                    return `
                                        <div class="grade-chip" title="${sub.task_content || ''}">
                                            <span style="color:#94a3b8;font-size:0.7rem;">#${subs.length - idx}</span>
                                            <span class="chip-score">${sub.score || '?'}</span>
                                            <span class="chip-date">${dateStr}</span>
                                        </div>
                                    `;
                                }).join('');

                                const bestSub = subs[0];
                                const latestDate = bestSub && bestSub.submitted_at
                                    ? bestSub.submitted_at.toDate().toLocaleString('ru-RU')
                                    : '—';

                                detailInner.innerHTML = `
                                    <h4>📊 Оценки &amp; История сдач</h4>
                                    <div style="display:flex;gap:24px;margin-bottom:14px;flex-wrap:wrap;">
                                        <div style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.25);border-radius:10px;padding:10px 18px;text-align:center;">
                                            <div style="font-size:1.4rem;font-weight:700;color:#10b981;">${avg !== null ? avg : '—'}</div>
                                            <div style="font-size:0.7rem;color:#64748b;margin-top:2px;">Средний балл</div>
                                        </div>
                                        <div style="background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.25);border-radius:10px;padding:10px 18px;text-align:center;">
                                            <div style="font-size:1.4rem;font-weight:700;color:#818cf8;">${subs.length}</div>
                                            <div style="font-size:0.7rem;color:#64748b;margin-top:2px;">Всего сдач</div>
                                        </div>
                                        <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:10px;padding:10px 18px;text-align:center;">
                                            <div style="font-size:0.82rem;font-weight:600;color:#fbbf24;">${latestDate}</div>
                                            <div style="font-size:0.7rem;color:#64748b;margin-top:2px;">Последняя сдача</div>
                                        </div>
                                    </div>
                                    <div class="grade-chips">${chipsHTML}</div>
                                    ${bestSub && bestSub.analysis ? `
                                        <details style="margin-top:4px;">
                                            <summary style="cursor:pointer;color:#3b82f6;font-size:0.82rem;list-style:none;">▶ Последний анализ ИИ</summary>
                                            <div style="margin-top:8px;font-size:0.83rem;color:#cbd5e1;line-height:1.6;padding:10px 12px;background:rgba(0,0,0,0.25);border-radius:8px;border-left:2px solid #3b82f6;">
                                                ${window.marked ? marked.parse((bestSub.analysis || '').replace(/\\/g, '\\\\')) : (bestSub.analysis || '')}
                                            </div>
                                        </details>
                                    ` : ''}
                                `;
                            }
                            loaded = true;
                        } catch (fetchErr) {
                            detailInner.innerHTML = `<span style="color:#ef4444;">Ошибка загрузки: ${fetchErr.message}</span>`;
                        }
                    });
                });

            } catch (err) {
                classStudentsList.innerHTML = `<p style="color:#ef4444">Ошибка: ${err.message}</p>`;
            }
        });
    }

    // -------- Teacher Lessons --------
    const lessonUploadBtn = document.getElementById('lesson-upload-btn');
    const lessonUploadTitle = document.getElementById('lesson-upload-title');
    const lessonUploadUrl = document.getElementById('lesson-upload-url');
    const teacherLessonsList = document.getElementById('teacher-lessons-list');
    const loadTeacherLessonsBtn = document.getElementById('load-teacher-lessons-btn');


    if (lessonUploadBtn) {
        lessonUploadBtn.addEventListener('click', async () => {
            if (!currentUser) return;

            const title = lessonUploadTitle.value.trim();
            const rawUrl = lessonUploadUrl ? lessonUploadUrl.value.trim() : '';

            if (!title) {
                alert('Пожалуйста, введите название урока.');
                return;
            }
            if (!rawUrl) {
                alert('Пожалуйста, вставьте ссылку на видео (Google Drive).');
                return;
            }

            // Fetch teacher's subject
            let subject = 'Общий';
            try {
                const doc = await window.fireDB.collection('users').doc(currentUser.uid).get();
                if (doc.exists && doc.data().subject) {
                    subject = doc.data().subject;
                }
            } catch (e) { }

            lessonUploadBtn.disabled = true;
            lessonUploadBtn.textContent = '⏳ Обработка...';

            try {
                // If it's a Drive URL, send through our AI pipeline
                if (rawUrl.includes('drive.google.com') && window.VideoPipeline) {
                    await window.VideoPipeline.runPipeline(rawUrl, title, subject, (progressMsg) => {
                        lessonUploadBtn.textContent = '⏳ ' + progressMsg;
                        console.log("[VideoPipeline]", progressMsg);
                    });

                    lessonUploadTitle.value = '';
                    lessonUploadUrl.value = '';
                    lessonUploadBtn.textContent = '✅ Урок и конспект созданы!';
                } else {
                    // Normal save logic (fallback)
                    await window.fireDB.collection('lessons').add({
                        title: title,
                        subject: subject,
                        teacher_id: currentUser.uid,
                        video_url: rawUrl,
                        created_at: firebase.firestore.FieldValue.serverTimestamp()
                    });

                    lessonUploadTitle.value = '';
                    lessonUploadUrl.value = '';
                    lessonUploadBtn.textContent = '✅ Сохранено (без ИИ)!';
                }

                setTimeout(() => {
                    lessonUploadBtn.textContent = '💾 Сохранить урок';
                    lessonUploadBtn.disabled = false;
                }, 3000);

                // Reload lessons list
                window.loadTeacherLessons();

            } catch (err) {
                console.error('Save/Pipeline Error:', err);
                alert('Ошибка: ' + err.message);
                lessonUploadBtn.textContent = '💾 Сохранить урок';
                lessonUploadBtn.disabled = false;
            }
        });
    }

    if (loadTeacherLessonsBtn) {
        loadTeacherLessonsBtn.addEventListener('click', () => { window.loadTeacherLessons(); });
    }

    window.loadTeacherLessons = async () => {
        if (!currentUser) return;
        if (!teacherLessonsList) return;

        teacherLessonsList.innerHTML = '<div style="color: #64748b; font-size: 0.9rem;">⏳ Загрузка списка уроков...</div>';

        try {
            const snap = await window.fireDB.collection('lessons')
                .where('teacher_id', '==', currentUser.uid)
                .get();

            // Sort client-side by created_at descending (no composite index needed)
            const docs = [];
            snap.forEach(doc => docs.push({ id: doc.id, ...doc.data() }));
            docs.sort((a, b) => {
                const ta = a.created_at ? a.created_at.toMillis() : 0;
                const tb = b.created_at ? b.created_at.toMillis() : 0;
                return tb - ta;
            });

            if (docs.length === 0) {
                teacherLessonsList.innerHTML = '<div style="color: #94a3b8; font-size: 0.9rem;">У вас пока нет загруженных уроков.</div>';
                return;
            }

            teacherLessonsList.innerHTML = '';
            docs.forEach(data => {
                const lessonId = data.id;
                const d = data.created_at ? data.created_at.toDate().toLocaleString('ru-RU') : 'Недавно';

                const card = document.createElement('div');
                card.style.cssText = 'background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.05); padding: 12px 16px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; gap: 12px;';
                card.innerHTML = `
                    <div style="flex:1;">
                        <h4 style="margin-bottom: 4px; font-size: 1.05rem; font-weight: 600; color: #f8fafc;">${data.title}</h4>
                        <div style="font-size: 0.8rem; color: #64748b;">
                            <span style="background: rgba(16,185,129,0.1); color: #10b981; padding: 2px 6px; border-radius: 4px; font-weight: 700; margin-right: 8px;">${data.subject || 'Общий'}</span>
                            📅 ${d}
                        </div>
                    </div>
                    <div>
                        <button onclick="window.openLessonWorkspace('${data.title.replace(/'/g, "\\'")}', '${data.video_url}', '${btoa(encodeURIComponent(data.summaryText || data.summary || 'Нет конспекта'))}', '${lessonId}')" class="btn-secondary" style="padding: 6px 12px; font-size: 0.85rem; border: none; display: inline-block; margin-right: 8px; cursor: pointer;">🎥 Открыть</button>
                        <button class="delete-lesson-btn" data-id="${lessonId}" style="padding: 6px 12px; font-size: 0.85rem; background: rgba(239,68,68,0.2); color: #ef4444; border: 1px solid rgba(239,68,68,0.4); border-radius: 8px; cursor: pointer;">🗑️</button>
                    </div>
                `;

                // Quick deletion logic (no storage cleanup for now to keep it simple, just firestore)
                card.querySelector('.delete-lesson-btn').addEventListener('click', async (e) => {
                    const id = e.target.getAttribute('data-id');
                    if (confirm('Вы уверены, что хотите удалить этот урок?')) {
                        try {
                            await window.fireDB.collection('lessons').doc(id).delete();
                            card.remove();
                            if (teacherLessonsList.children.length === 0) {
                                teacherLessonsList.innerHTML = '<div style="color: #94a3b8; font-size: 0.9rem;">У вас пока нет загруженных уроков.</div>';
                            }
                        } catch (err) {
                            alert('Ошибка удаления: ' + err.message);
                        }
                    }
                });

                teacherLessonsList.appendChild(card);
            });
        } catch (err) {
            console.error(err);
            teacherLessonsList.innerHTML = '<div style="color: #ef4444; font-size: 0.9rem;">Ошибка загрузки уроков: ' + err.message + '</div>';
        }
    };

    async function sendMessage() {
        const text = userInput.value.trim();
        if (!text) return;

        userInput.value = '';
        userInput.disabled = true;
        sendBtn.disabled = true;

        appendMessage(text, 'user');
        conversationHistory.push({ role: "user", content: text });

        try {
            const response = await fetch(LLM_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${LLM_API_KEY}`
                },
                body: JSON.stringify({
                    model: "alemllm",
                    messages: conversationHistory
                })
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();
            if (data.choices && data.choices.length > 0) {
                const botReply = data.choices[0].message.content;
                appendMessage(botReply, 'bot');
                conversationHistory.push({ role: "assistant", content: botReply });
            }
        } catch (error) {
            console.error("API Error:", error);
            appendMessage("Ошибка соединения с AlemLLM.", 'error');
        } finally {
            userInput.disabled = false;
            sendBtn.disabled = false;
            userInput.focus();
        }
    }

    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Send Task to Database (Firebase Firestore)
    sendTaskBtn.addEventListener('click', async () => {
        const clsCode = taskClassCode.value.trim();
        const content = taskContentArea.value.trim();

        if (!clsCode || !content) {
            alert('Пожалуйста, укажите код класса и текст задачи.');
            return;
        }

        sendTaskBtn.disabled = true;
        sendTaskBtn.textContent = 'Отправка...';

        try {
            const deadlineVal = document.getElementById('task-deadline').value;
            const userDoc = await window.fireDB.collection('users').doc(currentUser.uid).get();
            const userMeta = userDoc.data();

            await window.fireDB.collection('tasks').add({
                teacher_id: currentUser.uid,
                class_code: clsCode,
                content: content,
                subject: userMeta.subject || 'Общий',
                deadline: deadlineVal ? new Date(deadlineVal) : null,
                created_at: firebase.firestore.FieldValue.serverTimestamp()
            });

            alert('Задача успешно отправлена классу: ' + clsCode);
            taskContentArea.value = '';
        } catch (err) {
            console.error(err);
            alert('Ошибка при отправке задачи: ' + err.message);
        } finally {
            sendTaskBtn.disabled = false;
            sendTaskBtn.textContent = 'Отправить в класс';
        }
    });

    // --- Student Logic ---
    async function loadStudentTasks(classCode) {
        if (!classCode) {
            studentTasksGrid.innerHTML = '<p>Класс не указан. Задач нет.</p>';
            return;
        }

        studentTasksGrid.innerHTML = '<p>Загрузка...</p>';

        try {
            const snapshot = await window.fireDB.collection('tasks')
                .where('class_code', '==', classCode)
                .get();

            if (!snapshot.empty) {
                studentTasksGrid.innerHTML = '';

                // Fetch and sort on the client to completely avoid Firebase Index Errors!
                const tasksList = [];
                snapshot.forEach(doc => tasksList.push(doc.data()));

                tasksList.sort((a, b) => {
                    const timeA = a.created_at ? a.created_at.toMillis() : 0;
                    const timeB = b.created_at ? b.created_at.toMillis() : 0;
                    return timeB - timeA; // Descending
                });

                tasksList.forEach(task => {
                    let d = "Недавно";
                    if (task.created_at) {
                        d = task.created_at.toDate().toLocaleString();
                    }

                    const card = document.createElement('div');
                    card.className = 'task-card';
                    card.innerHTML = `
                        <div class="task-card-header">Отправлено: ${d}</div>
                        <div class="task-card-content" style="line-height: 1.6;">${window.marked ? marked.parse(task.content.replace(/\\/g, '\\\\')) : task.content.replace(/\n/g, '<br>')}</div>
                    `;

                    // --- Student Hint Logic ---
                    const actionsDiv = document.createElement('div');
                    actionsDiv.style.marginTop = '20px';
                    actionsDiv.style.borderTop = '1px solid rgba(255,255,255,0.1)';
                    actionsDiv.style.paddingTop = '12px';

                    const hintsContainer = document.createElement('div');
                    hintsContainer.style.marginTop = '12px';
                    hintsContainer.style.fontSize = '0.9rem';
                    hintsContainer.style.color = '#fbbf24';

                    let hintsLeft = 2;
                    let hintHistory = [
                        { role: "system", content: "Ты ИИ-репетитор. Ученик просит подсказку к задаче. Дай очень короткую, наводящую подсказку, но НИКОГДА не давай прямой ответ или решение." },
                        { role: "user", content: `Задача: ${task.content}\n\nДай мне первую подсказку.` }
                    ];

                    const hintBtn = document.createElement('button');
                    hintBtn.textContent = `💡 Получить подсказку (${hintsLeft})`;
                    hintBtn.style.padding = '8px 16px';
                    hintBtn.style.background = 'rgba(245, 158, 11, 0.15)';
                    hintBtn.style.border = '1px solid rgba(245, 158, 11, 0.5)';
                    hintBtn.style.color = '#fbbf24';
                    hintBtn.style.borderRadius = '8px';
                    hintBtn.style.cursor = 'pointer';
                    hintBtn.style.transition = 'all 0.3s';

                    hintBtn.onmouseover = () => hintBtn.style.background = 'rgba(245, 158, 11, 0.3)';
                    hintBtn.onmouseout = () => hintBtn.style.background = 'rgba(245, 158, 11, 0.15)';

                    hintBtn.onclick = async () => {
                        if (hintsLeft <= 0) return;
                        hintBtn.disabled = true;
                        hintBtn.textContent = '💡 Думаю...';

                        try {
                            const response = await fetch(LLM_API_URL, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${LLM_API_KEY}` },
                                body: JSON.stringify({ model: "alemllm", messages: hintHistory })
                            });
                            const data = await response.json();
                            const tip = data.choices[0].message.content;

                            // Push the tip to context and prepare next prompt
                            hintHistory.push({ role: "assistant", content: tip });
                            hintHistory.push({ role: "user", content: "Дай мне еще одну небольшую подсказку." });

                            hintsLeft--;

                            const tipDiv = document.createElement('div');
                            tipDiv.style.background = 'rgba(0,0,0,0.3)';
                            tipDiv.style.padding = '12px 16px';
                            tipDiv.style.borderRadius = '8px';
                            tipDiv.style.marginTop = '8px';
                            tipDiv.style.borderLeft = '3px solid #f59e0b';
                            tipDiv.innerHTML = window.marked ? marked.parse(tip.replace(/\\/g, '\\\\')) : tip;
                            if (window.MathJax) MathJax.typesetPromise([tipDiv]).catch(() => { });

                            hintsContainer.appendChild(tipDiv);

                            hintBtn.textContent = hintsLeft > 0 ? `💡 Получить подсказку (${hintsLeft})` : '💡 Подсказок больше нет';
                            if (hintsLeft <= 0) {
                                hintBtn.style.opacity = '0.4';
                                hintBtn.style.cursor = 'not-allowed';
                                hintBtn.onmouseover = null;
                            }
                        } catch (err) {
                            console.error(err);
                            alert('Ошибка при получении подсказки. Проверьте соединение.');
                        } finally {
                            if (hintsLeft > 0) hintBtn.disabled = false;
                        }
                    };

                    actionsDiv.appendChild(hintBtn);
                    actionsDiv.appendChild(hintsContainer);
                    card.appendChild(actionsDiv);
                    // --- End Hint Logic ---

                    // --- Neural Grading pipeline ---
                    const graderDiv = document.createElement('div');
                    graderDiv.style.marginTop = '16px';
                    graderDiv.style.paddingTop = '12px';
                    graderDiv.style.borderTop = '1px solid rgba(255,255,255,0.1)';

                    const fileInput = document.createElement('input');
                    fileInput.type = 'file';
                    fileInput.accept = 'image/*';
                    fileInput.style.display = 'none';

                    const uploadBtn = document.createElement('button');
                    uploadBtn.innerHTML = `📷 Отправить фото решения`;
                    uploadBtn.style.padding = '8px 16px';
                    uploadBtn.style.background = 'rgba(16, 185, 129, 0.15)';
                    uploadBtn.style.border = '1px solid rgba(16, 185, 129, 0.5)';
                    uploadBtn.style.color = '#10b981';
                    uploadBtn.style.borderRadius = '8px';
                    uploadBtn.style.cursor = 'pointer';
                    uploadBtn.style.transition = 'all 0.3s';

                    const statusText = document.createElement('div');
                    statusText.style.marginTop = '8px';
                    statusText.style.fontSize = '0.9rem';
                    statusText.style.color = '#94a3b8';

                    uploadBtn.onclick = () => fileInput.click();
                    uploadBtn.onmouseover = () => uploadBtn.style.background = 'rgba(16, 185, 129, 0.3)';
                    uploadBtn.onmouseout = () => uploadBtn.style.background = 'rgba(16, 185, 129, 0.15)';

                    fileInput.onchange = async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;

                        uploadBtn.disabled = true;

                        // 1. Convert to base64
                        statusText.textContent = 'Обработка изображения... (Читаем почерк)';
                        statusText.style.color = '#eab308';
                        const reader = new FileReader();
                        reader.readAsDataURL(file);
                        reader.onload = async () => {
                            const base64Image = reader.result;

                            try {
                                // 2. Call Gemini 1.5 Flash Vision using official SDK via Dynamic Import
                                if (GEMINI_API_KEY.includes('ВСТАВЬТЕ')) throw new Error('Пожалуйста, вставьте ваш ключ Gemini API в код (GEMINI_API_KEY)');

                                const base64DataRaw = base64Image.split(',')[1];
                                const mimeType = file.type || "image/jpeg";

                                // Download the Google SDK into memory (without breaking page script context)
                                const { GoogleGenerativeAI } = await import('https://esm.run/@google/generative-ai');
                                const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

                                // gemini-2.5-flash confirmed available for this API key
                                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

                                const promptText = "ВНИМАТЕЛЬНО: Это фрагмент с математического решения ученика (рукописный или печатный). Выпиши весь рукописный текст и символы с картинки. Пиши только то, что видишь.";

                                const result = await model.generateContent([
                                    promptText,
                                    { inlineData: { data: base64DataRaw, mimeType: mimeType } }
                                ]);

                                const studentText = result.response.text();

                                // 3. Call AlemLLM to generate Logic Analysis
                                statusText.textContent = 'Анализ логики решения ИИ... (Сравниваем с эталоном)';
                                const refRes = await fetch(LLM_API_URL, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${LLM_API_KEY}` },
                                    body: JSON.stringify({
                                        model: "alemllm",
                                        messages: [{
                                            role: "system",
                                            content: "Ты строгий эксперт-оценщик. Тебе даны условие задачи и текст с фото решения ученика. ВНИМАНИЕ: Если текст ученика — это бессвязный мусор, системные ошибки или он вообще не содержит решения задачи, сразу пиши 'ОЦЕНКА: 0/10' и объясняй, что текст не распознан. Иначе — проверь логику. Выведи ответ строго по формату:\nОЦЕНКА: [ТВОЙ БАЛЛ ОТ 0 ДО 10]/10\nАНАЛИЗ: [Твой текст анализа]"
                                        }, {
                                            role: "user",
                                            content: `УСЛОВИЕ:\n${task.content}\n\nРЕШЕНИЕ УЧЕНИКА:\n${studentText}`
                                        }]
                                    })
                                });
                                const refData = await refRes.json();
                                if (refData.error) {
                                    throw new Error(`Ошибка AlemLLM: ${refData.error.message || JSON.stringify(refData.error)}`);
                                }
                                if (!refData.choices) {
                                    throw new Error(`Ответ анализатора пуст: ${JSON.stringify(refData)}`);
                                }
                                const logicAnalysis = refData.choices[0].message.content;

                                // 4. Call Score API
                                statusText.textContent = 'Вычисление оценки (Score API)...';
                                let finalScore = "? / 10";
                                let rawScoreOutput = "";
                                try {
                                    const scoreRes = await fetch(SCORE_API_URL, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SCORE_API_KEY}` },
                                        body: JSON.stringify({
                                            query: studentText,
                                            texts: [logicAnalysis]
                                        })
                                    });
                                    if (scoreRes.ok) {
                                        const scoreData = await scoreRes.json();
                                        console.log("SCORE API RAW DATA:", scoreData);

                                        // Attempt standard object parses
                                        let rawScore;
                                        if (scoreData.results && scoreData.results[0]) rawScore = scoreData.results[0].relevance_score;
                                        else if (scoreData.score !== undefined) rawScore = scoreData.score;
                                        else if (Array.isArray(scoreData) && scoreData[0] && scoreData[0].score !== undefined) rawScore = scoreData[0].score;
                                        else if (Array.isArray(scoreData) && scoreData[0] && scoreData[0][0] && scoreData[0][0].score !== undefined) rawScore = scoreData[0][0].score;

                                        if (rawScore !== undefined) {
                                            let outOfTen = Math.round(rawScore * 10);
                                            if (outOfTen > 10) outOfTen = Math.min(10, Math.round(rawScore));
                                            finalScore = outOfTen + " / 10";
                                        } else {
                                            // Dump whatever we actually got from the API if it's completely unknown format!
                                            finalScore = "ОШИБКА РАСПАРСА";
                                            rawScoreOutput = `<div><small style="color:red">Неизвестный формат: ${JSON.stringify(scoreData)}</small></div>`;
                                        }
                                    } else {
                                        const errRaw = await scoreRes.text();
                                        throw new Error(`HTTP ${scoreRes.status}: ${errRaw}`);
                                    }
                                } catch (scoreErr) {
                                    console.warn('Score API failed, defaulting to Basic AI score.', scoreErr);

                                    // FALLBACK: Extract the score directly from AlemLLM's response if the Score API server is completely dead
                                    const match = logicAnalysis.match(/ОЦЕНКА:\s*(\d+\/10)/i);
                                    if (match) {
                                        finalScore = match[1] + " (Резервный ИИ)";
                                    } else {
                                        rawScoreOutput = `<div><small style="color:red">Score API Error: ${scoreErr.message} (Fallback AI Score not found)</small></div>`;
                                    }
                                }

                                statusText.textContent = 'Проверка завершена!';
                                statusText.style.color = '#10b981';

                                const resultUI = document.createElement('div');
                                resultUI.style.background = 'rgba(0,0,0,0.3)';
                                resultUI.style.padding = '12px';
                                resultUI.style.marginTop = '10px';
                                resultUI.style.borderRadius = '8px';
                                resultUI.style.borderLeft = '3px solid #10b981';
                                resultUI.innerHTML = `
                                    <h4 style="color: #10b981; margin-bottom: 8px;">Оценка SCORE API: ${finalScore}</h4>
                                    ${rawScoreOutput}
                                    <h5 style="color:#fbbf24; margin-top:12px; margin-bottom:6px;">OCR (Что увидел ИИ):</h5>
                                    <div style="font-size: 0.85rem; color:#aaa; font-style:italic; padding:6px; background:rgba(255,255,255,0.05); margin-bottom:12px;">${studentText}</div>
                                    <h5 style="color:#3b82f6; margin-bottom:6px;">Анализ:</h5>
                                    <div style="font-size: 0.9rem; line-height: 1.5; color: #ddd;">${window.marked ? marked.parse(logicAnalysis.replace(/\\/g, '\\\\')) : logicAnalysis}</div>
                                `;
                                if (window.MathJax) {
                                    MathJax.typesetPromise([resultUI]).catch(() => { });
                                }

                                graderDiv.appendChild(resultUI);
                                uploadBtn.style.display = 'none';

                                // --- Save submission to Firestore ---
                                try {
                                    await window.fireDB.collection('submissions').add({
                                        student_uid: currentUser.uid,
                                        student_name: currentUser.displayName || currentUser.email,
                                        class_code: classCode,
                                        task_content: task.content.substring(0, 200) + '...', // First 200 chars as preview
                                        subject: task.subject || 'Общий',
                                        score: finalScore,
                                        analysis: logicAnalysis,
                                        ocr_text: studentText,
                                        submitted_at: firebase.firestore.FieldValue.serverTimestamp()
                                    });
                                    console.log('Submission saved to Firestore!');
                                } catch (saveErr) {
                                    console.warn('Could not save submission:', saveErr);
                                }

                            } catch (e) {
                                console.error(e);
                                statusText.textContent = 'Ошибка конвейера: ' + e.message;
                                statusText.style.color = '#ef4444';
                                uploadBtn.disabled = false;
                            }
                        };
                    };

                    graderDiv.appendChild(fileInput);
                    graderDiv.appendChild(uploadBtn);
                    graderDiv.appendChild(statusText);
                    card.appendChild(graderDiv);
                    // --- End Neural Grading ---

                    studentTasksGrid.appendChild(card);
                });

                if (window.MathJax) {
                    MathJax.typesetPromise([studentTasksGrid]).catch(err => console.error(err));
                }
            } else {
                studentTasksGrid.innerHTML = '<p>Новых задач пока нет.</p>';
            }
        } catch (err) {
            console.error(err);
            // Firestore requires an index for compound query (where + orderBy).
            // Fallback message tells the user they might need to click an index link in console.
            if (err.message.includes('index')) {
                studentTasksGrid.innerHTML = '<p>Ошибка индекса БД (см. консоль).</p>';
            } else {
            }
        }
    }

    // ==========================================
    // EXAM FEATURE LOGIC (TEACHER & STUDENT)
    // ==========================================

    // -------- Teacher Exam Tabs --------
    window.switchExamTab = (tab) => {
        ['create', 'schedule', 'results'].forEach(t => {
            const tabEl = document.getElementById(`exam-tab-${t}`);
            if (tabEl) tabEl.style.display = t === tab ? 'block' : 'none';

            const btn = document.getElementById(`exam-tab-btn-${t}`);
            if (btn) {
                let activeBg = 'transparent';
                if (t === 'create') activeBg = 'rgba(16,185,129,0.8)';
                else if (t === 'schedule') activeBg = 'rgba(245,158,11,0.8)';
                else if (t === 'results') activeBg = 'rgba(236,72,153,0.8)';

                btn.style.background = t === tab ? activeBg : 'transparent';
                btn.style.color = t === tab ? 'white' : '#94a3b8';
            }
        });

        if (tab === 'schedule') {
            loadTeacherExamsForSchedule();
        } else if (tab === 'results') {
            if (typeof loadAssignedExamsForResults === 'function') loadAssignedExamsForResults();
        }
    };

    // -------- Exam Builder --------
    const examQuestionsContainer = document.getElementById('exam-questions-container');
    let examQuestionCount = 0;

    window.addExamQuestion = (type) => {
        examQuestionCount++;
        const qId = `exam-q-` + Date.now() + Math.floor(Math.random() * 1000);

        const card = document.createElement('div');
        card.className = 'exam-builder-question';
        card.id = qId;
        card.dataset.type = type;

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-q-btn';
        removeBtn.innerHTML = '×';
        removeBtn.title = 'Удалить вопрос';
        removeBtn.onclick = () => card.remove();

        const titleDiv = document.createElement('div');
        titleDiv.style.marginBottom = '12px';
        titleDiv.style.fontWeight = '600';
        titleDiv.style.color = '#e2e8f0';
        titleDiv.innerHTML = type === 'test' ? 'Вопрос (Тест)' : (type === 'match' ? 'Вопрос (Сопоставление)' : 'Вопрос (Ввод текста)');

        const textInput = document.createElement('textarea');
        textInput.className = 'q-text';
        textInput.rows = 2;
        textInput.placeholder = 'Текст вопроса...';
        textInput.style.cssText = 'width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius:8px; color:white; margin-bottom: 16px; outline:none; resize:vertical;';

        card.appendChild(removeBtn);
        card.appendChild(titleDiv);
        card.appendChild(textInput);

        const variantsContainer = document.createElement('div');
        variantsContainer.className = 'variants-container';

        if (type === 'test') {
            // 5 Variants
            const desc = document.createElement('div');
            desc.style.cssText = 'font-size:0.8rem; color:#94a3b8; margin-bottom:8px;';
            desc.innerHTML = 'Заполните варианты ответов и отметьте правильный:';
            variantsContainer.appendChild(desc);

            for (let i = 0; i < 5; i++) {
                const row = document.createElement('div');
                row.className = 'variant-row';

                const radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = `correct_for_${qId}`;
                radio.value = i;
                if (i === 0) radio.checked = true;

                const input = document.createElement('input');
                input.className = 'v-text';
                input.type = 'text';
                input.placeholder = `Вариант ${i + 1}`;

                row.appendChild(radio);
                row.appendChild(input);
                variantsContainer.appendChild(row);
            }
        } else if (type === 'match') {
            const desc = document.createElement('div');
            desc.style.cssText = 'font-size:0.8rem; color:#94a3b8; margin-bottom:8px;';
            desc.innerHTML = 'Заполните пары сопоставления (Термин - Определение):';
            variantsContainer.appendChild(desc);

            for (let i = 0; i < 4; i++) {
                const row = document.createElement('div');
                row.className = 'match-row';
                row.style.display = 'flex';
                row.style.gap = '8px';
                row.style.marginBottom = '8px';

                const left = document.createElement('input');
                left.className = 'm-left';
                left.type = 'text';
                left.placeholder = `Термин ${i + 1}`;
                left.style.flex = 1;

                const right = document.createElement('input');
                right.className = 'm-right';
                right.type = 'text';
                right.placeholder = `Определение ${i + 1}`;
                right.style.flex = 1;

                row.appendChild(left);
                row.appendChild(right);
                variantsContainer.appendChild(row);
            }
        } else {
            // Text Input (Hidden answer)
            const desc = document.createElement('div');
            desc.style.cssText = 'font-size:0.8rem; color:#94a3b8; margin-bottom:8px;';
            desc.innerHTML = 'Напишите ожидаемый ответ (ИИ будет сверять ответ ученика с этим эталоном):';
            variantsContainer.appendChild(desc);

            const hiddenAnswer = document.createElement('textarea');
            hiddenAnswer.className = 'hidden-answer';
            hiddenAnswer.rows = 2;
            hiddenAnswer.placeholder = 'Эталонный / Правильный ответ...';
            hiddenAnswer.style.cssText = 'width: 100%; padding: 12px; background: rgba(16,185,129,0.1); border: 1px dashed #10b981; border-radius:8px; color:white; outline:none; resize:vertical;';
            variantsContainer.appendChild(hiddenAnswer);
        }

        card.appendChild(variantsContainer);
        examQuestionsContainer.appendChild(card);
    };

    // -------- AI Exam Generator --------
    const generateAiBtn = document.getElementById('generate-ai-exam-btn');
    if (generateAiBtn) {
        generateAiBtn.addEventListener('click', async () => {
            const topic = document.getElementById('ai-exam-topic').value.trim();
            const diff = document.getElementById('ai-exam-diff').value;
            const count = parseInt(document.getElementById('ai-exam-count').value) || 5;

            if (!topic) return alert('Введите тему для экзамена (например: История Казахстана)');
            if (count < 1 || count > 20) return alert('Количество вопросов должно быть от 1 до 20');

            generateAiBtn.disabled = true;
            generateAiBtn.innerHTML = '⏳ Генерация (ИИ думает)...';

            const systemPrompt = `Ты — эксперт-составитель тестов. Составь тест на тему: "${topic}". Уровень сложности: ${diff}. Количество вопросов: ${count}.
ВЕРНИ СТРОГО JSON МАССИВ ОБЪЕКТОВ. НИКАКОГО ДРУГОГО ТЕКСТА.
Формат каждого объекта:
{
  "type": "test", // Используй "test" (5 вариантов), "text" (открытый) или "match" (сопоставление).
  "text": "Текст самого вопроса",
  "options": ["Вариант 1", "Вариант 2", "Вариант 3", "Вариант 4", "Вариант 5"], // Обязательно ровно 5 вариантов (если type="test"). Если type="text" или "match", этот массив пустой.
  "correct_answer_index": 0, // Индекс правильного ответа (от 0 до 4) если type="test".
  "correct_answer_text": "Ответ", // Эталонный текстовый ответ, если type="text".
  "pairs": [{"left": "Термин 1", "right": "Определение 1"}, {"left": "Термин 2", "right": "Определение 2"}] // Максимум 4 пары, только если type="match"
}
ОЧЕНЬ ВАЖНО: Весь твой ответ должен быть валидным JSON-массивом, начинаться с [ и заканчиваться ].`;

            try {
                const res = await fetch(LLM_API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${LLM_API_KEY}` },
                    body: JSON.stringify({
                        model: "alemllm",
                        messages: [{ role: "system", content: systemPrompt }]
                    })
                });

                const data = await res.json();
                let output = data.choices[0].message.content.trim();

                // Cleanup markdown wrappers
                if (output.startsWith('```json')) output = output.replace('```json', '');
                if (output.startsWith('```')) output = output.replace('```', '');
                if (output.endsWith('```')) output = output.slice(0, -3);

                output = output.trim();

                const questions = JSON.parse(output);

                questions.forEach(q => {
                    let qType = 'test';
                    if (q.type === 'text') qType = 'text';
                    if (q.type === 'match') qType = 'match';
                    // Trigger DOM creation
                    window.addExamQuestion(qType);

                    // The new question is the LAST child of examQuestionsContainer
                    const newCard = examQuestionsContainer.lastElementChild;
                    newCard.querySelector('.q-text').value = q.text;

                    if (qType === 'test') {
                        const rows = newCard.querySelectorAll('.variant-row');
                        if (q.options && q.options.length) {
                            rows.forEach((row, idx) => {
                                row.querySelector('.v-text').value = q.options[idx] || `Вариант ${idx + 1}`;
                                if (idx === q.correct_answer_index) {
                                    row.querySelector('input[type="radio"]').checked = true;
                                }
                            });
                        }
                    } else if (qType === 'match') {
                        const rows = newCard.querySelectorAll('.match-row');
                        if (q.pairs && q.pairs.length) {
                            q.pairs.slice(0, 4).forEach((pair, idx) => {
                                if (rows[idx]) {
                                    rows[idx].querySelector('.m-left').value = pair.left || '';
                                    rows[idx].querySelector('.m-right').value = pair.right || '';
                                }
                            });
                        }
                    } else {
                        newCard.querySelector('.hidden-answer').value = q.correct_answer_text || 'Ответ не сгенерирован';
                    }
                });

                if (!document.getElementById('exam-create-title').value) {
                    document.getElementById('exam-create-title').value = `${topic} (${diff})`;
                }

            } catch (err) {
                console.error(err);
                alert('Ошибка генерации ИИ. Возможно, модель вернула неверный формат. Попробуйте еще раз.\n' + err.message);
            } finally {
                generateAiBtn.disabled = false;
                generateAiBtn.innerHTML = '🚀 Сгенерировать вопросы';
            }
        });
    }

    // -------- Save Exam to Firestore --------
    const saveExamBtn = document.getElementById('save-exam-btn');
    if (saveExamBtn) {
        saveExamBtn.addEventListener('click', async () => {
            const title = document.getElementById('exam-create-title').value.trim();
            const desc = document.getElementById('exam-create-desc').value.trim();
            const durationMins = parseInt(document.getElementById('exam-create-duration').value) || 60;

            if (!title) return alert('Введите название экзамена');

            const qElements = examQuestionsContainer.querySelectorAll('.exam-builder-question');
            if (qElements.length === 0) return alert('Добавьте хотя бы один вопрос');

            const questions = [];
            for (let card of qElements) {
                const type = card.dataset.type;
                const text = card.querySelector('.q-text').value.trim();
                if (!text) return alert('Один из вопросов не содержит текста');

                let qData = { type, text, id: card.id };

                if (type === 'test') {
                    const variants = [];
                    let correctIndex = 0;
                    const rows = card.querySelectorAll('.variant-row');
                    rows.forEach((r, idx) => {
                        const vText = r.querySelector('.v-text').value.trim();
                        variants.push(vText);
                        if (r.querySelector('input[type="radio"]').checked) {
                            correctIndex = idx;
                        }
                    });
                    if (variants.some(v => v === '')) return alert('Пожалуйста, заполните все варианты ответов для тестов');

                    qData.options = variants;
                    qData.correct_answer = correctIndex;
                } else if (type === 'match') {
                    const pairs = [];
                    card.querySelectorAll('.match-row').forEach(r => {
                        const l = r.querySelector('.m-left').value.trim();
                        const rt = r.querySelector('.m-right').value.trim();
                        if (l && rt) pairs.push({ left: l, right: rt });
                    });
                    if (pairs.length < 2) return alert('Добавьте минимум 2 пары для сопоставления');
                    qData.pairs = pairs;
                    qData.correct_answer = pairs; // to maintain structure
                } else {
                    const hText = card.querySelector('.hidden-answer').value.trim();
                    if (!hText) return alert('Заполните эталонный ответ для открытого вопроса');
                    qData.correct_answer = hText;
                }
                questions.push(qData);
            }

            saveExamBtn.disabled = true;
            saveExamBtn.textContent = 'Сохранение...';

            try {
                const userDoc = await window.fireDB.collection('users').doc(currentUser.uid).get();
                const userMeta = userDoc.data();

                await window.fireDB.collection('exams').add({
                    teacher_id: currentUser.uid,
                    subject: userMeta.subject || 'Общий',
                    title: title,
                    description: desc,
                    duration_mins: durationMins,
                    questions: questions,
                    created_at: firebase.firestore.FieldValue.serverTimestamp()
                });
                alert('Экзамен успешно сохранен!');
                // Reset form
                document.getElementById('exam-create-title').value = '';
                document.getElementById('exam-create-desc').value = '';
                examQuestionsContainer.innerHTML = '';
            } catch (err) {
                console.error(err);
                alert('Ошибка при сохранении: ' + err.message);
            } finally {
                saveExamBtn.disabled = false;
                saveExamBtn.textContent = '💾 Сохранить экзамен';
            }
        });
    }

    // -------- Schedule Exam Logic --------
    const examScheduleSelect = document.getElementById('exam-schedule-select');

    async function loadTeacherExamsForSchedule() {
        if (!examScheduleSelect) return;
        examScheduleSelect.innerHTML = '<option value="">(Загрузка...)</option>';
        try {
            const snap = await window.fireDB.collection('exams')
                .where('teacher_id', '==', currentUser.uid)
                .get();

            if (snap.empty) {
                examScheduleSelect.innerHTML = '<option value="">Нет сохраненных экзаменов</option>';
                return;
            }

            examScheduleSelect.innerHTML = '<option value="">-- Выберите экзамен --</option>';
            snap.forEach(doc => {
                const opt = document.createElement('option');
                opt.value = doc.id;
                opt.textContent = doc.data().title;
                examScheduleSelect.appendChild(opt);
            });
        } catch (err) {
            console.error(err);
            examScheduleSelect.innerHTML = '<option value="">Ошибка загрузки</option>';
        }
    }

    const assignExamBtn = document.getElementById('assign-exam-btn');
    if (assignExamBtn) {
        assignExamBtn.addEventListener('click', async () => {
            const examId = examScheduleSelect.value;
            const clsCode = document.getElementById('exam-schedule-class').value.trim();
            const dateStr = document.getElementById('exam-schedule-date').value;

            if (!examId || !clsCode || !dateStr) {
                return alert('Заполните все поля (экзамен, класс, дата)');
            }

            assignExamBtn.disabled = true;
            assignExamBtn.textContent = 'Назначение...';

            try {
                await window.fireDB.collection('assigned_exams').add({
                    exam_id: examId,
                    teacher_id: currentUser.uid,
                    class_code: clsCode,
                    deadline: new Date(dateStr),
                    created_at: firebase.firestore.FieldValue.serverTimestamp()
                });
                alert(`Экзамен успешно назначен классу ${clsCode}!`);
                document.getElementById('exam-schedule-class').value = '';
                document.getElementById('exam-schedule-date').value = '';
            } catch (err) {
                console.error(err);
                alert('Ошибка: ' + err.message);
            } finally {
                assignExamBtn.disabled = false;
                assignExamBtn.textContent = '📅 Назначить классу';
            }
        });
    }

    // -------- Class Results Logic --------
    async function loadAssignedExamsForResults() {
        const select = document.getElementById('exam-results-select');
        if (!select) return;
        select.innerHTML = '<option value="">(Загрузка...)</option>';
        try {
            const snap = await window.fireDB.collection('assigned_exams')
                .where('teacher_id', '==', currentUser.uid)
                .get();

            if (snap.empty) {
                select.innerHTML = '<option value="">Нет назначенных экзаменов</option>';
                return;
            }

            select.innerHTML = '<option value="">-- Выберите проведенный экзамен --</option>';
            snap.forEach(doc => {
                const data = doc.data();
                const d = data.deadline ? data.deadline.toDate().toLocaleDateString() : 'Без даты';
                const opt = document.createElement('option');
                opt.value = doc.id;
                opt.textContent = `Класс: ${data.class_code} | Дедлайн: ${d} | Экзамен ID: ${data.exam_id}`;
                select.appendChild(opt);
            });
        } catch (err) {
            console.error(err);
            select.innerHTML = '<option value="">Ошибка загрузки</option>';
        }
    }

    const loadExamResBtn = document.getElementById('load-exam-results-list-btn');
    if (loadExamResBtn) loadExamResBtn.addEventListener('click', loadAssignedExamsForResults);

    const analyzeResultsBtn = document.getElementById('analyze-results-btn');
    if (analyzeResultsBtn) {
        analyzeResultsBtn.addEventListener('click', async () => {
            const assignId = document.getElementById('exam-results-select').value;
            if (!assignId) return alert('Выберите экзамен для анализа');

            document.getElementById('exam-analytics-summary').style.display = 'none';
            document.getElementById('exam-analytics-ai').style.display = 'none';
            analyzeResultsBtn.disabled = true;
            analyzeResultsBtn.innerHTML = 'Загрузка и анализ... (ИИ думает) ⏳';

            try {
                const subSnap = await window.fireDB.collection('exam_submissions')
                    .where('assignment_id', '==', assignId)
                    .get();

                if (subSnap.empty) {
                    analyzeResultsBtn.disabled = false;
                    analyzeResultsBtn.innerHTML = '🤖 Загрузить и Анализировать результаты';
                    return alert('Для этого экзамена пока нет завершенных работ от учеников.');
                }

                let totalScore = 0;
                let maxScoreTotal = 0;
                let totalSubs = 0;
                let bundledLogs = '';

                const tableContainer = document.getElementById('exam-analytics-table-container');
                tableContainer.innerHTML = '<h4 style="color:#e2e8f0; margin-bottom:12px; margin-top:0;">Детализация по ученикам</h4>';
                const tableWrap = document.createElement('div');
                tableWrap.style.cssText = 'background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); border-radius:12px; overflow:hidden;';
                const table = document.createElement('table');
                table.style.cssText = 'width:100%; border-collapse:collapse; color:white; text-align:left;';
                table.innerHTML = `
                    <thead style="background:rgba(255,255,255,0.05); border-bottom:1px solid rgba(255,255,255,0.1);">
                        <tr>
                            <th style="padding:12px 16px;">Ученик</th>
                            <th style="padding:12px 16px;">Балл</th>
                            <th style="padding:12px 16px;">Действие</th>
                        </tr>
                    </thead>
                    <tbody id="analytics-tbody"></tbody>
                `;
                tableWrap.appendChild(table);
                tableContainer.appendChild(tableWrap);
                tableContainer.style.display = 'block';
                const tbody = tableWrap.querySelector('#analytics-tbody');

                subSnap.forEach(doc => {
                    const data = doc.data();
                    totalSubs++;
                    const score = data.score || 0;
                    const maxScore = data.total || 0;
                    totalScore += score;
                    if (maxScoreTotal === 0) maxScoreTotal = maxScore;

                    bundledLogs += `Ученик: ${data.student_name}\nСчет: ${score}/${maxScore}\nЛоги:\n${(data.log || []).join('\n')}\n\n`;

                    // Generate Row
                    const tr = document.createElement('tr');
                    tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
                    const tdName = document.createElement('td'); tdName.style.padding = '12px 16px'; tdName.textContent = data.student_name || 'Неизвестно';
                    const tdScore = document.createElement('td'); tdScore.style.padding = '12px 16px'; tdScore.textContent = `${score} / ${maxScore}`;
                    const tdAction = document.createElement('td'); tdAction.style.padding = '12px 16px';
                    const btn = document.createElement('button');
                    btn.className = 'btn-secondary';
                    btn.textContent = 'Подробнее';
                    btn.style.padding = '6px 12px'; btn.style.fontSize = '0.85rem';
                    btn.onclick = () => window.openResultModal(assignId, data.student_uid, `Работа: ${data.student_name}`);
                    tdAction.appendChild(btn);

                    tr.appendChild(tdName); tr.appendChild(tdScore); tr.appendChild(tdAction);
                    tbody.appendChild(tr);
                });

                const avgScore = totalSubs > 0 ? (totalScore / totalSubs) : 0;
                const avgPercentage = maxScoreTotal > 0 ? Math.round((avgScore / maxScoreTotal) * 100) : 0;

                document.getElementById('analytics-total-subs').innerText = totalSubs;
                document.getElementById('analytics-avg-score').innerText = `${avgPercentage}%`;
                document.getElementById('exam-analytics-summary').style.display = 'flex';

                const prompt = `Ты авторитетный ИИ-завуч. Ниже приведены результаты класса по конкретному экзамену.
Анализируй логи каждого ученика. Выдели:
1) Сильные стороны класса (какие вопросы дались легко).
2) Слабые стороны / пробелы (на каких вопросах большинство ошиблось).
3) Короткий совет учителю на следующий урок.
Пиши структурированно, с Markdown оформлением. Избегай воды.

=== РЕЗУЛЬТАТЫ ===
Средний процент класса: ${avgPercentage}%
Количество сдач: ${totalSubs}
Детальные логи: ${bundledLogs}`;

                const aiRes = await fetch(LLM_API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${LLM_API_KEY}` },
                    body: JSON.stringify({ model: "alemllm", messages: [{ role: "system", content: prompt }] })
                });

                const aiData = await aiRes.json();
                let analysis = aiData.choices[0].message.content || 'Отчет пуст.';

                document.getElementById('analytics-ai-content').innerHTML = window.marked ? marked.parse(analysis) : analysis;
                document.getElementById('exam-analytics-ai').style.display = 'block';

            } catch (err) {
                console.error(err);
                alert('Ошибка при анализе: ' + err.message);
            } finally {
                analyzeResultsBtn.disabled = false;
                analyzeResultsBtn.innerHTML = '🤖 Загрузить и Анализировать результаты';
            }
        });
    }

    // ==========================================
    // STUDENT EXAM APP LOGIC
    // ==========================================

    // -------- Student Top Navigation --------
    const studentNavBtns = document.querySelectorAll('.student-nav .nav-btn');
    studentNavBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = e.target.dataset.view;
            if (!targetId) return;

            studentNavBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            // Reset subject view to grid whenever we switch tabs
            if (typeof window.closeSubject === 'function') window.closeSubject();

            ['s-view-exams', 's-view-ranking', 's-view-calendar', 's-view-lessons', 's-view-gradebook'].forEach(v => {
                const el = document.getElementById(v);
                if (el) {
                    el.style.display = v === targetId ? 'block' : 'none';
                }
            });

            if (targetId === 's-view-calendar' && currentUser) {
                const label = document.getElementById('s-class-badge').textContent;
                const match = label.match(/Class: (.*)/);
                if (match && match[1] && match[1] !== 'N/A') {
                    refreshCalendar(match[1], 's');
                }
            }

            if (targetId === 's-view-ranking' && currentUser) {
                const label = document.getElementById('s-class-badge').textContent;
                const match = label.match(/Class: (.*)/);
                if (match && match[1] && match[1] !== 'N/A') {
                    loadAndRenderRanking(match[1], currentUser.uid,
                        { content: 's-rank-content', stats: 's-rank-stats', students: 's-rs-students', avgGpa: 's-rs-avg-gpa', myRank: 's-rs-myrank', myGpa: 's-rs-mygpa' });
                }
            }

            // If switching to exams, load them
            if (targetId === 's-view-exams' && currentUser) {
                // Ensure class code is defined (meta should be cached in global if possible, but we can read from UI)
                const label = document.getElementById('s-class-badge').textContent;
                const match = label.match(/Class: (.*)/);
                if (match) {
                    loadStudentExams(match[1]);
                }
            }

            if (targetId === 's-view-gradebook') {
                loadAndRenderGradebookStudent();
            }
        });
    });

    const studentExamsGrid = document.getElementById('student-exams');
    let loadedExamsCache = {}; // exam_id -> full data

    window.openResultModal = async (assignId, studentUid, title) => {
        try {
            document.getElementById('srm-score-text').textContent = "Загрузка...";
            document.getElementById('srm-log-content').innerHTML = "Запрос к БД...";
            document.getElementById('student-result-modal').querySelector('h3').textContent = `Результат: ${title}`;
            document.getElementById('student-result-modal').style.display = 'flex';

            const subSnap = await window.fireDB.collection('exam_submissions')
                .where('assignment_id', '==', assignId)
                .where('student_uid', '==', studentUid)
                .get();

            if (subSnap.empty) {
                document.getElementById('srm-log-content').innerHTML = "Результат не найден.";
                return;
            }

            const data = subSnap.docs[0].data();
            document.getElementById('srm-score-text').textContent = `${data.score || 0} / ${data.total || 0}`;
            document.getElementById('srm-log-content').innerHTML = (data.log || []).join('<br><br>');
        } catch (e) {
            console.error(e);
            document.getElementById('srm-log-content').innerHTML = "Ошибка: " + e.message;
        }
    };

    async function loadStudentExams(classCode) {
        if (!classCode || classCode === 'N/A') return;
        if (!studentExamsGrid) return;

        studentExamsGrid.innerHTML = '<p style="color:#94a3b8;">Ищем назначенные экзамены...</p>';
        try {
            // Get assignments
            const snap = await window.fireDB.collection('assigned_exams')
                .where('class_code', '==', classCode)
                .get();

            if (snap.empty) {
                studentExamsGrid.innerHTML = '<p style="color:#94a3b8;">Пока нет активных экзаменов.</p>';
                return;
            }

            // Also check if already submitted
            const subSnap = await window.fireDB.collection('exam_submissions')
                .where('student_uid', '==', currentUser.uid)
                .get();
            const submittedAssignIds = new Set();
            subSnap.forEach(d => submittedAssignIds.add(d.data().assignment_id));

            studentExamsGrid.innerHTML = '';

            snap.forEach(async doc => {
                const assignmentTitle = doc.data().exam_id; // Need to fetch real title
                const d = doc.data();
                const assignId = doc.id;

                // Fetch the actual exam details to show title
                let examDocTitle = "Экзамен";
                try {
                    const eSnap = await window.fireDB.collection('exams').doc(d.exam_id).get();
                    if (eSnap.exists) {
                        examDocTitle = eSnap.data().title;
                        loadedExamsCache[d.exam_id] = eSnap.data(); // Cache for taking
                    }
                } catch (e) { }

                const deadlineStr = d.deadline ? d.deadline.toDate().toLocaleString() : 'Без дедлайна';
                const isSubmitted = submittedAssignIds.has(assignId);

                const card = document.createElement('div');
                card.className = 'task-card';
                card.style.position = 'relative';
                card.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
                        <h3 style="font-size:1.15rem; color:#f8fafc; font-weight:600;">${examDocTitle}</h3>
                        ${isSubmitted ? '<span style="background:rgba(16,185,129,0.2); color:#10b981; padding:4px 8px; border-radius:6px; font-size:0.75rem; font-weight:700;">СДАНО</span>'
                        : '<span style="background:rgba(239,68,68,0.2); color:#ef4444; padding:4px 8px; border-radius:6px; font-size:0.75rem; font-weight:700;">АКТИВНО</span>'}
                    </div>
                    <div style="font-size:0.85rem; color:#94a3b8; margin-bottom: 20px;">
                        📅 Дедлайн: ${deadlineStr}
                    </div>
                `;

                if (!isSubmitted) {
                    const startBtn = document.createElement('button');
                    startBtn.className = 'btn-primary';
                    startBtn.textContent = 'Начать Экзамен';
                    startBtn.style.padding = '10px 16px';
                    startBtn.style.fontSize = '0.9rem';
                    startBtn.onclick = () => openTakeExamUI(d.exam_id, assignId);
                    card.appendChild(startBtn);
                } else {
                    const viewBtn = document.createElement('button');
                    viewBtn.className = 'btn-secondary';
                    viewBtn.textContent = 'Посмотреть результат';
                    viewBtn.style.padding = '10px 16px';
                    viewBtn.style.fontSize = '0.9rem';
                    viewBtn.style.background = 'rgba(255,255,255,0.05)';
                    viewBtn.style.color = '#cbd5e1';
                    viewBtn.style.border = '1px solid rgba(255,255,255,0.1)';
                    viewBtn.style.borderRadius = '8px';
                    viewBtn.style.width = '100%';
                    viewBtn.onclick = () => window.openResultModal(assignId, currentUser.uid, examDocTitle);
                    card.appendChild(viewBtn);
                }

                studentExamsGrid.appendChild(card);
            });

        } catch (err) {
            console.error(err);
            studentExamsGrid.innerHTML = '<p style="color:#ef4444;">Ошибка загрузки: ' + err.message + '</p>';
        }
    }

    // -------- EXAM ROOM: Proctored Exam Controller --------
    const takeExamOverlay = document.getElementById('take-exam-overlay');
    const submitExamBtn = document.getElementById('submit-exam-btn');
    const gradingStatus = document.getElementById('grading-status');
    const fullscreenLock = document.getElementById('fullscreen-lock');
    const reenterFullscreenBtn = document.getElementById('reenter-fullscreen-btn');
    const submitConfirmModal = document.getElementById('submit-confirm-modal');
    const cancelSubmitBtn = document.getElementById('cancel-submit-btn');
    const confirmSubmitBtn = document.getElementById('confirm-submit-btn');
    const examToast = document.getElementById('exam-toast');
    const examTimerEl = document.getElementById('exam-timer');
    const violationBadge = document.getElementById('violation-badge');

    let currentTakingExamId = null;
    let currentTakingAssignId = null;
    let examTimerInterval = null;
    let snapshotInterval = null;
    let examStartPerf = null;   // performance.now() at start
    let examDurationMs = 0;     // total duration in ms
    let examViolations = { tab_switches: 0, fullscreen_exits: 0 };
    let examStartTime = null;   // Date for logging
    let cameraStream = null;

    // --- Toast helper ---
    function showExamToast(msg, color = 'rgba(239,68,68,0.9)') {
        examToast.textContent = msg;
        examToast.style.background = color;
        examToast.style.display = 'block';
        setTimeout(() => { examToast.style.display = 'none'; }, 3000);
    }

    // --- Update violation counter UI ---
    function updateViolationUI() {
        const total = examViolations.tab_switches + examViolations.fullscreen_exits;
        violationBadge.textContent = `⚠️ Нарушений: ${total}`;
        violationBadge.style.background = total > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.15)';
        violationBadge.style.color = total > 0 ? '#ef4444' : '#f59e0b';
        violationBadge.style.borderColor = total > 0 ? 'rgba(239,68,68,0.4)' : 'rgba(245,158,11,0.3)';
    }

    // --- Tamper-resistant timer using performance.now() + localStorage ---
    function startExamTimer(durationMins, assignId) {
        const storageKey = `exam_timer_${assignId}`;
        const durationMs = durationMins * 60 * 1000;
        examDurationMs = durationMs;

        // Restore or initialize
        const saved = localStorage.getItem(storageKey);
        let elapsedMs = saved ? parseFloat(saved) : 0;
        examStartPerf = performance.now() - elapsedMs;
        examStartTime = new Date();

        clearInterval(examTimerInterval);
        examTimerInterval = setInterval(() => {
            const nowElapsed = performance.now() - examStartPerf;
            localStorage.setItem(storageKey, nowElapsed);

            const remaining = Math.max(0, durationMs - nowElapsed);
            const mins = Math.floor(remaining / 60000);
            const secs = Math.floor((remaining % 60000) / 1000);
            examTimerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

            if (remaining < 5 * 60 * 1000) {
                examTimerEl.classList.add('warning');
            }

            if (remaining <= 0) {
                clearInterval(examTimerInterval);
                showExamToast('⏰ Время вышло! Экзамен завершается...');
                setTimeout(() => doGradeAndSubmit(), 1500);
            }
        }, 500);
    }

    function stopExamTimer(assignId) {
        clearInterval(examTimerInterval);
        localStorage.removeItem(`exam_timer_${assignId}`);
        examTimerEl.classList.remove('warning');
    }

    // --- Camera & snapshot ---
    async function startCamera() {
        try {
            cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
            const video = document.getElementById('proctor-video');
            video.srcObject = cameraStream;
            document.getElementById('camera-feed-wrapper').style.display = 'block';

            // Snapshot every 5 minutes
            clearInterval(snapshotInterval);
            snapshotInterval = setInterval(() => {
                const canvas = document.getElementById('snapshot-canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                canvas.getContext('2d').drawImage(video, 0, 0);
                // Placeholder: in production, send canvas.toDataURL() to Supabase
                console.log('[Proctoring] Snapshot captured and sent to Supabase', new Date().toISOString());
            }, 5 * 60 * 1000);
        } catch (e) {
            console.warn('Camera denied:', e);
            document.getElementById('camera-feed-wrapper').style.display = 'none';
            showExamToast('⚠️ Камера не разрешена. Продолжение без видеонаблюдения.', 'rgba(245,158,11,0.9)');
        }
    }

    function stopCamera() {
        if (cameraStream) {
            cameraStream.getTracks().forEach(t => t.stop());
            cameraStream = null;
        }
        clearInterval(snapshotInterval);
    }

    // --- Anti-cheating event handlers ---
    // These are attached only when exam is open
    const _onVisibilityChange = () => {
        if (document.hidden && takeExamOverlay.style.display !== 'none') {
            examViolations.tab_switches++;
            updateViolationUI();
            showExamToast('⚠️ Предупреждение: Переключение вкладок зафиксировано!');
            alert('Предупреждение: Переключение вкладок обнаружено. Этот инцидент записан.');
        }
    };
    const _onFullscreenChange = () => {
        if (takeExamOverlay.style.display === 'none') return;
        if (!document.fullscreenElement) {
            examViolations.fullscreen_exits++;
            updateViolationUI();
            fullscreenLock.style.display = 'flex';
        }
    };
    const _onCopy = (e) => { if (takeExamOverlay.style.display !== 'none') { e.preventDefault(); showExamToast('🚫 Действие запрещено'); } };
    const _onContextMenu = (e) => { if (takeExamOverlay.style.display !== 'none') e.preventDefault(); };
    const _onKeyDown = (e) => {
        if (takeExamOverlay.style.display === 'none') return;
        if (e.key === 'F12' || (e.ctrlKey && (e.key === 'u' || e.key === 'U' || e.key === 'c' || e.key === 'C'))) {
            e.preventDefault();
            showExamToast('🚫 Действие запрещено');
        }
    };

    // Re-enter fullscreen button
    reenterFullscreenBtn.addEventListener('click', () => {
        takeExamOverlay.requestFullscreen().then(() => {
            fullscreenLock.style.display = 'none';
        }).catch(console.error);
    });

    // --- Open exam room ---
    function openTakeExamUI(examId, assignId) {
        const examObj = loadedExamsCache[examId];
        if (!examObj) return alert('Экзамен не найден в кэше!');

        currentTakingExamId = examId;
        currentTakingAssignId = assignId;

        // Reset violations
        examViolations = { tab_switches: 0, fullscreen_exits: 0 };
        updateViolationUI();

        // Set title
        document.getElementById('exam-room-title').textContent = examObj.title;
        document.getElementById('take-exam-desc').textContent = examObj.description || '';

        // Build questions
        const qContainer = document.getElementById('take-exam-questions');
        qContainer.innerHTML = '';
        gradingStatus.style.display = 'none';
        submitExamBtn.style.display = 'block';
        document.getElementById('return-dashboard-btn').style.display = 'none';
        submitExamBtn.disabled = false;
        submitExamBtn.textContent = '✅ Завершить экзамен';
        fullscreenLock.style.display = 'none';
        submitConfirmModal.style.display = 'none';

        if (!examObj.questions || examObj.questions.length === 0) {
            qContainer.innerHTML = '<p>Вопросов нет.</p>';
        } else {
            examObj.questions.forEach((q, idx) => {
                const card = document.createElement('div');
                card.className = 'exam-q-card';
                card.dataset.idx = idx;
                card.dataset.type = q.type;

                const title = document.createElement('div');
                title.className = 'exam-q-title';
                title.innerHTML = `${idx + 1}. ${window.marked ? marked.parse(q.text.replace(/\\/g, '\\\\')) : q.text}`;
                card.appendChild(title);

                if (q.type === 'test') {
                    q.options.forEach((optStr, oIdx) => {
                        const label = document.createElement('label');
                        label.className = 'exam-variant-label';
                        const rad = document.createElement('input');
                        rad.type = 'radio';
                        rad.name = `student_ans_${idx}`;
                        rad.value = oIdx;
                        const txt = document.createElement('span');
                        txt.style.color = '#e2e8f0';
                        txt.textContent = optStr;
                        label.appendChild(rad);
                        label.appendChild(txt);
                        card.appendChild(label);
                    });
                } else if (q.type === 'match') {
                    const rights = q.pairs.map(p => p.right).sort(() => Math.random() - 0.5);
                    q.pairs.forEach((p, pIdx) => {
                        const row = document.createElement('div');
                        row.style.display = 'flex';
                        row.style.gap = '12px';
                        row.style.margin = '8px 0';
                        row.style.alignItems = 'center';

                        const leftDiv = document.createElement('div');
                        // Use textContent directly, handle potential undefined
                        leftDiv.textContent = p.left || '';
                        leftDiv.style.flex = '1';
                        leftDiv.style.color = '#e2e8f0';

                        const sel = document.createElement('select');
                        sel.className = 'match-select student-ans';
                        sel.dataset.left = p.left || '';
                        sel.style.cssText = 'flex:1; padding:8px; background:rgba(0,0,0,0.3); border:1px solid #334155; color:white; border-radius:6px; outline:none;';
                        sel.innerHTML = '<option value="">-- Выберите пару --</option>';
                        rights.forEach(r => {
                            const opt = document.createElement('option');
                            opt.value = r || '';
                            opt.textContent = r || '';
                            sel.appendChild(opt);
                        });

                        row.appendChild(leftDiv);
                        row.appendChild(sel);
                        card.appendChild(row);
                    });
                } else {
                    const txtArea = document.createElement('textarea');
                    txtArea.className = 'student-text-ans';
                    txtArea.rows = 4;
                    txtArea.placeholder = 'Ваш ответ...';
                    txtArea.style.cssText = 'width:100%; padding:14px; background:rgba(0,0,0,0.3); border:1px solid var(--glass-border); border-radius:8px; color:white; outline:none; resize:vertical; font-size:1rem;';
                    txtArea.onfocus = () => txtArea.style.borderColor = '#10b981';
                    txtArea.onblur = () => txtArea.style.borderColor = 'var(--glass-border)';
                    card.appendChild(txtArea);
                }
                qContainer.appendChild(card);
            });
            if (window.MathJax) MathJax.typesetPromise([qContainer]).catch(() => { });
        }

        // Show overlay
        takeExamOverlay.style.display = 'flex';

        // --- Start Security Layer ---
        // 1. Fullscreen
        takeExamOverlay.requestFullscreen().catch(console.warn);

        // 2. Camera
        startCamera();

        // 3. Timer (with duration from exam or default 60)
        const durationMins = examObj.duration_mins || 60;
        examTimerEl.textContent = `${String(durationMins).padStart(2, '0')}:00`;
        startExamTimer(durationMins, assignId);

        // 4. Attach anti-cheat listeners
        document.addEventListener('visibilitychange', _onVisibilityChange);
        document.addEventListener('fullscreenchange', _onFullscreenChange);
        document.addEventListener('copy', _onCopy);
        document.addEventListener('cut', _onCopy);
        document.addEventListener('paste', _onCopy);
        document.addEventListener('contextmenu', _onContextMenu);
        document.addEventListener('keydown', _onKeyDown);
    }

    // --- Close / cleanup exam room ---
    function closeExamRoom() {
        takeExamOverlay.style.display = 'none';
        stopExamTimer(currentTakingAssignId);
        stopCamera();
        if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
        document.removeEventListener('visibilitychange', _onVisibilityChange);
        document.removeEventListener('fullscreenchange', _onFullscreenChange);
        document.removeEventListener('copy', _onCopy);
        document.removeEventListener('cut', _onCopy);
        document.removeEventListener('paste', _onCopy);
        document.removeEventListener('contextmenu', _onContextMenu);
        document.removeEventListener('keydown', _onKeyDown);
    }

    // --- Submit button → show confirmation modal ---
    document.getElementById('return-dashboard-btn').addEventListener('click', () => {
        closeExamRoom();
    });

    submitExamBtn.addEventListener('click', () => {
        submitConfirmModal.style.display = 'flex';
    });
    cancelSubmitBtn.addEventListener('click', () => {
        submitConfirmModal.style.display = 'none';
    });
    confirmSubmitBtn.addEventListener('click', () => {
        submitConfirmModal.style.display = 'none';
        doGradeAndSubmit();
    });

    // --- Actual grading logic ---
    async function doGradeAndSubmit() {
        const examObj = loadedExamsCache[currentTakingExamId];
        if (!examObj) return;

        const qContainer = document.getElementById('take-exam-questions');
        const cards = qContainer.querySelectorAll('.exam-q-card');

        submitExamBtn.disabled = true;
        submitExamBtn.textContent = 'Проверка...';
        gradingStatus.style.display = 'block';
        gradingStatus.innerHTML = 'Проверяем работу (ИИ оценивает открытые вопросы)... 🤖✨';

        // Stop timer, remove security listeners
        const elapsedMs = performance.now() - examStartPerf;
        const totalTimeTaken = Math.round(elapsedMs / 1000);
        stopExamTimer(currentTakingAssignId);
        stopCamera();
        document.removeEventListener('visibilitychange', _onVisibilityChange);
        document.removeEventListener('fullscreenchange', _onFullscreenChange);
        document.removeEventListener('copy', _onCopy);
        document.removeEventListener('cut', _onCopy);
        document.removeEventListener('paste', _onCopy);
        document.removeEventListener('contextmenu', _onContextMenu);
        document.removeEventListener('keydown', _onKeyDown);
        if (document.fullscreenElement) document.exitFullscreen().catch(() => { });

        let correctPoints = 0;
        let totalPoints = cards.length;
        let evaluationLog = [];

        try {
            for (let i = 0; i < cards.length; i++) {
                const card = cards[i];
                const qType = card.dataset.type;
                const truth = examObj.questions[i].correct_answer;
                const qText = examObj.questions[i].text;

                if (qType === 'test') {
                    const selected = card.querySelector('input[type="radio"]:checked');
                    const studentAns = selected ? parseInt(selected.value) : -1;
                    if (studentAns === parseInt(truth)) {
                        correctPoints++;
                        evaluationLog.push(`Вопрос ${i + 1}: ✅ Верно.`);
                    } else {
                        evaluationLog.push(`Вопрос ${i + 1}: ❌ Неверно.`);
                    }
                } else if (qType === 'match') {
                    const selects = card.querySelectorAll('.match-select');
                    let allCorrect = true;
                    selects.forEach(sel => {
                        const term = sel.dataset.left;
                        const answer = sel.value;
                        const correctPair = truth.find(p => p.left === term);
                        if (!correctPair || correctPair.right !== answer) {
                            allCorrect = false;
                        }
                    });

                    if (allCorrect) {
                        correctPoints++;
                        evaluationLog.push(`Вопрос ${i + 1}: ✅ Сопоставление верно.`);
                    } else {
                        evaluationLog.push(`Вопрос ${i + 1}: ❌ Сопоставление неверно.`);
                    }
                } else {
                    const studentText = card.querySelector('.student-text-ans').value.trim();
                    if (!studentText) { evaluationLog.push(`Вопрос ${i + 1}: ❌ Нет ответа.`); continue; }
                    const prompt = `Ты строгий ИИ-учитель. Проверь ответ ученика.\nВопрос: ${qText}\nЭталон: ${truth}\nОтвет ученика: ${studentText}\nЗасчитать? Ответь только ДА или НЕТ.`;
                    try {
                        const aiRes = await fetch(LLM_API_URL, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${LLM_API_KEY}` },
                            body: JSON.stringify({ model: "alemllm", messages: [{ role: "system", content: prompt }] })
                        });
                        const data = await aiRes.json();
                        const verdict = (data.choices[0].message.content || '').toUpperCase();
                        if (verdict.includes('ДА')) {
                            correctPoints++;
                            evaluationLog.push(`Вопрос ${i + 1}: ✅ Зачтено ИИ.`);
                        } else {
                            evaluationLog.push(`Вопрос ${i + 1}: ❌ Не зачтено ИИ.`);
                        }
                    } catch (e) {
                        evaluationLog.push(`Вопрос ${i + 1}: ⚠️ Ошибка ИИ.`);
                    }
                }
            }

            // Display result
            gradingStatus.innerHTML = `<strong style="font-size:1.3rem;">🎉 Результат: ${correctPoints} из ${totalPoints}</strong><br><br>` +
                `<div style="font-size:0.85rem;color:#64748b;margin-top:10px;">${evaluationLog.join('<br>')}</div>`;
            gradingStatus.style.background = 'rgba(16,185,129,0.15)';
            gradingStatus.style.color = 'white';
            gradingStatus.style.border = '1px solid #10b981';

            // Trust score payload (for Hackathon demo)
            const trustPayload = {
                totalTimeTaken,
                tabSwitchCount: examViolations.tab_switches,
                fullscreenExits: examViolations.fullscreen_exits,
                finalScore: correctPoints,
                totalQuestions: totalPoints
            };
            console.log('[AlemEdu] Trust Score Payload (ready for Supabase):', trustPayload);

            const classCodeLabel = document.getElementById('s-class-badge').textContent.replace('Class: ', '');
            await window.fireDB.collection('exam_submissions').add({
                assignment_id: currentTakingAssignId,
                exam_id: currentTakingExamId,
                class_code: classCodeLabel,
                student_uid: currentUser.uid,
                student_name: currentUser.displayName || currentUser.email,
                subject: examObj.subject || 'Общий',
                score: correctPoints,
                total: totalPoints,
                log: evaluationLog,
                trust_score: trustPayload,
                submitted_at: firebase.firestore.FieldValue.serverTimestamp()
            });

            submitExamBtn.style.display = 'none';
            document.getElementById('return-dashboard-btn').style.display = 'block';
            loadStudentExams(classCodeLabel);

        } catch (e) {
            console.error(e);
            gradingStatus.innerHTML = 'Ошибка при проверке: ' + e.message;
            gradingStatus.style.color = '#ef4444';
            gradingStatus.style.border = '1px solid #ef4444';
            gradingStatus.style.background = 'rgba(239,68,68,0.1)';
            submitExamBtn.disabled = false;
            submitExamBtn.textContent = '✅ Завершить экзамен';
        }
    }

    // ==========================================
    // GPA & CLASS RANKING ENGINE
    // ==========================================

    /**
     * Parse a task score string like "8 / 10" or "7 / 10 (Резервный ИИ)"
     * Returns percentage 0-100, or null if unparsable.
     */
    function parseTaskScore(scoreStr) {
        if (!scoreStr) return null;
        const m = String(scoreStr).match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
        if (!m) return null;
        const num = parseFloat(m[1]);
        const den = parseFloat(m[2]);
        if (den === 0) return null;
        return Math.min(100, (num / den) * 100);
    }

    /**
     * Convert a percentage (0-100) to a GPA object: { gpa, letter, cls }
     * Using the standard 4.0 scale.
     */
    function percentToGPA(pct) {
        if (pct === null || pct === undefined || isNaN(pct)) return { gpa: 0.0, letter: 'N/A', cls: 'gpa-d' };
        let gpa, letter, cls;
        if (pct >= 93) { gpa = 4.0; letter = 'A'; cls = 'gpa-a'; }
        else if (pct >= 90) { gpa = 3.7; letter = 'A-'; cls = 'gpa-a'; }
        else if (pct >= 87) { gpa = 3.3; letter = 'B+'; cls = 'gpa-b'; }
        else if (pct >= 83) { gpa = 3.0; letter = 'B'; cls = 'gpa-b'; }
        else if (pct >= 80) { gpa = 2.7; letter = 'B-'; cls = 'gpa-b'; }
        else if (pct >= 77) { gpa = 2.3; letter = 'C+'; cls = 'gpa-c'; }
        else if (pct >= 73) { gpa = 2.0; letter = 'C'; cls = 'gpa-c'; }
        else if (pct >= 70) { gpa = 1.7; letter = 'C-'; cls = 'gpa-c'; }
        else if (pct >= 67) { gpa = 1.3; letter = 'D+'; cls = 'gpa-d'; }
        else if (pct >= 60) { gpa = 1.0; letter = 'D'; cls = 'gpa-d'; }
        else { gpa = 0.0; letter = 'F'; cls = 'gpa-d'; }
        return { gpa, letter, cls };
    }

    /**
     * Get a fill color for the progress bar based on GPA class.
     */
    function gpaBarColor(cls) {
        if (cls === 'gpa-a') return 'linear-gradient(90deg, #10b981, #34d399)';
        if (cls === 'gpa-b') return 'linear-gradient(90deg, #3b82f6, #60a5fa)';
        if (cls === 'gpa-c') return 'linear-gradient(90deg, #f59e0b, #fbbf24)';
        return 'linear-gradient(90deg, #ef4444, #f87171)';
    }

    /**
     * Fetch all data for a class, compute GPA for each student, sort by descending GPA.
     * Returns [{uid, name, email, taskAvgPct, examAvgPct, combinedPct, gpaObj, taskCount, examCount}]
     */
    async function computeClassRanking(classCode) {
        // 1. Get all students in this class
        const usersSnap = await window.fireDB.collection('users')
            .where('class_code', '==', classCode)
            .where('role', '==', 'student')
            .get();

        if (usersSnap.empty) return [];

        const students = [];
        usersSnap.forEach(d => students.push({ uid: d.id, ...d.data() }));

        // 2. Fetch task submissions for whole class
        const taskSnap = await window.fireDB.collection('submissions')
            .where('class_code', '==', classCode)
            .get();

        // Build map: uid → [pct, pct, ...]
        const taskMap = {};
        taskSnap.forEach(d => {
            const data = d.data();
            const pct = parseTaskScore(data.score);
            if (pct !== null) {
                if (!taskMap[data.student_uid]) taskMap[data.student_uid] = [];
                taskMap[data.student_uid].push(pct);
            }
        });

        // 3. Fetch exam submissions for whole class
        const examSnap = await window.fireDB.collection('exam_submissions')
            .where('class_code', '==', classCode)
            .get();

        // Build map: uid → [pct, pct, ...]
        const examMap = {};
        examSnap.forEach(d => {
            const data = d.data();
            const total = data.total || 0;
            if (total > 0) {
                const pct = (data.score / total) * 100;
                if (!examMap[data.student_uid]) examMap[data.student_uid] = [];
                examMap[data.student_uid].push(pct);
            }
        });

        // 4. Compute GPA per student
        const ranked = students.map(s => {
            const taskPcts = taskMap[s.uid] || [];
            const examPcts = examMap[s.uid] || [];

            const taskAvgPct = taskPcts.length
                ? taskPcts.reduce((a, b) => a + b, 0) / taskPcts.length
                : null;
            const examAvgPct = examPcts.length
                ? examPcts.reduce((a, b) => a + b, 0) / examPcts.length
                : null;

            // 50 / 50 weighting — unsubmitted category counts as 0 for its half
            const taskWeight = taskAvgPct !== null ? taskAvgPct * 0.5 : 0;
            const examWeight = examAvgPct !== null ? examAvgPct * 0.5 : 0;
            const combinedPct = taskWeight + examWeight;

            return {
                uid: s.uid,
                name: s.display_name || s.email || 'Ученик',
                email: s.email || '',
                taskAvgPct,
                examAvgPct,
                combinedPct,
                gpaObj: percentToGPA(combinedPct),
                taskCount: taskPcts.length,
                examCount: examPcts.length
            };
        });

        // Sort descending by combined score
        ranked.sort((a, b) => b.combinedPct - a.combinedPct);
        return ranked;
    }

    /**
     * Renders the podium + rank table into the given container.
     * statsIds: { content, stats, students, avgGpa, top?, aCount?, myRank?, myGpa? }
     * currentUid: UID of the logged-in student (null for teacher view).
     */
    function renderRankBoard(ranked, statsIds, currentUid) {
        const content = document.getElementById(statsIds.content);
        const statsRow = document.getElementById(statsIds.stats);

        if (!ranked.length) {
            content.innerHTML = `<div class="rank-empty"><div class="rank-empty-icon">🎓</div><p>В этом классе пока нет учеников с данными.</p></div>`;
            return;
        }

        // --- Populate stats row ---
        const avgGpa = ranked.reduce((s, r) => s + r.gpaObj.gpa, 0) / ranked.length;
        const topGpa = ranked[0].gpaObj.gpa;
        const aCount = ranked.filter(r => r.gpaObj.letter.startsWith('A')).length;

        if (statsIds.students) document.getElementById(statsIds.students).textContent = ranked.length;
        if (statsIds.avgGpa) document.getElementById(statsIds.avgGpa).textContent = avgGpa.toFixed(2);
        if (statsIds.top) document.getElementById(statsIds.top).textContent = topGpa.toFixed(1);
        if (statsIds.aCount) document.getElementById(statsIds.aCount).textContent = aCount;

        // Fill student-specific stats
        if (currentUid && statsIds.myRank) {
            const myIdx = ranked.findIndex(r => r.uid === currentUid);
            if (myIdx !== -1) {
                document.getElementById(statsIds.myRank).textContent = '#' + (myIdx + 1);
                document.getElementById(statsIds.myGpa).textContent = ranked[myIdx].gpaObj.gpa.toFixed(2);
            }
        }

        if (statsRow) statsRow.style.display = 'flex';

        // --- Build HTML ---
        const medals = ['🥇', '🥈', '🥉'];
        const rankClasses = ['rank-1', 'rank-2', 'rank-3'];

        // Podium (top 3)
        const top3 = ranked.slice(0, Math.min(3, ranked.length));
        // Reorder for podium display: [2nd, 1st, 3rd]
        const podiumOrder = top3.length === 1 ? [top3[0]]
            : top3.length === 2 ? [top3[1], top3[0]]
                : [top3[1], top3[0], top3[2]];
        const podiumRankOrder = top3.length === 1 ? [0]
            : top3.length === 2 ? [1, 0]
                : [1, 0, 2];

        const podiumHTML = `
            <div class="rank-podium">
                ${podiumOrder.map((s, i) => {
            const rankIdx = podiumRankOrder[i];
            const initials = s.name[0].toUpperCase();
            const g = s.gpaObj;
            const isMe = currentUid && s.uid === currentUid;
            return `<div class="podium-card ${rankClasses[rankIdx]}" ${isMe ? 'style="outline:2px solid #6366f1; outline-offset:2px;"' : ''}>
                        <div class="podium-medal">${medals[rankIdx]}</div>
                        <div class="podium-avatar ${rankClasses[rankIdx]}">${initials}</div>
                        <div class="podium-name">${s.name}${isMe ? ' 👈' : ''}</div>
                        <div class="podium-gpa">${g.gpa.toFixed(2)}</div>
                        <div class="podium-label">GPA &nbsp;•&nbsp; ${g.letter}</div>
                        <div style="font-size:0.72rem; color:#475569; margin-top:-4px;">${s.combinedPct.toFixed(1)}%</div>
                    </div>`;
        }).join('')}
            </div>`;

        // Full table (all students)
        const rowsHTML = ranked.map((s, i) => {
            const isMe = currentUid && s.uid === currentUid;
            const g = s.gpaObj;
            const initials = s.name[0].toUpperCase();
            const barPct = Math.round(s.combinedPct);
            const taskPctStr = s.taskAvgPct !== null ? s.taskAvgPct.toFixed(1) + '%' : '—';
            const examPctStr = s.examAvgPct !== null ? s.examAvgPct.toFixed(1) + '%' : '—';
            const medal = i < 3 ? medals[i] : '';

            return `<tr class="${isMe ? 'is-me' : ''}">
                <td class="rank-num">${medal || (i + 1)}</td>
                <td>
                    <div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,rgba(99,102,241,0.7),rgba(168,85,247,0.7));display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.9rem;color:white;">${initials}</div>
                </td>
                <td>
                    <div style="font-weight:600;color:#f1f5f9;">${s.name}${isMe ? ' <span style="font-size:0.75rem;background:rgba(99,102,241,0.2);color:#818cf8;padding:2px 6px;border-radius:6px;margin-left:4px;">Я</span>' : ''}</div>
                    <div style="font-size:0.72rem;color:#475569;margin-top:2px;">${s.email}</div>
                </td>
                <td>
                    <div class="rank-bar-wrap">
                        <div class="rank-bar-bg">
                            <div class="rank-bar-fill" style="width:${barPct}%;background:${gpaBarColor(g.cls)};"></div>
                        </div>
                        <span style="font-size:0.78rem;color:#64748b;min-width:36px;text-align:right;">${barPct}%</span>
                    </div>
                </td>
                <td>
                    <span class="gpa-badge ${g.cls}">${g.gpa.toFixed(2)} ${g.letter}</span>
                </td>
                <td>
                    <div class="score-breakdown">
                        <span class="score-chip tasks" title="Средний балл по задачам">📝 ${taskPctStr}</span>
                        <span class="score-chip exams" title="Средний балл по экзаменам">📑 ${examPctStr}</span>
                    </div>
                </td>
                <td style="font-size:0.78rem;color:#475569;">${s.taskCount}з / ${s.examCount}э</td>
            </tr>`;
        }).join('');

        const tableHTML = `
            <div class="rank-table-wrap">
                <table class="rank-table">
                    <thead>
                        <tr>
                            <th style="width:40px;">#</th>
                            <th style="width:36px;"></th>
                            <th>Ученик</th>
                            <th style="min-width:150px;">Прогресс</th>
                            <th>GPA</th>
                            <th>Разбивка</th>
                            <th title="Задач / Экзаменов сдано">Сдач</th>
                        </tr>
                    </thead>
                    <tbody>${rowsHTML}</tbody>
                </table>
            </div>`;

        content.innerHTML = podiumHTML + tableHTML;

        // Animate bars after insertion (needs a tick for CSS transition)
        requestAnimationFrame(() => {
            content.querySelectorAll('.rank-bar-fill').forEach(bar => {
                const target = bar.style.width;
                bar.style.width = '0%';
                requestAnimationFrame(() => { bar.style.width = target; });
            });
        });
    }

    /**
     * Entry point: fetch + render ranking for any class code.
     * Shared by teacher and student.
     */
    async function loadAndRenderRanking(classCode, currentUid, statsIds) {
        const content = document.getElementById(statsIds.content);
        if (!content) return;
        content.innerHTML = `<div class="rank-empty"><div class="rank-empty-icon" style="opacity:1;animation:pulse-dot 1s infinite;">⏳</div><p style="color:#64748b;">Загружаем данные класса <strong style="color:#e2e8f0;">${classCode}</strong>...</p></div>`;

        try {
            const ranked = await computeClassRanking(classCode);
            renderRankBoard(ranked, statsIds, currentUid);
        } catch (err) {
            console.error('[Ranking]', err);
            content.innerHTML = `<div class="rank-empty"><div class="rank-empty-icon">⚠️</div><p style="color:#ef4444;">Ошибка загрузки: ${err.message}</p></div>`;
        }
    }


    // ==========================================
    // CALENDAR DASHBOARD ENGINE
    // ==========================================

    let currentCalDate = new Date(); // Global month tracking for calendar

    /**
     * Change the current calendar month and re-render.
     */
    window.changeMonth = (offset) => {
        currentCalDate.setMonth(currentCalDate.getMonth() + offset);
        const role = currentUser.role === 'teacher' ? 't' : 's';
        let classCode = '';
        if (role === 't') {
            classCode = document.getElementById('calendar-class-code').value.trim();
        } else {
            const label = document.getElementById('s-class-badge').textContent;
            const match = label.match(/Class: (.*)/);
            if (match) classCode = match[1];
        }
        if (classCode) refreshCalendar(classCode, role);
    };

    /**
     * Fetch all events for the class: Lessons, Task Deadlines, assigned Exams.
     */
    async function fetchAllCalendarEvents(classCode) {
        const events = [];

        try {
            // 1. Fetch Lessons
            const lessonSnap = await window.fireDB.collection('lessons')
                .where('class_code', '==', classCode)
                .get();
            lessonSnap.forEach(doc => {
                const data = doc.data();
                if (data.start_time) {
                    events.push({
                        title: data.title,
                        start: data.start_time.toDate(),
                        end: data.end_time ? data.end_time.toDate() : null,
                        type: 'lesson'
                    });
                }
            });

            // 2. Fetch Task Deadlines
            const taskSnap = await window.fireDB.collection('tasks')
                .where('class_code', '==', classCode)
                .get();
            taskSnap.forEach(doc => {
                const data = doc.data();
                if (data.deadline) {
                    events.push({
                        title: `📝 Дедлайн: ${data.content.substring(0, 20)}...`,
                        start: data.deadline.toDate(),
                        type: 'deadline'
                    });
                }
            });

            // 3. Fetch Assigned Exams
            const examSnap = await window.fireDB.collection('assigned_exams')
                .where('class_code', '==', classCode)
                .get();
            examSnap.forEach(doc => {
                const data = doc.data();
                if (data.deadline) {
                    events.push({
                        title: `🏆 Экзамен (ID: ${data.exam_id.substring(0, 5)})`,
                        start: data.deadline.toDate(),
                        type: 'exam'
                    });
                }
            });
        } catch (e) {
            console.error("Error fetching calendar events:", e);
        }

        return events;
    }

    /**
     * Renders the calendar grid.
     */
    async function refreshCalendar(classCode, role) {
        const gridId = role === 't' ? 'calendar-grid' : 's-calendar-grid';
        const monthNameId = role === 't' ? 'calendar-month-name' : 's-calendar-month-name';

        const grid = document.getElementById(gridId);
        const nameEl = document.getElementById(monthNameId);
        if (!grid || !nameEl) return;

        grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:40px; color:var(--text-muted);">⏳ Загрузка событий...</div>';

        const month = currentCalDate.getMonth();
        const year = currentCalDate.getFullYear();

        const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
        nameEl.textContent = `${monthNames[month]} ${year}`;

        try {
            const allEvents = await fetchAllCalendarEvents(classCode);

            // Populate Today's Schedule Sidebar
            const scheduleListId = role === 't' ? 't-schedule-list' : 's-schedule-list';
            const scheduleList = document.getElementById(scheduleListId);
            if (scheduleList) {
                const now = new Date();
                const todayEvents = allEvents.filter(e =>
                    e.start.getDate() === now.getDate() &&
                    e.start.getMonth() === now.getMonth() &&
                    e.start.getFullYear() === now.getFullYear()
                ).sort((a, b) => a.start - b.start);

                if (todayEvents.length > 0) {
                    scheduleList.innerHTML = '';
                    todayEvents.forEach(e => {
                        const time = e.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const item = document.createElement('div');
                        item.className = 'schedule-item';
                        let icon = '📖';
                        if (e.type === 'deadline') icon = '📝';
                        if (e.type === 'exam') icon = '🏆';

                        // Clean up title for small sidebar display
                        let displayTitle = e.title;
                        if (e.type === 'deadline') displayTitle = displayTitle.replace('📝 Дедлайн: ', '');
                        if (e.type === 'exam') displayTitle = displayTitle.replace('🏆 ', '');

                        item.innerHTML = `
                            <div class="sch-time-box">
                                <span class="sch-time">${time}</span>
                            </div>
                            <div class="sch-info">
                                <div class="sch-title">${displayTitle}</div>
                                <div class="sch-subject">${e.type === 'lesson' ? 'Урок' : (e.type === 'exam' ? 'Экзамен' : 'Дедлайн')}</div>
                            </div>
                            <div class="sch-icon">${icon}</div>
                        `;
                        scheduleList.appendChild(item);
                    });
                } else {
                    const emptyMsg = role === 't' ? 'Нет занятий на сегодня' : 'На сегодня уроков нет. Отдыхайте! 😊';
                    scheduleList.innerHTML = `<div class="schedule-empty">${emptyMsg}</div>`;
                }
            }

            // Generate Monthly Grid
            grid.innerHTML = '';
            const dayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
            dayNames.forEach(d => {
                const h = document.createElement('div');
                h.className = 'calendar-day-head';
                h.textContent = d;
                grid.appendChild(h);
            });

            const firstDay = new Date(year, month, 1);
            let startDay = firstDay.getDay(); // 0 is Sunday, 1 is Monday...
            if (startDay === 0) startDay = 7; // Convert Sunday 0 to 7
            startDay -= 1; // 0-indexed for Pn

            const prevMonthLast = new Date(year, month, 0).getDate();
            const currMonthLast = new Date(year, month + 1, 0).getDate();

            // Determine padding days again for loop
            let daysRendered = 0;

            // Prev Month Padding
            for (let i = startDay - 1; i >= 0; i--) {
                const dayStr = prevMonthLast - i;
                const day = document.createElement('div');
                day.className = 'calendar-day other-month';
                day.innerHTML = `<div class="calendar-day-num">${dayStr}</div>`;
                grid.appendChild(day);
                daysRendered++;
            }

            // Current Month
            const today = new Date();
            for (let i = 1; i <= currMonthLast; i++) {
                const day = document.createElement('div');
                const isToday = today.getDate() === i && today.getMonth() === month && today.getFullYear() === year;
                day.className = `calendar-day ${isToday ? 'today' : ''}`;
                day.innerHTML = `<div class="calendar-day-num">${i}</div>`;

                const dayEvents = allEvents.filter(e =>
                    e.start.getDate() === i && e.start.getMonth() === month && e.start.getFullYear() === year
                );

                dayEvents.forEach(e => {
                    const ev = document.createElement('div');
                    const time = e.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    ev.className = `calendar-event event-${e.type}`;
                    ev.title = e.title;
                    ev.textContent = `${time} ${e.title}`;
                    day.appendChild(ev);
                });
                grid.appendChild(day);
                daysRendered++;
            }

            // Next Month Padding (Force 42 days / 6 rows)
            const nextMonthPadding = 42 - daysRendered;
            for (let i = 1; i <= nextMonthPadding; i++) {
                const day = document.createElement('div');
                day.className = 'calendar-day other-month';
                day.innerHTML = `<div class="calendar-day-num">${i}</div>`;
                grid.appendChild(day);
            }
        } catch (err) {
            console.error("[Calendar]", err);
            grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:40px; color:#ef4444;">Ошибка: ${err.message}</div>`;
        }
    }

    // Teacher: Add Lesson Event listener
    const addLessonBtn = document.getElementById('add-lesson-btn');
    if (addLessonBtn) {
        addLessonBtn.addEventListener('click', async () => {
            const classCode = document.getElementById('calendar-class-code').value.trim();
            const title = document.getElementById('lesson-title').value.trim();
            const start = document.getElementById('lesson-start').value;
            const end = document.getElementById('lesson-end').value;

            if (!classCode || !title || !start) return alert('Заполните название, класс и время начала.');

            addLessonBtn.disabled = true;
            addLessonBtn.textContent = 'Сохранение...';

            try {
                const userDoc = await window.fireDB.collection('users').doc(currentUser.uid).get();
                const userMeta = userDoc.data();

                await window.fireDB.collection('lessons').add({
                    teacher_id: currentUser.uid,
                    class_code: classCode,
                    title: title,
                    subject: userMeta.subject || 'Общий',
                    start_time: new Date(start),
                    end_time: end ? new Date(end) : null,
                    created_at: firebase.firestore.FieldValue.serverTimestamp()
                });
                alert('Урок успешно добавлен в расписание!');
                document.getElementById('lesson-title').value = '';
                document.getElementById('lesson-start').value = '';
                document.getElementById('lesson-end').value = '';
                refreshCalendar(classCode, 't');
            } catch (err) {
                console.error(err);
                alert('Ошибка: ' + err.message);
            } finally {
                addLessonBtn.disabled = false;
                addLessonBtn.textContent = '💾 Сохранить урок';
            }
        });
    }

    // --- Student Lessons Explorer Logic ---

    window.openSubject = async (subject) => {
        const grid = document.querySelector('.subject-grid');
        const detail = document.getElementById('subject-detail-view');
        const title = document.getElementById('current-subject-title');
        const list = document.getElementById('subject-content-list');

        grid.style.display = 'none';
        detail.style.display = 'block';
        title.textContent = subject;
        list.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px;">⏳ Загрузка материалов...</div>';

        // Show Python compiler panel only for Информатика
        const compilerPanel = document.getElementById('py-compiler-panel');
        if (compilerPanel) {
            compilerPanel.style.display = (subject === '\u0418\u043d\u0444\u043e\u0440\u043c\u0430\u0442\u0438\u043a\u0430') ? 'flex' : 'none';
        }

        // Show Natural Science AI Chat only for Естествознание
        const nsChatPanel = document.getElementById('ns-chat-panel');
        if (nsChatPanel) {
            nsChatPanel.style.display = (subject === '\u0415\u0441\u0442\u0435\u0441\u0442\u0432\u043e\u0437\u043d\u0430\u043d\u0438\u0435') ? 'flex' : 'none';
        }

        // Show Math Helper only for Математика
        const mathPanel = document.getElementById('math-helper-panel');
        if (mathPanel) {
            const isMath = subject === '\u041c\u0430\u0442\u0435\u043c\u0430\u0442\u0438\u043a\u0430';
            mathPanel.style.display = isMath ? 'flex' : 'none';
            // Trigger MathJax rendering if needed
            if (isMath && window.MathJax && window.MathJax.typesetPromise) {
                window.MathJax.typesetPromise();
            }
        }

        // Show History Timeline only for История Казахстана
        const historyPanel = document.getElementById('history-timeline-panel');
        if (historyPanel) {
            historyPanel.style.display = (subject === '\u0418\u0441\u0442\u043e\u0440\u0438\u044f \u041a\u0430\u0437\u0430\u0445\u0441\u0442\u0430\u043d\u0430') ? 'flex' : 'none';
        }

        // Show Self-Knowledge Wellness only for Самопознание
        const WellnessPanel = document.getElementById('self-knowledge-panel');
        if (WellnessPanel) {
            WellnessPanel.style.display = (subject === '\u0421\u0430\u043c\u043e\u043f\u043e\u0437\u043d\u0430\u043d\u0438\u0435') ? 'flex' : 'none';
        }

        try {
            const userDoc = await window.fireDB.collection('users').doc(currentUser.uid).get();
            const classCode = userDoc.data().class_code;

            // Fetch video lessons for this subject
            const lessonsSnap = await window.fireDB.collection('lessons')
                .where('subject', '==', subject)
                .get();

            // Fetch tasks for this subject
            const tasksSnap = await window.fireDB.collection('tasks')
                .where('class_code', '==', classCode)
                .where('subject', '==', subject)
                .get();

            list.innerHTML = '';

            if (lessonsSnap.empty && tasksSnap.empty) {
                list.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px; color:#94a3b8;">По этому предмету пока нет уроков или заданий.</div>';
                return;
            }

            // Render Lessons
            if (!lessonsSnap.empty) {
                const lessonsTitle = document.createElement('h3');
                lessonsTitle.style.cssText = 'grid-column:1/-1; font-size:1.4rem; color:white; margin: 20px 0 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;';
                lessonsTitle.textContent = '🎥 Видеоуроки';
                list.appendChild(lessonsTitle);

                const lessonsArr = [];
                lessonsSnap.forEach(doc => lessonsArr.push({ id: doc.id, ...doc.data() }));
                lessonsArr.sort((a, b) => {
                    const timeA = a.created_at ? a.created_at.toMillis() : 0;
                    const timeB = b.created_at ? b.created_at.toMillis() : 0;
                    return timeB - timeA;
                });

                lessonsArr.forEach(data => {
                    const card = document.createElement('div');
                    card.className = 'task-card glass-panel subject-lesson-card';
                    card.style.borderLeft = '4px solid #10b981';
                    card.style.cursor = 'pointer';
                    card.innerHTML = `
                        <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:12px;">
                            <div style="font-size:0.75rem; color:#10b981; font-weight:700; text-transform:uppercase; letter-spacing:0.05em;">Видеоурок</div>
                            <div style="font-size:0.75rem; color:#94a3b8;">${data.created_at ? data.created_at.toDate().toLocaleDateString() : '—'}</div>
                        </div>
                        <h4 style="font-size:1.15rem; color:white; margin-bottom: 10px;">${data.title}</h4>
                        <div style="display:inline-block; font-size:0.85rem; color:white; background:rgba(16,185,129,0.2); padding:6px 12px; border-radius:6px;">▶ Смотреть видео</div>
                    `;

                    // Attach click handler to open lesson workspace
                    card.addEventListener('click', () => {
                        window.openLessonWorkspace(data.title, data.video_url, btoa(encodeURIComponent(data.summaryText || data.summary || 'Нет конспекта')), data.id, data.subject);
                    });

                    list.appendChild(card);
                });
            }

            // Render Tasks
            if (!tasksSnap.empty) {
                const tasksTitle = document.createElement('h3');
                tasksTitle.style.cssText = 'grid-column:1/-1; font-size:1.4rem; color:white; margin: 30px 0 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;';
                tasksTitle.textContent = '📝 Задания';
                list.appendChild(tasksTitle);

                tasksSnap.forEach(doc => {
                    const data = doc.data();
                    const card = document.createElement('div');
                    card.className = 'task-card glass-panel';
                    card.style.borderLeft = '4px solid var(--primary)';
                    card.innerHTML = `
                        <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:12px;">
                            <div style="font-size:0.75rem; color:var(--primary); font-weight:700; text-transform:uppercase; letter-spacing:0.05em;">Задание от учителя</div>
                            <div style="font-size:0.75rem; color:#94a3b8;">${data.created_at ? data.created_at.toDate().toLocaleDateString() : '—'}</div>
                        </div>
                        <p style="font-size:1.1rem; color:white; line-height:1.5; margin-bottom:16px;">${data.content}</p>
                        ${data.deadline ? `<div style="font-size:0.8rem; color:#ef4444; background:rgba(239,68,68,0.1); padding:6px 12px; border-radius:6px; display:inline-block;">⏰ Дедлайн: ${data.deadline.toDate().toLocaleString()}</div>` : ''}
                    `;
                    // --- Student Hint Logic ---
                    const actionsDiv = document.createElement('div');
                    actionsDiv.style.marginTop = '20px';
                    actionsDiv.style.borderTop = '1px solid rgba(255,255,255,0.1)';
                    actionsDiv.style.paddingTop = '12px';

                    const hintsContainer = document.createElement('div');
                    hintsContainer.style.marginTop = '12px';
                    hintsContainer.style.fontSize = '0.9rem';
                    hintsContainer.style.color = '#fbbf24';

                    let hintsLeft = 2;
                    let hintHistory = [
                        { role: "system", content: "Ты ИИ-репетитор. Ученик просит подсказку к задаче. Дай очень короткую, наводящую подсказку, но НИКОГДА не давай прямой ответ или решение." },
                        { role: "user", content: `Задача: ${data.content}\n\nДай мне первую подсказку.` }
                    ];

                    const hintBtn = document.createElement('button');
                    hintBtn.textContent = `💡 Получить подсказку (${hintsLeft})`;
                    hintBtn.style.padding = '8px 16px';
                    hintBtn.style.background = 'rgba(245, 158, 11, 0.15)';
                    hintBtn.style.border = '1px solid rgba(245, 158, 11, 0.5)';
                    hintBtn.style.color = '#fbbf24';
                    hintBtn.style.borderRadius = '8px';
                    hintBtn.style.cursor = 'pointer';
                    hintBtn.style.transition = 'all 0.3s';

                    hintBtn.onmouseover = () => hintBtn.style.background = 'rgba(245, 158, 11, 0.3)';
                    hintBtn.onmouseout = () => hintBtn.style.background = 'rgba(245, 158, 11, 0.15)';

                    hintBtn.onclick = async () => {
                        if (hintsLeft <= 0) return;
                        hintBtn.disabled = true;
                        hintBtn.textContent = '💡 Думаю...';

                        try {
                            const response = await fetch(LLM_API_URL, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${LLM_API_KEY}` },
                                body: JSON.stringify({ model: "alemllm", messages: hintHistory })
                            });
                            const data = await response.json();
                            const tip = data.choices[0].message.content;

                            // Push the tip to context and prepare next prompt
                            hintHistory.push({ role: "assistant", content: tip });
                            hintHistory.push({ role: "user", content: "Дай мне еще одну небольшую подсказку." });

                            hintsLeft--;

                            const tipDiv = document.createElement('div');
                            tipDiv.style.background = 'rgba(0,0,0,0.3)';
                            tipDiv.style.padding = '12px 16px';
                            tipDiv.style.borderRadius = '8px';
                            tipDiv.style.marginTop = '8px';
                            tipDiv.style.borderLeft = '3px solid #f59e0b';
                            tipDiv.innerHTML = window.marked ? marked.parse(tip.replace(/\\/g, '\\\\')) : tip;
                            if (window.MathJax) MathJax.typesetPromise([tipDiv]).catch(() => { });

                            hintsContainer.appendChild(tipDiv);

                            hintBtn.textContent = hintsLeft > 0 ? `💡 Получить подсказку (${hintsLeft})` : '💡 Подсказок больше нет';
                            if (hintsLeft <= 0) {
                                hintBtn.style.opacity = '0.4';
                                hintBtn.style.cursor = 'not-allowed';
                                hintBtn.onmouseover = null;
                            }
                        } catch (err) {
                            console.error(err);
                            alert('Ошибка при получении подсказки. Проверьте соединение.');
                        } finally {
                            if (hintsLeft > 0) hintBtn.disabled = false;
                        }
                    };

                    actionsDiv.appendChild(hintBtn);
                    actionsDiv.appendChild(hintsContainer);
                    card.appendChild(actionsDiv);
                    // --- End Hint Logic ---

                    // --- Neural Grading pipeline ---
                    const graderDiv = document.createElement('div');
                    graderDiv.style.marginTop = '16px';
                    graderDiv.style.paddingTop = '12px';
                    graderDiv.style.borderTop = '1px solid rgba(255,255,255,0.1)';

                    const fileInput = document.createElement('input');
                    fileInput.type = 'file';
                    fileInput.accept = 'image/*';
                    fileInput.style.display = 'none';

                    const uploadBtn = document.createElement('button');
                    uploadBtn.innerHTML = `📷 Отправить фото решения`;
                    uploadBtn.style.padding = '8px 16px';
                    uploadBtn.style.background = 'rgba(16, 185, 129, 0.15)';
                    uploadBtn.style.border = '1px solid rgba(16, 185, 129, 0.5)';
                    uploadBtn.style.color = '#10b981';
                    uploadBtn.style.borderRadius = '8px';
                    uploadBtn.style.cursor = 'pointer';
                    uploadBtn.style.transition = 'all 0.3s';

                    const statusText = document.createElement('div');
                    statusText.style.marginTop = '8px';
                    statusText.style.fontSize = '0.9rem';
                    statusText.style.color = '#94a3b8';

                    uploadBtn.onclick = () => fileInput.click();
                    uploadBtn.onmouseover = () => uploadBtn.style.background = 'rgba(16, 185, 129, 0.3)';
                    uploadBtn.onmouseout = () => uploadBtn.style.background = 'rgba(16, 185, 129, 0.15)';

                    fileInput.onchange = async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;

                        uploadBtn.disabled = true;

                        // 1. Convert to base64
                        statusText.textContent = 'Обработка изображения... (Читаем почерк)';
                        statusText.style.color = '#eab308';
                        const reader = new FileReader();
                        reader.readAsDataURL(file);
                        reader.onload = async () => {
                            const base64Image = reader.result;

                            try {
                                // 2. Call Gemini 1.5 Flash Vision using official SDK via Dynamic Import
                                if (GEMINI_API_KEY.includes('ВСТАВЬТЕ')) throw new Error('Пожалуйста, вставьте ваш ключ Gemini API в код (GEMINI_API_KEY)');

                                const base64DataRaw = base64Image.split(',')[1];
                                const mimeType = file.type || "image/jpeg";

                                // Download the Google SDK into memory (without breaking page script context)
                                const { GoogleGenerativeAI } = await import('https://esm.run/@google/generative-ai');
                                const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

                                // gemini-2.5-flash confirmed available for this API key
                                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

                                const promptText = "ВНИМАТЕЛЬНО: Это фрагмент с математического решения ученика (рукописный или печатный). Выпиши весь рукописный текст и символы с картинки. Пиши только то, что видишь.";

                                const result = await model.generateContent([
                                    promptText,
                                    { inlineData: { data: base64DataRaw, mimeType: mimeType } }
                                ]);

                                const studentText = result.response.text();

                                // 3. Call AlemLLM to generate Logic Analysis
                                statusText.textContent = 'Анализ логики решения ИИ... (Сравниваем с эталоном)';
                                const refRes = await fetch(LLM_API_URL, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${LLM_API_KEY}` },
                                    body: JSON.stringify({
                                        model: "alemllm",
                                        messages: [{
                                            role: "system",
                                            content: "Ты строгий эксперт-оценщик. Тебе даны условие задачи и текст с фото решения ученика. ВНИМАНИЕ: Если текст ученика — это бессвязный мусор, системные ошибки или он вообще не содержит решения задачи, сразу пиши 'ОЦЕНКА: 0/10' и объясняй, что текст не распознан. Иначе — проверь логику. Выведи ответ строго по формату:\nОЦЕНКА: [ТВОЙ БАЛЛ ОТ 0 ДО 10]/10\nАНАЛИЗ: [Твой текст анализа]"
                                        }, {
                                            role: "user",
                                            content: `УСЛОВИЕ:\n${data.content}\n\nРЕШЕНИЕ УЧЕНИКА:\n${studentText}`
                                        }]
                                    })
                                });
                                const refData = await refRes.json();
                                if (refData.error) {
                                    throw new Error(`Ошибка AlemLLM: ${refData.error.message || JSON.stringify(refData.error)}`);
                                }
                                if (!refData.choices) {
                                    throw new Error(`Ответ анализатора пуст: ${JSON.stringify(refData)}`);
                                }
                                const logicAnalysis = refData.choices[0].message.content;

                                // 4. Call Score API
                                statusText.textContent = 'Вычисление оценки (Score API)...';
                                let finalScore = "? / 10";
                                let rawScoreOutput = "";
                                try {
                                    const scoreRes = await fetch(SCORE_API_URL, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SCORE_API_KEY}` },
                                        body: JSON.stringify({
                                            query: studentText,
                                            texts: [logicAnalysis]
                                        })
                                    });
                                    if (scoreRes.ok) {
                                        const scoreData = await scoreRes.json();
                                        console.log("SCORE API RAW DATA:", scoreData);

                                        // Attempt standard object parses
                                        let rawScore;
                                        if (scoreData.results && scoreData.results[0]) rawScore = scoreData.results[0].relevance_score;
                                        else if (scoreData.score !== undefined) rawScore = scoreData.score;
                                        else if (Array.isArray(scoreData) && scoreData[0] && scoreData[0].score !== undefined) rawScore = scoreData[0].score;
                                        else if (Array.isArray(scoreData) && scoreData[0] && scoreData[0][0] && scoreData[0][0].score !== undefined) rawScore = scoreData[0][0].score;

                                        if (rawScore !== undefined) {
                                            let outOfTen = Math.round(rawScore * 10);
                                            if (outOfTen > 10) outOfTen = Math.min(10, Math.round(rawScore));
                                            finalScore = outOfTen + " / 10";
                                        } else {
                                            // Dump whatever we actually got from the API if it's completely unknown format!
                                            finalScore = "ОШИБКА РАСПАРСА";
                                            rawScoreOutput = `<div><small style="color:red">Неизвестный формат: ${JSON.stringify(scoreData)}</small></div>`;
                                        }
                                    } else {
                                        const errRaw = await scoreRes.text();
                                        throw new Error(`HTTP ${scoreRes.status}: ${errRaw}`);
                                    }
                                } catch (scoreErr) {
                                    console.warn('Score API failed, defaulting to Basic AI score.', scoreErr);

                                    // FALLBACK: Extract the score directly from AlemLLM's response if the Score API server is completely dead
                                    const match = logicAnalysis.match(/ОЦЕНКА:\s*(\d+\/10)/i);
                                    if (match) {
                                        finalScore = match[1] + " (Резервный ИИ)";
                                    } else {
                                        rawScoreOutput = `<div><small style="color:red">Score API Error: ${scoreErr.message} (Fallback AI Score not found)</small></div>`;
                                    }
                                }

                                statusText.textContent = 'Проверка завершена!';
                                statusText.style.color = '#10b981';

                                const resultUI = document.createElement('div');
                                resultUI.style.background = 'rgba(0,0,0,0.3)';
                                resultUI.style.padding = '12px';
                                resultUI.style.marginTop = '10px';
                                resultUI.style.borderRadius = '8px';
                                resultUI.style.borderLeft = '3px solid #10b981';
                                resultUI.innerHTML = `
                                    <h4 style="color: #10b981; margin-bottom: 8px;">Оценка SCORE API: ${finalScore}</h4>
                                    ${rawScoreOutput}
                                    <h5 style="color:#fbbf24; margin-top:12px; margin-bottom:6px;">OCR (Что увидел ИИ):</h5>
                                    <div style="font-size: 0.85rem; color:#aaa; font-style:italic; padding:6px; background:rgba(255,255,255,0.05); margin-bottom:12px;">${studentText}</div>
                                    <h5 style="color:#3b82f6; margin-bottom:6px;">Анализ:</h5>
                                    <div style="font-size: 0.9rem; line-height: 1.5; color: #ddd;">${window.marked ? marked.parse(logicAnalysis.replace(/\\/g, '\\\\')) : logicAnalysis}</div>
                                `;
                                if (window.MathJax) {
                                    MathJax.typesetPromise([resultUI]).catch(() => { });
                                }

                                graderDiv.appendChild(resultUI);
                                uploadBtn.style.display = 'none';

                                // --- Save submission to Firestore ---
                                try {
                                    await window.fireDB.collection('submissions').add({
                                        student_uid: currentUser.uid,
                                        student_name: currentUser.displayName || currentUser.email,
                                        class_code: classCode,
                                        task_content: data.content.substring(0, 200) + '...', // First 200 chars as preview
                                        subject: data.subject || 'Общий',
                                        score: finalScore,
                                        analysis: logicAnalysis,
                                        ocr_text: studentText,
                                        submitted_at: firebase.firestore.FieldValue.serverTimestamp()
                                    });
                                    console.log('Submission saved to Firestore!');
                                } catch (saveErr) {
                                    console.warn('Could not save submission:', saveErr);
                                }

                            } catch (e) {
                                console.error(e);
                                statusText.textContent = 'Ошибка конвейера: ' + e.message;
                                statusText.style.color = '#ef4444';
                                uploadBtn.disabled = false;
                            }
                        };
                    };

                    graderDiv.appendChild(fileInput);
                    graderDiv.appendChild(uploadBtn);
                    graderDiv.appendChild(statusText);
                    card.appendChild(graderDiv);
                    // --- End Neural Grading ---
                    list.appendChild(card);
                });
            }

        } catch (err) {
            console.error(err);
            list.innerHTML = `<div style="grid-column:1/-1; color:#ef4444;">Ошибка при загрузке предметов: ${err.message}</div>`;
        }
    };

    function toEmbedUrl(url) {
        if (!url) return '';
        try {
            // Ensure protocol exists
            let validUrl = url.trim();
            if (!/^https?:\/\//i.test(validUrl)) {
                validUrl = 'https://' + validUrl;
            }

            // YouTube Matcher
            const ytMatch = validUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i);
            const originParam = '&origin=https://alemedu-ce24a.firebaseapp.com&widget_referrer=https://alemedu-ce24a.firebaseapp.com';

            if (ytMatch && ytMatch[1]) {
                return 'https://www.youtube-nocookie.com/embed/' + ytMatch[1] + '?rel=0' + originParam;
            }

            // Google Drive Matcher
            const driveMatch = validUrl.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
            if (driveMatch && driveMatch[1]) {
                return 'https://drive.google.com/file/d/' + driveMatch[1] + '/preview';
            }

            // Fallback for URLs that are already embed links but wasn't matched
            if (validUrl.includes('youtube.com/embed/') || validUrl.includes('youtube-nocookie.com/embed/')) {
                return validUrl.replace('youtube.com', 'youtube-nocookie.com') + (validUrl.includes('?') ? '&' : '?') + originParam.substring(1);
            }

            return validUrl;
        } catch (e) {
            console.error('URL parse error:', e);
        }
        return url;
    }

    window.openLessonWorkspace = (title, videoUrl) => {
        const workspace = document.getElementById('s-view-lesson-workspace');
        const subjectView = document.getElementById('subject-detail-view');
        const titleEl = document.getElementById('lesson-workspace-title');
        const iframeEl = document.getElementById('lesson-workspace-iframe');

        // Populate
        titleEl.textContent = title;

        // Hide subject list, show workspace
        subjectView.style.display = 'none';
        workspace.style.display = 'flex';

        // Inject video properly into iframe
        iframeEl.src = toEmbedUrl(videoUrl);
    };

    window.closeLessonWorkspace = () => {
        const workspace = document.getElementById('s-view-lesson-workspace');
        const subjectView = document.getElementById('subject-detail-view');
        const iframeEl = document.getElementById('lesson-workspace-iframe');

        workspace.style.display = 'none';
        subjectView.style.display = 'block';
        iframeEl.src = '';
    };

    window.closeSubject = () => {
        document.querySelector('.subject-grid').style.display = 'grid';
        document.getElementById('subject-detail-view').style.display = 'none';
        const ws = document.getElementById('s-view-lesson-workspace');
        if (ws) ws.style.display = 'none';
        // Show main title
        document.querySelector('#s-view-lessons > div').style.display = 'block';
    };

    // ==========================================
    // GRADEBOOK (JOURNAL) ENGINE
    // ==========================================

    function getGradeLetter(pct) {
        if (pct === null || pct === undefined) return { letter: '—', cls: 'grade-none' };
        if (pct >= 90) return { letter: 'A', cls: 'grade-a' };
        if (pct >= 80) return { letter: 'B', cls: 'grade-b' };
        if (pct >= 70) return { letter: 'C', cls: 'grade-c' };
        if (pct >= 60) return { letter: 'D', cls: 'grade-d' };
        if (pct > 0) return { letter: 'F', cls: 'grade-f' };
        return { letter: 'F', cls: 'grade-f' };
    }

    async function loadAndRenderGradebookTeacher(classCode) {
        const content = document.getElementById('t-gb-content');
        if (!content) return;
        content.innerHTML = '<div class="rank-empty"><div class="rank-empty-icon" style="opacity:1;animation:pulse-dot 1s infinite;">⏳</div><p>Загрузка данных журнала...</p></div>';

        try {
            const userDoc = await window.fireDB.collection('users').doc(currentUser.uid).get();
            const teacherSubject = userDoc.data().subject || 'Общий';

            // 1. Get students
            const userSnap = await window.fireDB.collection('users')
                .where('class_code', '==', classCode)
                .where('role', '==', 'student')
                .get();
            const students = [];
            userSnap.forEach(d => students.push({ uid: d.id, ...d.data() }));

            if (students.length === 0) {
                content.innerHTML = '<div class="rank-empty"><div class="rank-empty-icon">👥</div><p>В этом классе пока нет учеников.</p></div>';
                return;
            }

            // 2. Get task submissions for this class
            const subSnap = await window.fireDB.collection('submissions')
                .where('class_code', '==', classCode)
                .where('subject', '==', teacherSubject)
                .get();
            const subMap = {};
            subSnap.forEach(d => {
                const data = d.data();
                if (!subMap[data.student_uid]) subMap[data.student_uid] = [];
                const p = parseTaskScore(data.score);
                if (p !== null) subMap[data.student_uid].push(p);
            });

            // 3. Get exam submissions for this class
            const exSnap = await window.fireDB.collection('exam_submissions')
                .where('class_code', '==', classCode)
                .where('subject', '==', teacherSubject)
                .get();
            const exMap = {};
            exSnap.forEach(d => {
                const data = d.data();
                if (!exMap[data.student_uid]) exMap[data.student_uid] = [];
                if (data.total > 0) exMap[data.student_uid].push((data.score / data.total) * 100);
            });

            // Build table
            let rowsHTML = students.map(s => {
                const tAvg = subMap[s.uid]?.length ? (subMap[s.uid].reduce((a, b) => a + b, 0) / subMap[s.uid].length) : null;
                const eAvg = exMap[s.uid]?.length ? (exMap[s.uid].reduce((a, b) => a + b, 0) / exMap[s.uid].length) : null;

                const tG = getGradeLetter(tAvg);
                const eG = getGradeLetter(eAvg);
                const initials = s.display_name ? s.display_name[0].toUpperCase() : (s.email ? s.email[0].toUpperCase() : 'U');

                return `
                    <tr class="gb-row">
                        <td>
                            <div style="display:flex; align-items:center; gap:12px;">
                                <div class="st-avatar" style="width:34px; height:34px; font-size:0.9rem;">${initials}</div>
                                <div>
                                    <div class="st-name" style="font-size:0.95rem;">${s.display_name || 'Ученик'}</div>
                                    <div class="st-email" style="font-size:0.75rem; color:#64748b;">${s.email}</div>
                                </div>
                            </div>
                        </td>
                        <td>
                            <div style="display:flex; align-items:center;">
                                <span class="grade-badge ${tG.cls}">${tG.letter}</span>
                                <span style="font-weight:600; min-width:40px;">${tAvg !== null ? Math.round(tAvg) + '%' : '—'}</span>
                                <span class="score-type-chip chip-task">${subMap[s.uid]?.length || 0} сд.</span>
                            </div>
                        </td>
                        <td>
                            <div style="display:flex; align-items:center;">
                                <span class="grade-badge ${eG.cls}">${eG.letter}</span>
                                <span style="font-weight:600; min-width:40px;">${eAvg !== null ? Math.round(eAvg) + '%' : '—'}</span>
                                <span class="score-type-chip chip-exam">${exMap[s.uid]?.length || 0} сд.</span>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');

            content.innerHTML = `
                <div class="gb-table-wrap">
                    <table class="gb-table">
                        <thead>
                            <tr>
                                <th>Ученик</th>
                                <th>Задания (${teacherSubject})</th>
                                <th>Экзамены (${teacherSubject})</th>
                            </tr>
                        </thead>
                        <tbody>${rowsHTML}</tbody>
                    </table>
                </div>
            `;

        } catch (e) {
            console.error(e);
            content.innerHTML = `<div class="rank-empty">⚠️ Ошибка: ${e.message}</div>`;
        }
    }

    async function loadAndRenderGradebookStudent() {
        const content = document.getElementById('s-gb-content');
        if (!content) return;
        content.innerHTML = '<div class="rank-empty"><div class="rank-empty-icon" style="opacity:1;animation:pulse-dot 1s infinite;">⏳</div><p>Собираем ваши оценки...</p></div>';

        try {
            // Predefined subjects for the student dashboard
            const subjects = ['Естествознание', 'Информатика', 'Математика', 'История Казахстана', 'Самопознание'];

            // 1. Get all task submissions for this student
            const subSnap = await window.fireDB.collection('submissions')
                .where('student_uid', '==', currentUser.uid)
                .get();
            const subData = {};
            subSnap.forEach(d => {
                const data = d.data();
                const subj = data.subject || 'Общий';
                if (!subData[subj]) subData[subj] = [];
                const p = parseTaskScore(data.score);
                if (p !== null) subData[subj].push(p);
            });

            // 2. Get all exam submissions for this student
            const exSnap = await window.fireDB.collection('exam_submissions')
                .where('student_uid', '==', currentUser.uid)
                .get();
            const exData = {};
            exSnap.forEach(d => {
                const data = d.data();
                const subj = data.subject || 'Общий';
                if (!exData[subj]) exData[subj] = [];
                if (data.total > 0) exData[subj].push((data.score / data.total) * 100);
            });

            // Build grid of cards
            const gridHTML = subjects.map(s => {
                const tAvg = subData[s]?.length ? (subData[s].reduce((a, b) => a + b, 0) / subData[s].length) : null;
                const eAvg = exData[s]?.length ? (exData[s].reduce((a, b) => a + b, 0) / exData[s].length) : null;
                const tG = getGradeLetter(tAvg);
                const eG = getGradeLetter(eAvg);

                let icon = '📖';
                if (s === 'Естествознание') icon = '🌍';
                if (s === 'Информатика') icon = '💻';
                if (s === 'Математика') icon = '📐';
                if (s === 'История Казахстана') icon = '🇰🇿';
                if (s === 'Самопознание') icon = '🧘';

                return `
                    <div class="subject-grade-card glass-panel">
                        <div class="subject-grade-header">
                            <div class="subject-grade-title">
                                <span style="font-size:1.5rem;">${icon}</span>
                                <h3>${s}</h3>
                            </div>
                        </div>
                        <div class="subject-grade-stats">
                            <div class="stat-box">
                                <span class="stat-label">Задания</span>
                                <div style="display:flex; align-items:center; gap:8px; margin-top:4px;">
                                    <span class="grade-badge ${tG.cls}">${tG.letter}</span>
                                    <span class="stat-value">${tAvg !== null ? Math.round(tAvg) + '%' : '—'}</span>
                                </div>
                            </div>
                            <div class="stat-box">
                                <span class="stat-label">Экзамены</span>
                                <div style="display:flex; align-items:center; gap:8px; margin-top:4px;">
                                    <span class="grade-badge ${eG.cls}">${eG.letter}</span>
                                    <span class="stat-value">${eAvg !== null ? Math.round(eAvg) + '%' : '—'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            content.innerHTML = `<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:20px;">${gridHTML}</div>`;

        } catch (e) {
            console.error(e);
            content.innerHTML = `<div class="rank-empty">⚠️ Ошибка: ${e.message}</div>`;
        }
    }

    // Attach listeners for Gradebook buttons
    const loadGbBtn = document.getElementById('t-load-gb-btn');
    if (loadGbBtn) {
        loadGbBtn.addEventListener('click', () => {
            const code = document.getElementById('t-gb-class-code').value.trim();
            if (code) loadAndRenderGradebookTeacher(code);
        });
    }


    window.openLessonWorkspace = (title, url, summaryBase64, lessonId = null, subject = 'Общий') => {
        const modal = document.getElementById('lesson-viewer-modal');
        if (!modal) return;

        if (window.currentLessonUnsubscribe) {
            window.currentLessonUnsubscribe();
            window.currentLessonUnsubscribe = null;
        }

        // Reset visuals UI
        const visualsContainer = document.getElementById('lvm-visuals-container');
        const visualsList = document.getElementById('lvm-visuals-list');
        const btnText = document.getElementById('lvm-generate-btn-text');
        const btnIcon = document.getElementById('lvm-generate-btn-icon');
        const btn = document.getElementById('lvm-generate-visuals-btn');
        if (visualsContainer && visualsList) {
            visualsContainer.style.display = 'none';
            visualsList.innerHTML = '';
        }
        if (btn) btn.disabled = false;
        if (btnText) btnText.textContent = 'Сгенерировать визуальные материалы';
        if (btnIcon) btnIcon.textContent = '✨';

        // Reset Test UI
        const testContainer = document.getElementById('lvm-test-container');
        const testList = document.getElementById('lvm-test-list');
        const testResult = document.getElementById('lvm-test-result');
        const testBtn = document.getElementById('lvm-generate-test-btn');
        const testBtnText = document.getElementById('lvm-generate-test-btn-text');
        const testBtnIcon = document.getElementById('lvm-generate-test-btn-icon');
        const submitTestBtn = document.getElementById('lvm-submit-test-btn');
        if (testContainer && testList) {
            testContainer.style.display = 'none';
            testList.innerHTML = '';
            if (testResult) { testResult.style.display = 'none'; testResult.innerHTML = ''; }
            if (submitTestBtn) submitTestBtn.style.display = 'none';
        }
        if (testBtn) {
            testBtn.style.display = 'flex';
            testBtn.disabled = false;
        }
        if (testBtnText) testBtnText.textContent = 'Сгенерировать тест по уроку';
        if (testBtnIcon) testBtnIcon.textContent = '📝';
        
        window.currentLessonSubject = subject;
        window.currentLessonId = lessonId;

        document.getElementById('lvm-title').textContent = title;

        // Convert YouTube watch URL to embed URL if needed
        let embedUrl = url;
        if (url.includes('youtube.com/watch?v=')) {
            embedUrl = url.replace('watch?v=', 'embed/');
        } else if (url.includes('youtu.be/')) {
            embedUrl = url.replace('youtu.be/', 'youtube.com/embed/');
        } else if (url.includes('drive.google.com/file/d/')) {
            // Usually drive links have /view?usp=sharing
            embedUrl = url.replace('/view?usp=sharing', '/preview').replace('/view', '/preview');
            if (!embedUrl.includes('/preview')) {
                embedUrl += '/preview';
            }
        }

        document.getElementById('lvm-iframe').src = embedUrl;

        const summaryDiv = document.getElementById('lvm-summary');
        let summaryText;
        try {
            summaryText = decodeURIComponent(atob(summaryBase64));
        } catch (e) {
            summaryText = summaryBase64 && summaryBase64 !== 'undefined' ? summaryBase64 : 'Конспект не был создан для этого урока.';
        }

        if (window.marked) {
            // Render as markdown
            summaryDiv.innerHTML = marked.parse(summaryText.replace(/\\/g, '\\\\'));
            if (window.MathJax) {
                MathJax.typesetPromise([summaryDiv]).catch(() => { });
            }
        } else {
            summaryDiv.textContent = summaryText;
        }

        // Store summary for on-demand visual generation
        window.currentLessonSummaryText = summaryText;

        modal.style.display = 'block';
    };

    window.generateVisualsOnDemand = async () => {
        const summaryText = window.currentLessonSummaryText;
        if (!summaryText) return;

        const btn = document.getElementById('lvm-generate-visuals-btn');
        const btnText = document.getElementById('lvm-generate-btn-text');
        const btnIcon = document.getElementById('lvm-generate-btn-icon');
        const visualsContainer = document.getElementById('lvm-visuals-container');
        const visualsList = document.getElementById('lvm-visuals-list');

        if (btn) btn.disabled = true;
        if (btnIcon) btnIcon.textContent = '⏳';
        if (btnText) btnText.textContent = 'Анализирую конспект...';
        if (visualsList) visualsList.innerHTML = '';

        try {
            // Step 1: Ask LLM to extract visual concepts from summary
            const systemPrompt = `Act as an Educational Content Designer. Scan the provided summary for any: 1. Processes/Cycles, 2. Statistical data/Trends, 3. Complex terminology. For each found element, generate a highly detailed English image prompt for an AI Image Generator. Constraint: The prompts must request a clean, modern vector style on a white background with NO ANY TEXT, NUMBERS, SIGNS, SYMBOLS, CHARACTERS OR LABELS inside the image, what is very important.

Output MUST be a valid JSON array of objects, with each object having: "type" (string: "Process", "Trend", or "Terminology"), "concept" (string, name in Russian), "prompt" (string, detailed English image prompt). Output ONLY the JSON array, nothing else.`;

            const llmRes = await fetch(window.ENV.LLM_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${window.ENV.LLM_API_KEY}` },
                body: JSON.stringify({
                    model: 'alemllm',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: summaryText }
                    ],
                    temperature: 0.3
                })
            });

            if (!llmRes.ok) throw new Error(`LLM error: ${llmRes.status}`);
            const llmData = await llmRes.json();
            const rawContent = llmData.choices[0].message.content;
            const match = rawContent.match(/\[[\s\S]*\]/);
            const items = JSON.parse(match ? match[0] : '[]');

            if (!Array.isArray(items) || items.length === 0) {
                if (btnText) btnText.textContent = 'Концепции не найдены';
                if (btnIcon) btnIcon.textContent = '❌';
                if (btn) btn.disabled = false;
                return;
            }

            if (visualsContainer) visualsContainer.style.display = 'block';
            if (btnText) btnText.textContent = `Генерирую ${items.length} изображений...`;

            // Step 2: Generate images for each concept
            let generated = 0;
            for (const item of items) {
                if (!item.prompt || !item.concept) continue;

                // Show placeholder card immediately
                const wrapper = document.createElement('div');
                wrapper.style.cssText = 'background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; overflow: hidden; margin-bottom: 8px;';
                wrapper.id = `visual-card-${generated}`;
                wrapper.innerHTML = `
                    <div style="padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.2);">
                        <span style="font-weight: 600; color: #e2e8f0; font-size: 0.9rem;">${item.concept}</span>
                        <span style="font-size: 0.75rem; color: #10b981; background: rgba(16,185,129,0.1); padding: 2px 8px; border-radius: 4px;">${item.type || 'Concept'}</span>
                    </div>
                    <div id="visual-img-${generated}" style="padding: 14px; display: flex; justify-content: center; align-items: center; min-height: 120px; background: rgba(0,0,0,0.1); color: #64748b; font-size: 0.85rem;">⏳ Генерирую...</div>
                `;
                if (visualsList) visualsList.appendChild(wrapper);

                try {
                    const imageGenUrl = window.ENV.CORS_PROXY
                        ? 'http://localhost:3000/image-gen'
                        : 'https://llm.alem.ai/v1/images/generations';

                    const imgRes = await fetch(imageGenUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${window.ENV.IMAGE_API_KEY}`
                        },
                        body: JSON.stringify({
                            model: "text-to-image",
                            prompt: item.prompt,
                            n: 1,
                            size: "1024x1024"
                        })
                    });

                    const imgSlot = document.getElementById(`visual-img-${generated}`);
                    if (imgRes.ok) {
                        const imgData = await imgRes.json();
                        let imgUrl = "";
                        if (imgData.data && imgData.data[0]) {
                            if (imgData.data[0].url) {
                                imgUrl = imgData.data[0].url;
                            } else if (imgData.data[0].b64_json) {
                                imgUrl = `data:image/png;base64,${imgData.data[0].b64_json}`;
                            }
                        }
                        
                        if (imgUrl && imgSlot) {
                            imgSlot.innerHTML = `<img src="${imgUrl}" alt="${item.concept}" style="max-width: 100%; max-height: 300px; object-fit: contain; border-radius: 8px; display: block; background: #fff;">`;
                        }
                    } else {
                        if (imgSlot) imgSlot.innerHTML = '❌ Не удалось сгенерировать';
                    }
                } catch (imgErr) {
                    const imgSlot = document.getElementById(`visual-img-${generated}`);
                    if (imgSlot) imgSlot.innerHTML = '❌ Ошибка';
                }
                generated++;
            }

            if (btnText) btnText.textContent = 'Перегенерировать';
            if (btnIcon) btnIcon.textContent = '🔄';
            if (btn) btn.disabled = false;

        } catch (e) {
            console.error('[generateVisualsOnDemand] Error:', e);
            if (btnText) btnText.textContent = 'Ошибка — попробуйте снова';
            if (btnIcon) btnIcon.textContent = '❌';
            if (btn) btn.disabled = false;
        }
    };

    window.currentLessonTestAnswers = [];

    window.generateTestOnDemand = async () => {
        const summaryText = window.currentLessonSummaryText;
        if (!summaryText || summaryText === 'Конспект не был создан для этого урока.') {
            alert('Сначала дождитесь или создайте конспект ИИ.');
            return;
        }

        const btn = document.getElementById('lvm-generate-test-btn');
        const btnText = document.getElementById('lvm-generate-test-btn-text');
        const btnIcon = document.getElementById('lvm-generate-test-btn-icon');
        const testContainer = document.getElementById('lvm-test-container');
        const testList = document.getElementById('lvm-test-list');
        const submitTestBtn = document.getElementById('lvm-submit-test-btn');
        const testResult = document.getElementById('lvm-test-result');

        if (btn) btn.disabled = true;
        if (btnIcon) btnIcon.textContent = '⏳';
        if (btnText) btnText.textContent = 'Генерирую тест (ИИ анализирует)...';
        if (testList) testList.innerHTML = '';
        if (testResult) testResult.style.display = 'none';
        if (submitTestBtn) submitTestBtn.style.display = 'none';

        try {
            const systemPrompt = `Act as an expert Educational Assessor. Based on the provided lesson summary, generate a 10-question multiple-choice test in Russian.
Constraint: The output MUST be a valid JSON array of objects. Each object MUST have:
- "question" (string, the question text)
- "options" (array of exactly 4 strings, the possible answers)
- "correctIndex" (integer between 0 and 3, the index of the correct option in the options array).
Return ONLY the JSON array, no extra text formatting padding, plain JSON list.`;

            const llmRes = await fetch(window.ENV.LLM_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${window.ENV.LLM_API_KEY}` },
                body: JSON.stringify({
                    model: 'alemllm',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: summaryText }
                    ],
                    temperature: 0.3
                })
            });

            if (!llmRes.ok) throw new Error(`LLM Error: ${llmRes.status}`);
            const llmData = await llmRes.json();
            const rawContent = llmData.choices[0].message.content;
            
            let jsonContent = rawContent;
            const match = rawContent.match(/\[[\s\S]*\]/);
            if (match) jsonContent = match[0];
            
            let questions = [];
            try {
                questions = JSON.parse(jsonContent);
            } catch (e) {
                console.error("JSON parse error:", e, rawContent);
                throw new Error("Invalid format from LLM");
            }
            
            if (!Array.isArray(questions) || questions.length === 0) {
                throw new Error("No questions generated.");
            }

            // Cap at 10
            if (questions.length > 10) questions = questions.slice(0, 10);
            
            window.currentLessonTestAnswers = questions;

            if (testContainer) testContainer.style.display = 'block';
            
            questions.forEach((q, qIndex) => {
                const qDiv = document.createElement('div');
                qDiv.style.cssText = 'background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; margin-bottom: 12px;';
                
                let optionsHtml = '';
                q.options.forEach((opt, oIndex) => {
                    optionsHtml += `
                        <label style="display:flex; align-items:flex-start; gap:8px; margin-bottom:8px; cursor:pointer; color:#e2e8f0; font-size:0.9rem; padding:8px; border-radius:6px; background:rgba(0,0,0,0.2);">
                            <input type="radio" name="video_test_q${qIndex}" value="${oIndex}" style="margin-top:2px;">
                            <span>${opt}</span>
                        </label>
                    `;
                });
                
                qDiv.innerHTML = `
                    <div style="font-weight:600; color:#cbd5e1; margin-bottom:12px; font-size:1rem;">${qIndex + 1}. ${q.question}</div>
                    <div>${optionsHtml}</div>
                `;
                testList.appendChild(qDiv);
            });
            
            if (submitTestBtn) submitTestBtn.style.display = 'block';
            
            if (btnText) btnText.textContent = 'Перегенерировать тест';
            if (btnIcon) btnIcon.textContent = '🔄';
            if (btn) btn.disabled = false;

        } catch (err) {
            console.error('generateTestOnDemand error:', err);
            if (btnText) btnText.textContent = 'Ошибка генерации — повторить';
            if (btnIcon) btnIcon.textContent = '❌';
            if (btn) btn.disabled = false;
            alert('Сбой генерации теста: Возможно, конспект слишком короткий или сервер перегружен.');
        }
    };

    window.submitVideoLessonTest = async () => {
        const questions = window.currentLessonTestAnswers;
        if (!questions || questions.length === 0) return;

        const submitTestBtn = document.getElementById('lvm-submit-test-btn');
        const testResult = document.getElementById('lvm-test-result');
        const btnArea = document.getElementById('lvm-generate-test-btn');
        
        if (submitTestBtn) submitTestBtn.disabled = true;
        if (submitTestBtn) submitTestBtn.textContent = 'Оцениваю...';
        
        let correctCount = 0;
        let evaluationLog = [];
        let allAnswered = true;
        
        for (let i = 0; i < questions.length; i++) {
            const selected = document.querySelector(`input[name="video_test_q${i}"]:checked`);
            if (!selected) {
                allAnswered = false;
                break;
            }
            const selIdx = parseInt(selected.value);
            const isCorrect = (selIdx === questions[i].correctIndex);
            if (isCorrect) correctCount++;
            
            evaluationLog.push(`В: ${questions[i].question} | Ваш ответ: ${questions[i].options[selIdx]} | Правильно: ${isCorrect ? 'Да' : 'Нет'}`);
        }
        
        if (!allAnswered) {
             alert('Пожалуйста, ответьте на все вопросы.');
             if (submitTestBtn) submitTestBtn.disabled = false;
             if (submitTestBtn) submitTestBtn.textContent = 'Отправить ответы';
             return;
        }

        try {
            // Get user class_code if available
            let userClassCode = 'ALEM-101'; // Fallback
            try {
                const userDoc = await window.fireDB.collection('users').doc(currentUser.uid).get();
                if (userDoc.exists && userDoc.data().class_code) {
                    userClassCode = userDoc.data().class_code;
                }
            } catch (ignore) {}

            await window.fireDB.collection('exam_submissions').add({
                assignment_id: 'video_lesson_' + window.currentLessonId,
                exam_id: 'video_lesson_' + window.currentLessonId,
                class_code: userClassCode,
                student_uid: currentUser.uid,
                student_name: currentUser.displayName || currentUser.email,
                subject: window.currentLessonSubject || 'Общий',
                score: correctCount,
                total: questions.length,
                log: evaluationLog,
                submitted_at: firebase.firestore.FieldValue.serverTimestamp()
            });

            if (testResult) {
                testResult.style.display = 'block';
                testResult.innerHTML = `Экзамен завершён!<br>Ваша оценка: ${correctCount} из ${questions.length}<br><span style="font-size:0.8rem; font-weight:normal; color:#94a3b8;">Сохранено в журнал.</span>`;
            }
            if (submitTestBtn) submitTestBtn.style.display = 'none';
            if (btnArea) btnArea.style.display = 'none';
            
            // Highlight the options
            for (let i = 0; i < questions.length; i++) {
                const radios = document.querySelectorAll(`input[name="video_test_q${i}"]`);
                radios.forEach(r => {
                    r.disabled = true;
                    if (parseInt(r.value) === questions[i].correctIndex) {
                        r.parentElement.style.border = '1px solid #10b981';
                        r.parentElement.style.background = 'rgba(16,185,129,0.1)';
                    } else if (r.checked && parseInt(r.value) !== questions[i].correctIndex) {
                        r.parentElement.style.border = '1px solid #ef4444';
                        r.parentElement.style.background = 'rgba(239,68,68,0.1)';
                    }
                });
            }

            // Immediately load the student results if Gradebook tab logic exists
            if (window.loadAndRenderGradebookStudent) {
                window.loadAndRenderGradebookStudent();
            }

        } catch (e) {
            console.error('Test submission error:', e);
            alert('Ошибка при сохранении результата: ' + e.message);
            if (submitTestBtn) {
                 submitTestBtn.disabled = false;
                 submitTestBtn.textContent = 'Отправить ответы';
            }
        }
    };
    // ==========================================
    // ALEM KAHOOT GAME ENGINE
    // ==========================================

    const AlemKahoot = {
        state: {
            questions: [],
            teams: [],
            currentIdx: 0,
            currentTeamTurnIdx: 0,
            timer: 30,
            timerInterval: null,
            classCode: '',
            isGameActive: false,
            canClick: true
        },

        init() {
            const bind = (id, fn) => {
                const el = document.getElementById(id);
                if (el) {
                    el.onclick = (e) => {
                        console.log(`[Kahoot] Clicked ${id}`);
                        fn.call(this, e);
                    };
                }
            };

            bind('kahoot-generate-btn', this.prepareGame);
            bind('kahoot-start-game-btn', this.startGame);
            bind('kahoot-reveal-btn', this.revealAnswer);
            bind('kahoot-next-btn', this.nextQuestion);
            bind('kahoot-skip-btn', this.skipQuestion);
            bind('kahoot-finish-btn', this.showFinalScoreboard);
            bind('kahoot-restart-btn', this.resetToSetup);
        },

        async prepareGame() {
            const topic = document.getElementById('kahoot-topic').value.trim();
            const classCode = document.getElementById('kahoot-class-code').value.trim();
            const teamCount = parseInt(document.getElementById('kahoot-teams-count').value) || 2;
            const qCount = parseInt(document.getElementById('kahoot-questions-count').value) || 5;
            const tLimit = parseInt(document.getElementById('kahoot-time-limit').value) || 30;

            if (!topic || !classCode) return alert('Пожалуйста, введите тему и код класса.');

            const genBtn = document.getElementById('kahoot-generate-btn');
            genBtn.disabled = true;
            genBtn.innerHTML = '🪄 ИИ генерирует викторину...';

            try {
                const students = await this.getStudents(classCode);
                if (students.length < teamCount) throw new Error(`Недостаточно учеников в классе ${classCode}`);

                const questions = await this.generateQuiz(topic, qCount);
                if (!questions || !questions.length) throw new Error('ИИ не смог сгенерировать вопросы.');

                this.state.teams = this.shuffleAndSplit(students, teamCount);
                this.state.questions = questions;
                this.state.classCode = classCode;
                this.state.timeLimit = tLimit;
                this.state.currentIdx = 0;
                this.state.currentTeamTurnIdx = 0;

                this.showView('kahoot-lobby');
                this.renderLobby();
            } catch (err) {
                alert("Ошибка: " + err.message);
            } finally {
                genBtn.disabled = false;
                genBtn.innerHTML = '🚀 Сгенерировать и начать';
            }
        },

        async getStudents(classCode) {
            const snap = await window.fireDB.collection('users')
                .where('class_code', '==', classCode)
                .where('role', '==', 'student').get();
            const list = [];
            snap.forEach(doc => list.push({ uid: doc.id, name: doc.data().display_name || doc.data().email }));
            return list;
        },

        shuffleAndSplit(students, count) {
            const shuffled = [...students].sort(() => Math.random() - 0.5);
            const teams = [];
            for (let i = 0; i < count; i++) {
                teams.push({
                    name: `Команда ${i + 1}`,
                    members: [],
                    score: 0,
                    color: ['#fb7185', '#38bdf8', '#fbbf24', '#34d399'][i % 4]
                });
            }
            shuffled.forEach((s, idx) => teams[idx % count].members.push(s.name));
            return teams;
        },

        async generateQuiz(topic, count) {
            const prompt = `Составь ${count} вопросов для Kahoot по теме: "${topic}". Верни строго JSON массив объектов {question, options:[4], correctIdx, explanation}. explanation - короткое пояснение почему верно.`;
            const res = await fetch(window.ENV.LLM_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${window.ENV.LLM_API_KEY}` },
                body: JSON.stringify({ model: "alemllm", messages: [{ role: "system", content: prompt }] })
            });
            const data = await res.json();
            const raw = data.choices[0].message.content;
            
            // Robust extraction: find the first '[' and last ']'
            const start = raw.indexOf('[');
            const end = raw.lastIndexOf(']');
            if (start === -1 || end === -1) {
                console.error("AI response missing JSON brackets:", raw);
                throw new Error("Неверный формат ответа ИИ");
            }
            
            const cleanJson = raw.substring(start, end + 1).trim();
            try {
                return JSON.parse(cleanJson);
            } catch (e) {
                console.error("JSON parse failed, attempting recovery:", e, cleanJson);
                // Simple recovery: if it ends with a comma and is truncated, try to close it
                try {
                    const recovered = cleanJson.replace(/,?\s*$/, '') + ']';
                    return JSON.parse(recovered);
                } catch (_) {
                    throw new Error("Ошибка в формате вопросов. Попробуйте сменить тему.");
                }
            }
        },

        renderLobby() {
            const grid = document.getElementById('kahoot-teams-grid');
            grid.innerHTML = '';
            this.state.teams.forEach(team => {
                const card = document.createElement('div');
                card.className = 'kahoot-team-card';
                card.style.borderTop = `5px solid ${team.color}`;
                card.innerHTML = `<h3 style="color: ${team.color}; font-size: 1.4rem;">${team.name}</h3>
                    <div style="display:flex; flex-wrap:wrap; gap:8px;">${team.members.map(m => `<div class="team-student-item">${m}</div>`).join('')}</div>`;
                grid.appendChild(card);
            });
        },

        startGame() {
            this.state.isGameActive = true;
            this.showView('kahoot-game');
            this.renderQuestion();
        },

        renderQuestion() {
            const q = this.state.questions[this.state.currentIdx];
            const activeTeam = this.state.teams[this.state.currentTeamTurnIdx];
            
            document.getElementById('kahoot-question-text').textContent = q.question;
            document.getElementById('kahoot-progress').textContent = `${this.state.currentIdx + 1} / ${this.state.questions.length}`;
            
            const turnEl = document.getElementById('kahoot-current-turn');
            turnEl.textContent = `🚩 Ход: ${activeTeam.name}`;
            turnEl.style.color = activeTeam.color;

            // Hide explanation
            document.getElementById('kahoot-explanation-box').style.display = 'none';

            const grid = document.getElementById('kahoot-options-grid');
            grid.innerHTML = '';
            const colors = ['#e11d48', '#2563eb', '#d97706', '#059669'];
            
            q.options.forEach((opt, idx) => {
                const card = document.createElement('div');
                card.className = 'kahoot-opt-card';
                card.style.backgroundColor = colors[idx];
                card.innerHTML = `<span>${opt}</span><div class="feedback-label"></div>`;
                card.onclick = () => this.handleOptionClick(idx, card);
                grid.appendChild(card);
            });

            this.state.canClick = true;
            this.renderTeamStatus();
            
            document.getElementById('kahoot-reveal-btn').style.display = 'block';
            document.getElementById('kahoot-skip-btn').style.display = 'block';
            document.getElementById('kahoot-next-btn').style.display = 'none';
            document.getElementById('kahoot-finish-btn').style.display = 'none';
            
            this.startTimer();
        },

        handleOptionClick(idx, el) {
            if (!this.state.canClick) return;
            this.state.canClick = false;
            clearInterval(this.state.timerInterval);

            const q = this.state.questions[this.state.currentIdx];
            const isCorrect = idx === q.correctIdx;
            const label = el.querySelector('.feedback-label');

            if (isCorrect) {
                el.classList.add('selected-correct');
                label.textContent = 'ВЕРНО!';
                this.state.teams[this.state.currentTeamTurnIdx].score += 100;
            } else {
                el.classList.add('selected-wrong');
                label.textContent = 'ОШИБКА';
                const cards = document.querySelectorAll('.kahoot-opt-card');
                cards[q.correctIdx].classList.add('correct');
                cards[q.correctIdx].querySelector('.feedback-label').textContent = 'ПРАВИЛЬНО!';
                cards[q.correctIdx].querySelector('.feedback-label').style.opacity = '1';
                cards.forEach((c, cidx) => { if(cidx !== idx && cidx !== q.correctIdx) c.classList.add('fade'); });
            }

            this.showExplanation(q.explanation);
            this.renderTeamStatus();
            this.prepareNavigation();
        },

        showExplanation(text) {
            const box = document.getElementById('kahoot-explanation-box');
            const txt = document.getElementById('kahoot-explanation-text');
            if (box && txt) {
                txt.textContent = text || "Правильный ответ подтвержден.";
                box.style.display = 'block';
            }
        },

        prepareNavigation() {
            document.getElementById('kahoot-reveal-btn').style.display = 'none';
            document.getElementById('kahoot-skip-btn').style.display = 'none';
            
            if (this.state.currentIdx < this.state.questions.length - 1) {
                document.getElementById('kahoot-next-btn').style.display = 'block';
            } else {
                document.getElementById('kahoot-finish-btn').style.display = 'block';
            }
        },

        renderTeamStatus() {
            const container = document.getElementById('kahoot-team-status');
            if (!container) return;
            container.innerHTML = '';
            this.state.teams.forEach(team => {
                const badge = document.createElement('div');
                badge.className = 'team-badge';
                badge.style.color = team.color;
                badge.style.borderColor = team.color;
                badge.innerHTML = `<span>👥</span> ${team.score}`;
                container.appendChild(badge);
            });
        },

        startTimer() {
            this.state.timer = this.state.timeLimit || 30;
            const timerEl = document.getElementById('kahoot-timer');
            if (!timerEl) return;
            timerEl.textContent = this.state.timer;
            timerEl.classList.remove('warning');
            clearInterval(this.state.timerInterval);
            this.state.timerInterval = setInterval(() => {
                this.state.timer--;
                timerEl.textContent = this.state.timer;
                if (this.state.timer <= 5) timerEl.classList.add('warning');
                if (this.state.timer <= 0) {
                    clearInterval(this.state.timerInterval);
                    this.state.canClick = false;
                    this.revealAnswer();
                }
            }, 1000);
        },

        revealAnswer() {
            clearInterval(this.state.timerInterval);
            const q = this.state.questions[this.state.currentIdx];
            const cards = document.querySelectorAll('.kahoot-opt-card');
            cards.forEach((card, idx) => {
                if (idx === q.correctIdx) {
                    card.classList.add('correct');
                    const lbl = card.querySelector('.feedback-label');
                    if (lbl) {
                        lbl.textContent = 'ОТВЕТ';
                        lbl.style.opacity = '1';
                    }
                } else {
                    card.classList.add('fade');
                }
            });
            this.showExplanation(q.explanation);
            this.prepareNavigation();
        },

        skipQuestion() {
            console.log("[Kahoot] Skipping question");
            this.nextQuestion();
        },

        nextQuestion() {
            if (this.state.currentIdx >= this.state.questions.length - 1) {
                return this.showFinalScoreboard();
            }
            this.state.currentIdx++;
            this.state.currentTeamTurnIdx = (this.state.currentTeamTurnIdx + 1) % this.state.teams.length;
            this.renderQuestion();
        },

        showFinalScoreboard() {
            this.showView('kahoot-final');
            const leaderboard = document.getElementById('kahoot-leaderboard');
            if (!leaderboard) return;
            leaderboard.innerHTML = '';
            const ranked = [...this.state.teams].sort((a,b) => b.score - a.score);
            ranked.forEach((team, idx) => {
                const row = document.createElement('div');
                row.className = 'glass-panel';
                row.style.padding = '20px 30px'; row.style.borderRadius = '16px';
                row.style.display = 'flex'; row.style.justifyContent = 'space-between';
                row.style.alignItems = 'center'; row.style.borderLeft = `6px solid ${team.color}`;
                row.innerHTML = `<div style="display:flex; align-items:center; gap:20px;">
                    <span style="font-size: 1.5rem; font-weight: 800; color: #94a3b8;">#${idx+1}</span>
                    <span style="font-size: 1.3rem; font-weight: 700; color: white;">${team.name}</span>
                </div><span style="font-size: 1.5rem; font-weight: 800; color: ${team.color};">${team.score} б.</span>`;
                leaderboard.appendChild(row);
            });
        },

        resetToSetup() { this.showView('kahoot-setup'); },

        showView(viewId) {
            ['kahoot-setup', 'kahoot-lobby', 'kahoot-game', 'kahoot-final'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = id === viewId ? 'flex' : 'none';
            });
        }
    };

    const AlemWheel = {
        state: {
            slices: [
                { type: 'bonus', label: '+50 pts', value: 50, color: '#fbbf24' },
                { type: 'question', label: 'QUESTION ❓', color: '#3b82f6' },
                { type: 'penalty', label: '-50 pts', value: -50, color: '#ef4444' },
                { type: 'question', label: 'QUESTION ❓', color: '#6366f1' },
                { type: 'jackpot', label: 'JACKPOT 👑', value: 100, color: '#22d3ee' },
                { type: 'question', label: 'QUESTION ❓', color: '#3b82f6' },
                { type: 'bonus', label: '+50 pts', value: 50, color: '#10b981' },
                { type: 'question', label: 'QUESTION ❓', color: '#6366f1' }
            ],
            teams: [],
            currentTeamIdx: 0,
            round: 1,
            isSpinning: false,
            rotation: 0,
            topic: ''
        },

        init() {
            const bind = (id, fn) => {
                const el = document.getElementById(id);
                if (el) el.onclick = () => fn.call(this);
            };
            bind('wheel-generate-btn', this.prepareGame);
            bind('wheel-start-game-btn', this.startGame);
            bind('wheel-spin-btn', this.spin);
            bind('wheel-reset-btn', () => this.showView('wheel-setup'));
            this.renderSlices();
        },

        renderSlices() {
            const group = document.getElementById('wheel-slices-group');
            if (!group) return;
            group.innerHTML = '';
            const sliceAngle = 360 / this.state.slices.length;

            this.state.slices.forEach((slice, i) => {
                const startAngle = i * sliceAngle;
                const endAngle = (i + 1) * sliceAngle;
                
                // SVG Path for slice
                const x1 = 50 + 48 * Math.cos(Math.PI * (startAngle - 90) / 180);
                const y1 = 50 + 48 * Math.sin(Math.PI * (startAngle - 90) / 180);
                const x2 = 50 + 48 * Math.cos(Math.PI * (endAngle - 90) / 180);
                const y2 = 50 + 48 * Math.sin(Math.PI * (endAngle - 90) / 180);
                
                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                path.setAttribute("d", `M 50 50 L ${x1} ${y1} A 48 48 0 0 1 ${x2} ${y2} Z`);
                path.setAttribute("fill", slice.color);
                path.setAttribute("stroke", "white");
                path.setAttribute("stroke-width", "0.2");
                group.appendChild(path);

                // Text (Smaller for wheel)
                const textAngle = startAngle + sliceAngle / 2;
                const tx = 50 + 32 * Math.cos(Math.PI * (textAngle - 90) / 180);
                const ty = 50 + 32 * Math.sin(Math.PI * (textAngle - 90) / 180);
                
                const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
                text.setAttribute("x", tx);
                text.setAttribute("y", ty);
                text.setAttribute("text-anchor", "middle");
                text.setAttribute("class", "wheel-slice-text");
                text.setAttribute("style", "font-size: 2.5px; fill: white; font-weight: 800;");
                text.setAttribute("transform", `rotate(${textAngle}, ${tx}, ${ty})`);
                text.textContent = slice.label;
                group.appendChild(text);
            });
        },

        async prepareGame() {
            const topic = document.getElementById('wheel-topic').value.trim();
            const classCode = document.getElementById('wheel-class-code').value.trim();
            const teamCount = parseInt(document.getElementById('wheel-teams-count').value);

            if (!topic || !classCode) return alert('Введите тему и код класса');

            const btn = document.getElementById('wheel-generate-btn');
            btn.disabled = true; btn.innerHTML = '🪄 Готовим поле и вопросы...';

            try {
                const students = await AlemKahoot.getStudents(classCode);
                this.state.teams = AlemKahoot.shuffleAndSplit(students, teamCount);
                this.state.topic = topic;
                this.state.currentTeamIdx = 0;
                this.state.round = 1;
                
                // Pre-generate a batch of unique questions so we don't repeat
                // Using 8 instead of 15 to stay within common token limits for JSON response
                this.state.questions = await AlemKahoot.generateQuiz(topic, 8);

                this.showView('wheel-lobby');
                this.renderLobby();
                
                // Clear sidebar
                document.getElementById('wheel-sidebar-content').innerHTML = `
                    <div style="text-align: center; color: #64748b; margin-top: 50px;">
                        <div style="font-size: 3rem; margin-bottom: 15px; opacity: 0.3;">🎰</div>
                        <p>Крутите колесо, чтобы начать!</p>
                    </div>`;
            } catch (err) {
                alert(err.message);
            } finally {
                btn.disabled = false; btn.innerHTML = 'Начать игру 🎰';
            }
        },

        renderLobby() {
            const grid = document.getElementById('wheel-teams-grid');
            grid.innerHTML = '';
            this.state.teams.forEach(team => {
                const card = document.createElement('div');
                card.className = 'kahoot-team-card';
                card.style.borderTop = `5px solid ${team.color}`;
                card.innerHTML = `<h3 style="color: ${team.color}; font-size: 1.4rem;">${team.name}</h3>
                    <div style="display:flex; flex-wrap:wrap; gap:8px;">${team.members.map(m => `<div class="team-student-item">${m}</div>`).join('')}</div>`;
                grid.appendChild(card);
            });
        },

        startGame() {
            this.showView('wheel-game');
            this.updateUI();
        },

        updateUI() {
            const activeTeam = this.state.teams[this.state.currentTeamIdx];
            const turnEl = document.getElementById('wheel-current-turn');
            turnEl.textContent = `🚩 Ход: ${activeTeam.name}`;
            turnEl.style.color = activeTeam.color;

            const status = document.getElementById('wheel-team-status');
            status.innerHTML = '';
            this.state.teams.forEach(t => {
                const badge = document.createElement('div');
                badge.className = 'team-badge';
                badge.style.cssText = `color: ${t.color}; border-color: ${t.color}; padding: 4px 10px; font-size: 0.85rem; background: rgba(255,255,255,0.05); border: 1px solid; border-radius: 20px; display: flex; align-items: center; gap: 6px;`;
                badge.innerHTML = `<span>👥</span> ${t.score}`;
                status.appendChild(badge);
            });

            document.getElementById('wheel-round-text').textContent = this.state.round;
        },

        spin() {
            if (this.state.isSpinning) return;
            this.state.isSpinning = true;
            document.getElementById('wheel-spin-btn').disabled = true;

            const rotations = 5 + Math.random() * 5;
            const extraDegrees = Math.random() * 360;
            this.state.rotation += (rotations * 360) + extraDegrees;

            const wheel = document.getElementById('wheel-svg-el');
            wheel.style.transform = `rotate(${this.state.rotation}deg)`;

            // Clear sidebar while spinning
            document.getElementById('wheel-sidebar-content').innerHTML = `
                <div style="text-align: center; color: #fbbf24; margin-top: 80px; animation: pulse 1s infinite;">
                    <div style="font-size: 4rem; margin-bottom: 20px;">🎢</div>
                    <p style="font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">Удача улыбается...</p>
                </div>`;

            setTimeout(() => {
                this.state.isSpinning = false;
                document.getElementById('wheel-spin-btn').disabled = false;
                this.calculateResult();
            }, 4100);
        },

        calculateResult() {
            const actualRotation = this.state.rotation % 360;
            const sliceAngle = 360 / this.state.slices.length;
            const index = Math.floor((this.state.slices.length - (actualRotation / sliceAngle)) % this.state.slices.length);
            const slice = this.state.slices[index];
            this.handleResult(slice);
        },

        async handleResult(slice) {
            const sidebar = document.getElementById('wheel-sidebar-content');
            
            if (slice.type === 'bonus' || slice.type === 'jackpot') {
                this.state.teams[this.state.currentTeamIdx].score += slice.value;
                sidebar.innerHTML = `
                <div class="bonus-card" style="width: 100%; border-radius: 20px; padding: 30px; text-align: center; background: rgba(251, 191, 36, 0.05); border: 1px solid rgba(251, 191, 36, 0.2); margin-top: 20px;">
                    <div style="font-size: 4rem; margin-bottom: 15px;">🎁</div>
                    <h2 style="color: #fbbf24; font-size: 1.8rem; margin-bottom: 10px;">БОНУС!</h2>
                    <p style="color: white; font-size: 1.1rem; margin-bottom: 25px;">${this.state.teams[this.state.currentTeamIdx].name} получает <b style="color:#fbbf24;">+${slice.value}</b> баллов!</p>
                    <button class="btn-primary" style="padding: 12px 30px; font-size: 1rem;" onclick="AlemWheel.closeResult()">Следующая команда ➡</button>
                </div>`;
            } else if (slice.type === 'penalty') {
                this.state.teams[this.state.currentTeamIdx].score += slice.value;
                sidebar.innerHTML = `
                <div class="penalty-card" style="width: 100%; border-radius: 20px; padding: 30px; text-align: center; background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2); margin-top: 20px;">
                    <div style="font-size: 4rem; margin-bottom: 15px;">💥</div>
                    <h2 style="color: #ef4444; font-size: 1.8rem; margin-bottom: 10px;">ПРОВАЛ!</h2>
                    <p style="color: white; font-size: 1.1rem; margin-bottom: 25px;">${this.state.teams[this.state.currentTeamIdx].name} теряет <b style="color:#ef4444;">${Math.abs(slice.value)}</b> баллов.</p>
                    <button class="btn-secondary" style="padding: 12px 30px; font-size: 1rem;" onclick="AlemWheel.closeResult()">Продолжить</button>
                </div>`;
            } else if (slice.type === 'question') {
                sidebar.innerHTML = `
                <div style="text-align: center; color: white; margin-top: 80px;">
                    <div style="font-size: 3rem; margin-bottom: 20px;">🤔</div>
                    <p>Открываем вопрос...</p>
                </div>`;
                try {
                    if (!this.state.questions || this.state.questions.length === 0) {
                         sidebar.innerHTML = `<div style="text-align: center; color: white; margin-top: 80px;"><p>🔄 Генерируем новые вопросы...</p></div>`;
                         this.state.questions = await AlemKahoot.generateQuiz(this.state.topic, 10);
                    }
                    const q = this.state.questions.shift();
                    this.renderQuestionResult(q);
                } catch (err) {
                    sidebar.innerHTML = '<div style="color:red; margin-top: 50px;">Ошибка генерации. Пропускаем.</div>';
                    setTimeout(() => this.closeResult(), 2000);
                }
            }
        },

        renderQuestionResult(q) {
            const sidebar = document.getElementById('wheel-sidebar-content');
            sidebar.innerHTML = `
            <div class="glass-panel" style="padding: 15px 20px; border-radius: 20px; text-align: left; background: rgba(255,255,255,0.03); width: 100%; border: 1px solid rgba(255,255,255,0.05); margin-top: 0;">
                <div style="color: #fbbf24; font-size: 0.8rem; text-transform: uppercase; margin-bottom: 6px; font-weight: 700;">❓ Вопрос (100 баллов):</div>
                <h2 style="color:white; font-size: 1.3rem; font-weight: 700; line-height: 1.3; margin-bottom: 15px;">${q.question}</h2>
                <div id="wheel-options-grid" style="display: flex; flex-direction: column; gap: 8px;">
                    ${q.options.map((opt, i) => `
                        <div class="kahoot-opt-card" style="min-height: 48px; padding: 10px 15px; font-size: 0.95rem; border-radius: 10px; background: ${['#e11d48', '#2563eb', '#d97706', '#059669'][i]}; cursor: pointer; display: flex; justify-content: space-between; align-items: center;" 
                             onclick="AlemWheel.handleAnswer(${i}, ${q.correctIdx}, this)">
                            <span>${opt}</span>
                            <div class="feedback-label" style="font-size: 0.8rem; font-weight: 800;"></div>
                        </div>
                    `).join('')}
                </div>
                <div id="wheel-explanation" style="display:none; margin-top: 15px; padding: 12px; border-radius: 10px; background: rgba(255,255,255,0.05); color: #94a3b8; font-size: 0.85rem;">
                    <div style="margin-bottom: 10px; line-height: 1.4;"><b>💡 Объяснение:</b> ${q.explanation}</div>
                    <button class="btn-primary" style="width: 100%; padding: 10px; font-size: 0.95rem; border-radius: 8px;" onclick="AlemWheel.closeResult()">Продолжить ➡</button>
                </div>
            </div>`;
        },

        handleAnswer(idx, correctIdx, el) {
            const cards = document.querySelectorAll('#wheel-options-grid .kahoot-opt-card');
            cards.forEach(c => c.style.pointerEvents = 'none');

            const isCorrect = idx === correctIdx;
            const label = el.querySelector('.feedback-label');

            if (isCorrect) {
                el.style.boxShadow = '0 0 20px #10b981';
                el.style.border = '2px solid white';
                label.textContent = 'ВЕРНО! +100';
                this.state.teams[this.state.currentTeamIdx].score += 100;
            } else {
                el.style.opacity = '0.5';
                label.textContent = 'НЕВЕРНО';
                cards[correctIdx].style.boxShadow = '0 0 20px #10b981';
                cards[correctIdx].style.border = '2px solid white';
            }

            document.getElementById('wheel-explanation').style.display = 'block';
        },

        closeResult() {
            this.state.currentTeamIdx = (this.state.currentTeamIdx + 1) % this.state.teams.length;
            if (this.state.currentTeamIdx === 0) this.state.round++;
            this.updateUI();
            
            // Reset sidebar to initial prompt
            document.getElementById('wheel-sidebar-content').innerHTML = `
                <div style="text-align: center; color: #64748b; margin-top: 80px;">
                    <div style="font-size: 3rem; margin-bottom: 15px; opacity: 0.3;">🎰</div>
                    <p>Очередь команды: <br><b style="color:white; font-size: 1.2rem;">${this.state.teams[this.state.currentTeamIdx].name}</b></p>
                </div>`;
        },

        showView(id) {
            ['wheel-setup', 'wheel-lobby', 'wheel-game'].forEach(vid => {
                const el = document.getElementById(vid);
                if (el) el.style.display = (vid === id) ? 'flex' : 'none';
            });
        }
    };

    // Initialize Controllers
    AlemKahoot.init();
    AlemWheel.init();

    window.AlemWheel = AlemWheel;

    // ==========================================
    // TEACHER GRADEBOOK (EDUMARK STYLE)
    // ==========================================
    window.TeacherGradebookData = { classCode: '', students: [], dates: [], records: {}, aiTasks: {} };

    window.loadAndRenderGradebookTeacher = async function(classCode) {
        if (!classCode) return alert('Введите код класса');
        const tbody = document.getElementById('t-gb-body');
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">🔄 Загрузка данных...</td></tr>';
        
        try {
            // 1. Ученики
            const usersSnap = await fireDB.collection('users').where('class_code', '==', classCode).where('role', '==', 'student').get();
            let students = [];
            usersSnap.forEach(d => students.push({ uid: d.id, name: d.data().display_name || d.data().email }));
            students.sort((a,b) => a.name.localeCompare(b.name));
            
            // 2. Журнал (manual grades)
            const gbSnap = await fireDB.collection('gradebook_records').where('class_code', '==', classCode).get();
            let datesSet = new Set();
            let records = {}; // records[uid][date]
            
            gbSnap.forEach(doc => {
                 let d = doc.data(); 
                 datesSet.add(d.date);
                 if(!records[d.student_uid]) records[d.student_uid] = {};
                 records[d.student_uid][d.date] = { mark: d.mark || '', attendance: d.attendance || '' };
            });
            
            // 3. AI Tasks Average
            let aiTasks = {};
            const subSnap = await fireDB.collection('submissions').where('class_code', '==', classCode).get();
            subSnap.forEach(doc => {
                 let d = doc.data();
                 if(!aiTasks[d.student_uid]) aiTasks[d.student_uid] = { total:0, count:0 };
                 aiTasks[d.student_uid].total += parseFloat(d.score || 0);
                 aiTasks[d.student_uid].count++;
            });
            
            for(let uid in aiTasks) {
                aiTasks[uid].avg = Math.round(aiTasks[uid].total / aiTasks[uid].count);
            }
            
            let dates = Array.from(datesSet).sort();
            if(dates.length === 0) {
                 dates = [new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })];
            }
            
            window.TeacherGradebookData = { classCode, students, dates, records, aiTasks };
            window.renderTeacherGradebookTable();
        } catch (err) {
            console.error(err);
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">Ошибка: ${err.message}</td></tr>`;
        }
    };

    window.renderTeacherGradebookTable = function() {
        const headRow = document.getElementById('t-gb-header-row');
        const tbody = document.getElementById('t-gb-body');
        const data = window.TeacherGradebookData;
        
        let headerHtml = `
            <th style="padding: 15px; text-align: left; position: sticky; left: 0; background: #1e293b; z-index: 10; border-right: 1px solid rgba(255,255,255,0.1); min-width: 200px;">Ученик</th>
            <th style="padding: 15px; text-align: center; color: #a78bfa; border-right: 1px solid rgba(255,255,255,0.1);">ИИ Задачи</th>
            <th style="padding: 15px; text-align: center; color: #f472b6; border-right: 2px solid rgba(255,255,255,0.2);">ИИ Экзамены</th>`;
            
        data.dates.forEach(d => {
            headerHtml += `<th style="padding: 15px; text-align: center; min-width: 80px;">${d}</th>`;
        });
        headRow.innerHTML = headerHtml;
        
        tbody.innerHTML = '';
        if(data.students.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${3 + data.dates.length}" style="text-align:center; padding:20px;">Нет учеников</td></tr>`;
            return;
        }
        
        data.students.forEach(st => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
            
            let html = `
                <td style="padding: 12px 15px; position: sticky; left: 0; background: #0f172a; z-index: 5; border-right: 1px solid rgba(255,255,255,0.1); white-space: nowrap;">${st.name}</td>
                <td style="padding: 12px; text-align: center; color: #cbd5e1; border-right: 1px solid rgba(255,255,255,0.1);">${data.aiTasks[st.uid] ? data.aiTasks[st.uid].avg + '%' : '-'}</td>
                <td style="padding: 12px; text-align: center; color: #cbd5e1; border-right: 2px solid rgba(255,255,255,0.2);">-</td>`;
                
            data.dates.forEach(date => {
                let rec = data.records[st.uid] ? data.records[st.uid][date] : null;
                let val = rec ? (rec.attendance === 'Н' ? 'Н' : rec.mark) : '';
                html += `<td style="padding: 8px; text-align: center;">
                    <input type="text" maxlength="3" style="width: 50px; text-align: center; padding: 6px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: white; outline: none; transition: 0.2s;" 
                           value="${val}" 
                           oninput="this.style.borderColor='#3b82f6'"
                           onchange="window.updateGradebookCell('${st.uid}', '${date}', this.value); this.style.borderColor='rgba(16,185,129,0.5)'">
                </td>`;
            });
            tr.innerHTML = html;
            tbody.appendChild(tr);
        });
    };

    window.addGradebookColumn = function() {
        const d = new Date();
        const dateStr = d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
        let newDateStr = prompt("Введите дату для нового урока (ДД.ММ):", dateStr);
        if(!newDateStr) return;
        if(!window.TeacherGradebookData.dates.includes(newDateStr)) {
            window.TeacherGradebookData.dates.push(newDateStr);
            window.renderTeacherGradebookTable();
        } else {
            alert('Эта дата уже добавлена!');
        }
    };

    window.updateGradebookCell = function(uid, date, val) {
        let records = window.TeacherGradebookData.records;
        if(!records[uid]) records[uid] = {};
        if(!records[uid][date]) records[uid][date] = { mark: '', attendance: '' };
        
        val = val.trim().toUpperCase();
        if(val === 'Н') {
            records[uid][date].attendance = 'Н';
            records[uid][date].mark = '';
        } else {
            records[uid][date].attendance = '';
            records[uid][date].mark = val;
        }
    };

    window.saveTeacherGradebook = async function() {
        const btn = document.getElementById('t-gb-save-btn');
        const origBtnText = btn.innerHTML;
        btn.innerHTML = '⏳ Сохранение...';
        btn.disabled = true;
        
        try {
            const data = window.TeacherGradebookData;
            const batch = fireDB.batch();
            
            // Мы сохраняем каждую запись как отдельный документ для простоты фильтрации: "CLASS_UID_DATE"
            data.students.forEach(st => {
                data.dates.forEach(date => {
                    let rec = data.records[st.uid] ? data.records[st.uid][date] : null;
                    if(rec && (rec.mark || rec.attendance)) {
                        const docRef = fireDB.collection('gradebook_records').doc(`${data.classCode}_${st.uid}_${date}`);
                        batch.set(docRef, {
                            class_code: data.classCode,
                            student_uid: st.uid,
                            date: date,
                            mark: rec.mark || '',
                            attendance: rec.attendance || '',
                            updated_at: firebase.firestore.FieldValue.serverTimestamp()
                        }, { merge: true });
                    } else if (rec && !rec.mark && !rec.attendance) {
                        // Очистка ячейки - удаляем документ (игнорируем ошибки)
                        const docRef = fireDB.collection('gradebook_records').doc(`${data.classCode}_${st.uid}_${date}`);
                        batch.delete(docRef);
                    }
                });
            });
            
            await batch.commit();
            btn.innerHTML = '✅ Сохранено!';
            setTimeout(() => { btn.innerHTML = origBtnText; btn.disabled = false; }, 2000);
        } catch(err) {
            console.error(err);
            alert("Ошибка сохранения: " + err.message);
            btn.innerHTML = origBtnText; btn.disabled = false;
        }
    };

    // ==========================================
    // TEACHER CABINET / PROFILE
    // ==========================================
    window.loadTeacherCabinet = async function() {
        const user = firebase.auth().currentUser;
        if(!user) return;
        
        // Setup initial UI with current auth user info
        document.getElementById('t-profile-name').value = user.displayName || 'Преподаватель';
        document.getElementById('t-profile-email').textContent = user.email || 'Нет email';
        
        try {
            // Count Students and distinct Classes
            const usersSnap = await fireDB.collection('users').where('role', '==', 'student').get();
            let totalStudents = 0;
            let classes = new Set();
            usersSnap.forEach(doc => {
                let d = doc.data();
                if(d.class_code) classes.add(d.class_code);
                totalStudents++;
            });
            document.getElementById('t-stat-students').textContent = totalStudents;
            document.getElementById('t-stat-classes').textContent = classes.size;

            // Count Exams created by this teacher
            const examsSnap = await fireDB.collection('exams').where('teacher_uid', '==', user.uid).get();
            document.getElementById('t-stat-exams').textContent = examsSnap.size;

            // Count Submissions (general activity)
            // Note: In a massive scale app, this would use a cloud function aggregation sum.
            const subSnap = await fireDB.collection('submissions').get();
            document.getElementById('t-stat-submissions').textContent = subSnap.size;

        } catch (err) {
            console.error("Ошибка загрузки статистики кабинета:", err);
        }
    };

    window.updateTeacherProfile = async function() {
        const user = firebase.auth().currentUser;
        if(!user) return;
        
        const newName = document.getElementById('t-profile-name').value.trim();
        if(!newName) return alert('Имя не может быть пустым');
        
        try {
            // Update Auth Profile
            await user.updateProfile({ displayName: newName });
            // Update Firestore Profile
            await fireDB.collection('users').doc(user.uid).set({
                display_name: newName
            }, { merge: true });
            
            // Update UI
            document.getElementById('t-user-name').textContent = newName;
            alert('Профиль успешно обновлен!');
        } catch (err) {
            console.error(err);
            alert('Ошибка при сохранении: ' + err.message);
        }
    };

    window.resetTeacherPassword = async function() {
        const user = firebase.auth().currentUser;
        if(!user || !user.email) return alert('Email не найден');
        
        if(confirm(`Мы отправим письмо для сброса пароля на ${user.email}. Продолжить?`)) {
            try {
                await firebase.auth().sendPasswordResetEmail(user.email);
                alert('Письмо со ссылкой для сброса пароля успешно отправлено! Проверьте папку "Спам", если не видите его.');
            } catch (err) {
                alert('Ошибка: ' + err.message);
            }
        }
    };

});

// ==========================================
// PYTHON COMPILER (SKULPT) - Global scope
// ==========================================

window.runPython = function() {
    const code = document.getElementById('py-code-editor').value;
    const output = document.getElementById('py-output');
    const btn = document.getElementById('py-run-btn');

    output.textContent = '';
    output.style.color = '#a3e635';
    btn.textContent = '⏳ Запуск...';
    btn.disabled = true;

    function builtinRead(x) {
        if (Sk.builtinFiles === undefined || Sk.builtinFiles.files[x] === undefined)
            throw 'Файл не найден: \'' + x + '\''
        return Sk.builtinFiles.files[x];
    }

    Sk.configure({
        output: (text) => { output.textContent += text; },
        read: builtinRead,
        execLimit: 10000  // max operations to prevent infinite loops
    });

    const prog = Sk.misceval.asyncToPromise(() =>
        Sk.importMainWithBody("<stdin>", false, code, true)
    );

    prog.then(() => {
        btn.innerHTML = '▶ Запустить';
        btn.disabled = false;
        if (!output.textContent) output.textContent = '(Нет вывода)';
    }).catch((err) => {
        output.style.color = '#f87171';
        output.textContent = '🚨 Ошибка: ' + err.toString();
        btn.innerHTML = '▶ Запустить';
        btn.disabled = false;
    });
};

window.syncLineNumbers = function() {
    const editor = document.getElementById('py-code-editor');
    const lineNums = document.getElementById('py-line-numbers');
    if (!editor || !lineNums) return;
    const lines = editor.value.split('\n').length;
    lineNums.textContent = Array.from({length: lines}, (_, i) => i + 1).join('\n');
};

window.handleEditorKey = function(e) {
    const editor = document.getElementById('py-code-editor');
    // Tab key -> insert 4 spaces
    if (e.key === 'Tab') {
        e.preventDefault();
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        editor.value = editor.value.substring(0, start) + '    ' + editor.value.substring(end);
        editor.selectionStart = editor.selectionEnd = start + 4;
        window.syncLineNumbers();
    }
    // Ctrl+Enter -> run code
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        window.runPython();
    }
};

window.insertSnippet = function(type) {
    var editor = document.getElementById('py-code-editor');
    var map = {
        loop: 'for i in range(10):\n    print(i)',
        func: 'def greet(name):\n    return "Hello " + name\n\nprint(greet("Alem"))',
        list: 'fruits = ["apple", "banana", "mango"]\nfor f in fruits:\n    print(f)',
        dict: 'data = {"name": "Ali", "age": 14}\nprint(data["name"])',
        cls:  'class Animal:\n    def __init__(self, name):\n        self.name = name\n    def speak(self):\n        return self.name + " speaks"\n\ndog = Animal("Dog")\nprint(dog.speak())'
    };
    var key = (type === 'class') ? 'cls' : type;
    if (map[key]) {
        editor.value = map[key];
        window.syncLineNumbers();
        editor.focus();
    }
};

// ==========================================
// NATURAL SCIENCE AI CHAT - Global scope
// ==========================================

window.sendNsMessage = async function() {
    const input = document.getElementById('ns-chat-input');
    const container = document.getElementById('ns-chat-messages');
    const text = input.value.trim();
    if (!text) return;

    // 1. User message
    input.value = '';
    renderNsBubble('user', text);
    
    // Update state
    window.nsChatHistory.push({ role: "user", content: text });

    // 2. Bot "typing"
    const botBubble = renderNsBubble('bot', '⌛ Изучаю природу...');

    try {
        const response = await fetch(window.ENV.LLM_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.ENV.LLM_API_KEY}`
            },
            body: JSON.stringify({
                model: "alemllm",
                messages: window.nsChatHistory,
                temperature: 0.7
            })
        });

        if (!response.ok) throw new Error("API Error");
        const data = await response.json();
        let aiContent = data.choices[0].message.content;
        
        // Check for image generation tag
        const imgMatch = aiContent.match(/\[GENERATE_IMAGE:\s*(.*?)\]/);
        let cleanedContent = aiContent.replace(/\[GENERATE_IMAGE:.*?\]/g, '').trim();

        // Update bubble text
        botBubble.innerHTML = cleanedContent;
        window.nsChatHistory.push({ role: "assistant", content: aiContent });

        // Trigger Image Generation if found
        if (imgMatch && imgMatch[1]) {
            const prompt = imgMatch[1];
            generateNsImage(prompt, container);
        }

    } catch (err) {
        botBubble.innerHTML = "❌ Ошибка связи с природой. Попробуй еще раз!";
        console.error(err);
    }
};

function renderNsBubble(role, text) {
    const container = document.getElementById('ns-chat-messages');
    if (!container) return;
    const bubble = document.createElement('div');
    bubble.className = "ns-chat-bubble " + role;
    const isUser = role === 'user';
    bubble.style.cssText = `
        align-self: ${isUser ? 'flex-end' : 'flex-start'};
        background: ${isUser ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.05)'};
        padding: 12px 18px;
        border-radius: ${isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px'};
        font-size: 0.95rem;
        color: #e2e8f0;
        max-width: 85%;
        line-height: 1.6;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        animation: fadeIn 0.4s ease-out forwards;
    `;
    
    // Use robust marked call
    if (typeof marked !== 'undefined') {
        let rawHtml = "";
        try {
            // Support both old and new marked versions
            rawHtml = (typeof marked.parse === 'function') ? marked.parse(text) : marked(text);
        } catch (e) {
            console.error("Marked error:", e);
            rawHtml = text;
        }
        bubble.innerHTML = rawHtml;
        
        // Ensure standard formatting
        bubble.style.whiteSpace = 'normal'; 
        
        // Remove margins on first/last elements
        bubble.querySelectorAll('p:first-child, ul:first-child, ol:first-child, h1:first-child, h2:first-child, h3:first-child').forEach(el => el.style.marginTop = '0');
        bubble.querySelectorAll('p:last-child, ul:last-child, ol:last-child, h1:last-child, h2:last-child, h3:last-child').forEach(el => el.style.marginBottom = '0');
        bubble.querySelectorAll('ul, ol').forEach(el => el.style.paddingLeft = '20px');
    } else {
        bubble.style.whiteSpace = 'pre-wrap';
        bubble.textContent = text;
    }

    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
    return bubble;
}

async function generateNsImage(prompt, container) {
    const loaderBubble = renderNsBubble('bot', '🎨 Генерирую иллюстрацию процесса...');
    
    try {
        const imageGenUrl = window.ENV.CORS_PROXY
            ? 'http://localhost:3000/image-gen'
            : 'https://llm.alem.ai/v1/images/generations';

        const response = await fetch(imageGenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.ENV.IMAGE_API_KEY}`
            },
            body: JSON.stringify({
                model: "text-to-image",
                prompt: prompt,
                n: 1,
                size: "1024x1024"
            })
        });

        if (!response.ok) throw new Error("Image Gen Error");
        const data = await response.json();
        
        let imgUrl = "";
        if (data.data && data.data[0]) {
            imgUrl = data.data[0].url || (data.data[0].b64_json ? `data:image/png;base64,${data.data[0].b64_json}` : "");
        }

        if (imgUrl) {
            loaderBubble.innerHTML = `
                <div style="margin-bottom:8px;">Готово! Вот визуализация:</div>
                <img src="${imgUrl}" style="width:100%; border-radius:12px; border:1px solid rgba(255,255,255,0.1); cursor:pointer;" onclick="window.open('${imgUrl}', '_blank')">
                <div style="margin-top:4px; font-size:0.7rem; color:#94a3b8; font-style:italic;">Нажми, чтобы увеличить</div>
            `;
            const container = document.getElementById('ns-chat-messages');
            if (container) container.scrollTop = container.scrollHeight;
        } else {
             loaderBubble.innerHTML = "😔 Не удалось создать картинку.";
        }
    } catch (err) {
        loaderBubble.innerHTML = "❌ Ошибка при генерации графики.";
        console.error(err);
    }
}

// ==========================================
// MATHEMATICS HELPER - Global scope
// ==========================================

window.switchMathTab = function(tab) {
    const calcView = document.getElementById('math-calc-view');
    const formulasView = document.getElementById('math-formulas-view');
    const calcTab = document.getElementById('math-tab-calc');
    const formulasTab = document.getElementById('math-tab-formulas');

    if (tab === 'calc') {
        calcView.style.display = 'flex';
        formulasView.style.display = 'none';
        calcTab.style.background = 'rgba(139, 92, 246, 0.2)';
        calcTab.style.color = 'white';
        formulasTab.style.background = 'transparent';
        formulasTab.style.color = '#94a3b8';
    } else {
        calcView.style.display = 'none';
        formulasView.style.display = 'flex';
        formulasTab.style.background = 'rgba(139, 92, 246, 0.2)';
        formulasTab.style.color = 'white';
        calcTab.style.background = 'transparent';
        calcTab.style.color = '#94a3b8';
        if (window.MathJax && window.MathJax.typesetPromise) window.MathJax.typesetPromise();
    }
};

let calcExpression = "";
window.calcAction = function(val) {
    const display = document.getElementById('calc-display');
    if (!display) return;

    if (val === 'C') {
        calcExpression = "";
        display.textContent = "0";
    } else {
        // Simple logic for parentheses and functions
        if (calcExpression === "0") calcExpression = "";
        calcExpression += val;
        display.textContent = calcExpression;
    }
};

window.calculateResult = function() {
    const display = document.getElementById('calc-display');
    if (!display) return;

    try {
        // Convert display symbols to JS symbols
        let expr = calcExpression.replace(/×/g, '*').replace(/÷/g, '/');
        
        // Handle basic scientific functions (assuming Radians)
        expr = expr.replace(/sin\(/g, 'Math.sin(')
                   .replace(/cos\(/g, 'Math.cos(')
                   .replace(/tan\(/g, 'Math.tan(')
                   .replace(/sqrt\(/g, 'Math.sqrt(');
        
        // Count unclosed parentheses
        const openParen = (expr.match(/\(/g) || []).length;
        const closeParen = (expr.match(/\)/g) || []).length;
        for (let i = 0; i < openParen - closeParen; i++) {
            expr += ")";
        }

        const result = new Function('return ' + expr)();
        
        if (isNaN(result) || !isFinite(result)) {
             display.textContent = "Error";
             calcExpression = "";
        } else {
             display.textContent = Number.isInteger(result) ? result : result.toFixed(4);
             calcExpression = result.toString();
        }
    } catch (e) {
        display.textContent = "Error";
        calcExpression = "";
    }
};

// ==========================================
// SELF-KNOWLEDGE WELLNESS ENGINE - Global
// ==========================================

const PSY_TESTS = {
    anxiety: {
        title: "Уровень тревожности",
        questions: [
            "Чувствуете ли вы нервозность или беспокойство без видимой причины?",
            "Трудно ли вам расслабиться после школьного дня?",
            "Бывает ли у вас чувство, что должно произойти что-то плохое?",
            "Чувствуете ли вы легкую раздражительность в последнее время?",
            "Трудно ли вам сосредоточиться из-за тревожных мыслей?"
        ]
    },
    safety: {
        title: "Безопасность в школе",
        questions: [
            "Чувствуете ли вы себя в безопасности на переменах?",
            "Сталкивались ли вы с обидными шутками в свой адрес?",
            "Есть ли в школе взрослый, которому вы доверяете?",
            "Боитесь ли вы идти в школу из-за других учеников?",
            "Чувствуете ли вы поддержку со стороны одноклассников?"
        ]
    }
};

let currentPsyTest = null;
let currentPsyQuestionIndex = 0;
let psyScores = [];

window.startPsyTest = function(type) {
    currentPsyTest = type;
    currentPsyQuestionIndex = 0;
    psyScores = [];
    
    document.getElementById('psy-quiz-title').textContent = PSY_TESTS[type].title;
    document.getElementById('psy-quiz-view').style.display = 'flex';
    document.getElementById('psy-test-menu').style.display = 'none';
    
    renderPsyQuestion();
};

function renderPsyQuestion() {
    const test = PSY_TESTS[currentPsyTest];
    const qText = test.questions[currentPsyQuestionIndex];
    document.getElementById('psy-question-text').textContent = qText;
    
    const progress = ((currentPsyQuestionIndex + 1) / test.questions.length) * 100;
    document.getElementById('psy-quiz-progress').style.width = progress + '%';
}

window.submitPsyAnswer = function(score) {
    psyScores.push(score);
    currentPsyQuestionIndex++;
    
    if (currentPsyQuestionIndex >= PSY_TESTS[currentPsyTest].questions.length) {
        finishPsyTest();
    } else {
        renderPsyQuestion();
    }
};

async function finishPsyTest() {
    const totalScore = psyScores.reduce((a, b) => a + b, 0);
    const maxScore = psyScores.length * 3;
    const percentage = Math.round((totalScore / maxScore) * 100);
    
    // Save to Firestore
    try {
        const currentUser = window.fireAuth.currentUser;
        if (!currentUser) return;

        const userDoc = await window.fireDB.collection('users').doc(currentUser.uid).get();
        const userData = userDoc.data();

        await window.fireDB.collection('psy_results').add({
            studentId: currentUser.uid,
            studentName: userData.display_name || "Анонимный ученик",
            classCode: userData.class_code,
            testType: currentPsyTest,
            score: totalScore,
            percentage: percentage,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        alert("Спасибо! Ваши ответы отправлены учителю для анализа.");
    } catch (e) {
        console.error("Error saving psy results:", e);
    }
    
    window.closePsyQuiz();
}

window.closePsyQuiz = function() {
    document.getElementById('psy-quiz-view').style.display = 'none';
    document.getElementById('psy-test-menu').style.display = 'flex';
};

function updateWellnessStat(id, val) {
    const bar = document.getElementById(`stat-${id}-bar`);
    const text = document.getElementById(`stat-${id}-val`);
    if (bar && text) {
        bar.style.width = val + '%';
        text.textContent = val + '%';
    }
}

// --- Teacher Wellness Logic ---
window.loadTeacherWellness = async function() {
    const classCode = document.getElementById('t-wellness-class-code').value.trim();
    const body = document.getElementById('t-wellness-body');
    if (!classCode) return;

    body.innerHTML = '<tr><td colspan="5" style="padding:40px; text-align:center;">Загрузка...</td></tr>';

    try {
        const snap = await window.fireDB.collection('psy_results')
            .where('classCode', '==', classCode)
            .get();

        if (snap.empty) {
            body.innerHTML = '<tr><td colspan="5" style="padding:40px; text-align:center; color:#64748b;">Результатов пока нет.</td></tr>';
            return;
        }

        const results = [];
        snap.forEach(doc => results.push({ id: doc.id, ...doc.data() }));
        
        // In-memory sort to avoid index error
        results.sort((a, b) => {
            const ta = a.timestamp ? a.timestamp.toMillis() : 0;
            const tb = b.timestamp ? b.timestamp.toMillis() : 0;
            return tb - ta;
        });

        body.innerHTML = '';
        results.forEach(data => {
            const date = data.timestamp ? data.timestamp.toDate().toLocaleString() : 'Неизвестно';
            const testTitle = data.testType === 'anxiety' ? 'Тревожность' : 'Безопасность';
            
            let recommendation = "";
            let color = "white";
            
            if (data.testType === 'anxiety') {
                if (data.percentage > 70) { color = "#f87171"; recommendation = "🔴 Высокая тревожность. Рекомендуется беседа."; }
                else if (data.percentage > 40) { color = "#fbbf24"; recommendation = "🟡 Средний уровень. Наблюдение."; }
                else { color = "#34d399"; recommendation = "🟢 В норме."; }
            } else {
                if (data.percentage < 40) { color = "#f87171"; recommendation = "🔴 Низкий уровень безопасности. Риск буллинга."; }
                else if (data.percentage < 70) { color = "#fbbf24"; recommendation = "🟡 Средний уровень безопасности."; }
                else { color = "#34d399"; recommendation = "🟢 Чувствует себя в безопасности."; }
            }

            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
            tr.innerHTML = `
                <td style="padding:15px; font-weight:600;">${data.studentName}</td>
                <td style="padding:15px;">${testTitle}</td>
                <td style="padding:15px; color:${color}; font-weight:bold;">${data.percentage}%</td>
                <td style="padding:15px; color:#94a3b8; font-size:0.85rem;">${date}</td>
                <td style="padding:15px; font-size:0.85rem;">${recommendation}</td>
            `;
            body.appendChild(tr);
        });
    } catch (e) {
        console.error("Error loading wellness data:", e);
        body.innerHTML = '<tr><td colspan="5" style="padding:40px; text-align:center; color:#ef4444;">Ошибка при загрузке. Проверьте консоль.</td></tr>';
    }
};

// --- Workspace Wellness Integration ---
window.loadWorkspaceWellness = async function() {
    const classCodeField = document.getElementById('wellness-workspace-class-code');
    const classCode = classCodeField ? classCodeField.value.trim() : "";
    const list = document.getElementById('workspace-wellness-list');
    if (!classCode || !list) return;

    list.innerHTML = '<p style="color:#94a3b8; text-align:center;">Загрузка...</p>';

    try {
        const snap = await window.fireDB.collection('psy_results')
            .where('classCode', '==', classCode)
            .get();

        if (snap.empty) {
            list.innerHTML = '<p style="color:#64748b; text-align:center;">Нет данных для этого класса.</p>';
            return;
        }

        const results = [];
        snap.forEach(doc => results.push(doc.data()));
        results.sort((a, b) => (b.timestamp ? b.timestamp.toMillis() : 0) - (a.timestamp ? a.timestamp.toMillis() : 0));

        list.innerHTML = '';
        results.forEach(data => {
            const date = data.timestamp ? data.timestamp.toDate().toLocaleDateString() : '—';
            const testTitle = data.testType === 'anxiety' ? '🌪️ Тревожность' : '🛡️ Безопасность';
            
            let color = "#34d399";
            if (data.testType === 'anxiety' && data.percentage > 50) color = "#f87171";
            if (data.testType === 'safety' && data.percentage < 60) color = "#f87171";

            const item = document.createElement('div');
            item.style.cssText = 'background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:12px; display:flex; justify-content:space-between; align-items:center;';
            item.innerHTML = `
                <div>
                    <div style="color:white; font-weight:600; font-size:0.85rem;">${data.studentName}</div>
                    <div style="color:#64748b; font-size:0.75rem;">${testTitle} • ${date}</div>
                </div>
                <div style="color:${color}; font-weight:bold; font-size:1rem;">${data.percentage}%</div>
            `;
            list.appendChild(item);
        });
    } catch (e) {
        console.error(e);
        list.innerHTML = '<p style="color:#ef4444; text-align:center;">Ошибка загрузки.</p>';
    }
};
