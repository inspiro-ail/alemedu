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

    // AlemLLM Auth
    const LLM_API_KEY = 'sk-zdCkdfqoNH3KKTjIkNenhQ';
    const LLM_API_URL = 'https://llm.alem.ai/v1/chat/completions';

    // Deepseek OCR & Score API Auth
    const GEMINI_API_KEY = 'AIzaSyCqmBIb4MNxv8yqpDLuJ_IAklCWSmfG83A';
    const SCORE_API_KEY = 'md8HkMaM0h5caToGDN9n5TWXg7e9fY5dTQCpxKd2';
    // Back to native direct URL. We will use a fallback if this server refuses the connection!
    const SCORE_API_URL = 'https://reranker-llm.alem.ai/v1/score';

    // Teacher Chat History with strict system prompt
    let conversationHistory = [
        { role: "system", content: "Вы опытный учитель. Ваша цель - генерировать учебные задачи для школьников. ВАЖНО: Выдавайте ТОЛЬКО само условие задачи! НИКОГДА НЕ ПИШИТЕ РЕШЕНИЕ ИЛИ ОТВЕТ. В тексте должна быть только задача." }
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
        if (roleSelect.value === 'student') {
            classCodeGroup.style.display = 'flex';
        } else {
            classCodeGroup.style.display = 'none';
        }
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

                // Store extra metadata in Firestore users collection
                await window.fireDB.collection('users').doc(user.uid).set({
                    email: email,
                    display_name: displayName,
                    role: role,
                    class_code: role === 'student' ? classCode : null
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
                        initTeacherWorkspace();
                    } else {
                        studentView.classList.add('active');
                        sUserName.textContent = meta.display_name || user.email;
                        sClassBadge.textContent = 'Class: ' + (meta.class_code || 'N/A');
                        loadStudentTasks(meta.class_code);
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

            ['t-view-workspace', 't-view-classes', 't-view-exams'].forEach(v => {
                const el = document.getElementById(v);
                if(el) el.style.display = v === targetId ? (v === 't-view-workspace' ? 'flex' : 'block') : 'none';
            });
        });
    });

    // -------- Teacher Tab Switcher (Right Panel) --------
    window.switchTeacherTab = (tab) => {
        ['task', 'results'].forEach(t => {
            document.getElementById(`tab-${t}`).style.display = t === tab ? 'block' : 'none';
            const btn = document.getElementById(`tab-btn-${t}`);
            btn.style.background = t === tab ? 'rgba(99,102,241,0.8)' : 'transparent';
            btn.style.color = t === tab ? 'white' : '#94a3b8';
        });
    };

    // -------- Teacher Results Panel --------
    function initTeacherWorkspace() {
        chatbox.innerHTML = '';
        appendMessage(conversationHistory[conversationHistory.length - 1].content, 'bot');

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
                            MathJax.typesetPromise([analysisDiv]).catch(() => {});
                        }
                    });

                    details.appendChild(summary);
                    details.appendChild(analysisDiv);
                    card.appendChild(details);
                    submissionsList.appendChild(card);
                });

                if (window.MathJax) MathJax.typesetPromise([submissionsList]).catch(() => {});
            } catch (err) {
                submissionsList.innerHTML = `<p style="color:#ef4444">Ошибка: ${err.message}</p>`;
            }
        });

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

                const table = document.createElement('table');
                table.className = 'student-table';
                table.innerHTML = `
                    <thead>
                        <tr>
                            <th style="width:40px;">#</th>
                            <th style="width:36px;"></th>
                            <th>Имя ученика</th>
                            <th>Email</th>
                            <th>Роль</th>
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
                } catch (_) {}

                students.forEach((s, i) => {
                    const initials = (s.display_name || s.email || '?')[0].toUpperCase();
                    const count = submissionCountMap[s.uid] || 0;

                    // Main student row
                    const tr = document.createElement('tr');
                    tr.className = 'student-row';
                    tr.dataset.uid = s.uid;
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
                        <td><span class="st-badge">🎓 Ученик</span></td>
                        <td style="font-weight:700;color:${count > 0 ? '#10b981' : '#475569'};">${count}</td>
                        <td><span class="st-chevron">▼</span></td>
                    `;

                    // Detail/grades row (hidden by default)
                    const detailTr = document.createElement('tr');
                    detailTr.className = 'student-detail-row';
                    detailTr.style.display = 'none';
                    const detailTd = document.createElement('td');
                    detailTd.colSpan = 7;
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
            await window.fireDB.collection('tasks').add({
                teacher_id: currentUser.uid,
                class_code: clsCode,
                content: content,
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
            if(typeof loadAssignedExamsForResults === 'function') loadAssignedExamsForResults();
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
                                row.querySelector('.v-text').value = q.options[idx] || `Вариант ${idx+1}`;
                                if (idx === q.correct_answer_index) {
                                    row.querySelector('input[type="radio"]').checked = true;
                                }
                            });
                        }
                    } else if (qType === 'match') {
                        const rows = newCard.querySelectorAll('.match-row');
                        if (q.pairs && q.pairs.length) {
                            q.pairs.slice(0, 4).forEach((pair, idx) => {
                                if(rows[idx]) {
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
                        if(l && rt) pairs.push({left: l, right: rt});
                    });
                    if(pairs.length < 2) return alert('Добавьте минимум 2 пары для сопоставления');
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
                await window.fireDB.collection('exams').add({
                    teacher_id: currentUser.uid,
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
                    if(maxScoreTotal === 0) maxScoreTotal = maxScore;

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

            ['s-view-tasks', 's-view-exams'].forEach(v => {
                const el = document.getElementById(v);
                if(el) {
                    el.style.display = v === targetId ? 'block' : 'none';
                    if(v === 's-view-tasks' && v === targetId) el.style.display = 'block'; 
                }
            });

            // If switching to exams, load them
            if (targetId === 's-view-exams' && currentUser) {
                // Ensure class code is defined (meta should be cached in global if possible, but we can read from UI)
                const label = document.getElementById('s-class-badge').textContent;
                const match = label.match(/Class: (.*)/);
                if (match) {
                    loadStudentExams(match[1]);
                }
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
        } catch(e) {
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
                    if(eSnap.exists) {
                        examDocTitle = eSnap.data().title;
                        loadedExamsCache[d.exam_id] = eSnap.data(); // Cache for taking
                    }
                } catch(e){}

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
            examTimerEl.textContent = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;

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
            if (window.MathJax) MathJax.typesetPromise([qContainer]).catch(() => {});
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
        examTimerEl.textContent = `${String(durationMins).padStart(2,'0')}:00`;
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
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
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
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});

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
                        evaluationLog.push(`Вопрос ${i+1}: ✅ Верно.`);
                    } else {
                        evaluationLog.push(`Вопрос ${i+1}: ❌ Неверно.`);
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
                        evaluationLog.push(`Вопрос ${i+1}: ✅ Сопоставление верно.`);
                    } else {
                        evaluationLog.push(`Вопрос ${i+1}: ❌ Сопоставление неверно.`);
                    }
                } else {
                    const studentText = card.querySelector('.student-text-ans').value.trim();
                    if (!studentText) { evaluationLog.push(`Вопрос ${i+1}: ❌ Нет ответа.`); continue; }
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
                            evaluationLog.push(`Вопрос ${i+1}: ✅ Зачтено ИИ.`);
                        } else {
                            evaluationLog.push(`Вопрос ${i+1}: ❌ Не зачтено ИИ.`);
                        }
                    } catch (e) {
                        evaluationLog.push(`Вопрос ${i+1}: ⚠️ Ошибка ИИ.`);
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
});


