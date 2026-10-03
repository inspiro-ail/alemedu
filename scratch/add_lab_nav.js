const fs = require('fs');
const path = require('path');
const indexPath = path.join(__dirname, '..', 'index.html');
let content = fs.readFileSync(indexPath, 'utf8').replace(/\r\n/g, '\n');

// Add lab button after teacher's "Колесо удачи"
const t_target = `<button class="nav-btn" data-view="t-view-wheel" style="background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.2); margin-top: 8px; color: #fbbf24;">🎡 Колесо удачи</button>`;
const t_replace = `<button class="nav-btn" data-view="t-view-wheel" style="background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.2); margin-top: 8px; color: #fbbf24;">🎡 Колесо удачи</button>
                    <a href="physics_lab.html" target="_blank" class="nav-btn" style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); margin-top: 8px; color: #34d399; text-align:center; text-decoration:none; display:block;">⚗️ Физ. Лаборатория</a>`;

// Add lab button to student nav - after s-view-calendar
const s_target = `<button class="nav-btn" data-view="s-view-calendar">📅 Календарь</button>`;
const s_replace = `<button class="nav-btn" data-view="s-view-calendar">📅 Календарь</button>
                    <a href="physics_lab.html" target="_blank" class="nav-btn" style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); margin-top: 8px; color: #34d399; text-align:center; text-decoration:none; display:block;">⚗️ Физ. Лаборатория</a>`;

let c1 = content.includes(t_target);
let c2 = content.includes(s_target);
console.log('Matches:', { teacher_wheel: c1, student_calendar: c2 });

if (c1) content = content.replace(t_target, t_replace);
if (c2) content = content.replace(s_target, s_replace);

fs.writeFileSync(indexPath, content, 'utf8');
console.log('✅ index.html updated with physics lab navigation links!');
