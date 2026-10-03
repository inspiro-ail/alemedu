const fs = require('fs');

const fullPhysicsLabRu = `                            <!-- Virtual Physics Laboratory Panel (shown only for Физика) -->
                            <div id="physics-lab-panel" style="display:none; flex-direction:column; width:520px; flex-shrink:0; position:sticky; top:20px;">
                                <div style="background:rgba(15,23,42,0.95); border:1px solid rgba(139,92,246,0.35); border-radius:20px; overflow:hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
                                    <!-- Panel Header -->
                                    <div style="display:flex; align-items:center; justify-content:space-between; padding:14px 18px; background:rgba(139,92,246,0.12); border-bottom:1px solid rgba(139,92,246,0.25);">
                                        <div style="display:flex; align-items:center; gap:10px;">
                                            <span style="font-size:1.3rem;">⚛️</span>
                                            <div>
                                                <span style="font-weight:700; color:white; font-size:0.95rem;">Виртуальная Лаборатория Физики</span>
                                                <div style="font-size:0.72rem; color:#a78bfa;">Интерактивные симуляции законов природы</div>
                                            </div>
                                        </div>
                                        <span style="font-size:0.7rem; color:#c084fc; background:rgba(139,92,246,0.2); padding:3px 8px; border-radius:20px; border:1px solid rgba(139,92,246,0.3);">HTML5 Canvas</span>
                                    </div>

                                    <!-- Simulation Tabs -->
                                    <div style="display:flex; background:rgba(0,0,0,0.4); border-bottom:1px solid rgba(255,255,255,0.08); padding:4px; gap:4px; overflow-x:auto;">
                                        <button onclick="window.switchPhysicsTab('mechanics')" id="phys-tab-btn-mechanics" style="flex:1; padding:7px 10px; border:none; border-radius:8px; background:rgba(139,92,246,0.25); color:white; font-size:0.78rem; font-weight:700; cursor:pointer; white-space:nowrap;">🚀 Механика</button>
                                        <button onclick="window.switchPhysicsTab('electric')" id="phys-tab-btn-electric" style="flex:1; padding:7px 10px; border:none; border-radius:8px; background:transparent; color:#94a3b8; font-size:0.78rem; font-weight:600; cursor:pointer; white-space:nowrap;">⚡ Цепь</button>
                                        <button onclick="window.switchPhysicsTab('optics')" id="phys-tab-btn-optics" style="flex:1; padding:7px 10px; border:none; border-radius:8px; background:transparent; color:#94a3b8; font-size:0.78rem; font-weight:600; cursor:pointer; white-space:nowrap;">🔍 Оптика</button>
                                        <button onclick="window.switchPhysicsTab('pendulum')" id="phys-tab-btn-pendulum" style="flex:1; padding:7px 10px; border:none; border-radius:8px; background:transparent; color:#94a3b8; font-size:0.78rem; font-weight:600; cursor:pointer; white-space:nowrap;">⏱️ Маятник</button>
                                        <button onclick="window.switchPhysicsTab('life')" id="phys-tab-btn-life" style="flex:1; padding:7px 10px; border:none; border-radius:8px; background:transparent; color:#94a3b8; font-size:0.78rem; font-weight:600; cursor:pointer; white-space:nowrap;">✈️ В жизни</button>
                                    </div>

                                    <!-- Simulation View Area -->
                                    <div style="padding:16px;">
                                        <!-- 1. MECHANICS VIEW -->
                                        <div id="phys-view-mechanics" style="display:flex; flex-direction:column; gap:12px;">
                                            <div style="position:relative; width:100%; height:200px; background:#090d16; border-radius:14px; border:1px solid rgba(255,255,255,0.08); overflow:hidden;">
                                                <canvas id="phys-canvas-mechanics" width="488" height="200" style="width:100%; height:100%; display:block;"></canvas>
                                            </div>
                                            <div style="background:rgba(0,0,0,0.3); padding:12px; border-radius:12px; border:1px solid rgba(255,255,255,0.05); display:flex; flex-direction:column; gap:10px;">
                                                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                                                    <div>
                                                        <label style="font-size:0.75rem; color:#94a3b8; display:flex; justify-content:space-between;">Угол пуска: <span id="phys-mech-angle-val" style="color:#c084fc; font-weight:700;">45°</span></label>
                                                        <input type="range" id="phys-mech-angle" min="10" max="80" value="45" oninput="window.updatePhysicsMech()" style="width:100%; accent-color:#8b5cf6;">
                                                    </div>
                                                    <div>
                                                        <label style="font-size:0.75rem; color:#94a3b8; display:flex; justify-content:space-between;">Скорость: <span id="phys-mech-speed-val" style="color:#c084fc; font-weight:700;">40 м/с</span></label>
                                                        <input type="range" id="phys-mech-speed" min="10" max="80" value="40" oninput="window.updatePhysicsMech()" style="width:100%; accent-color:#8b5cf6;">
                                                    </div>
                                                </div>
                                                <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
                                                    <select id="phys-mech-gravity" onchange="window.updatePhysicsMech()" style="background:#1e293b; color:white; border:1px solid rgba(255,255,255,0.1); padding:6px 10px; border-radius:8px; font-size:0.78rem; outline:none;">
                                                        <option value="9.8">🌍 Земля (9.8 м/с²)</option>
                                                        <option value="1.6">🌙 Луна (1.6 м/с²)</option>
                                                        <option value="3.7">🔴 Марс (3.7 м/с²)</option>
                                                        <option value="24.8">⚡ Юпитер (24.8 м/с²)</option>
                                                    </select>
                                                    <label style="font-size:0.78rem; color:#cbd5e1; display:flex; align-items:center; gap:6px; cursor:pointer;">
                                                        <input type="checkbox" id="phys-mech-air" style="accent-color:#8b5cf6;"> Сопротивление воздуха
                                                    </label>
                                                    <button onclick="window.runPhysicsMechLaunch()" style="background:linear-gradient(135deg, #8b5cf6, #ec4899); color:white; border:none; padding:7px 14px; border-radius:8px; font-size:0.78rem; font-weight:700; cursor:pointer; box-shadow:0 4px 12px rgba(139,92,246,0.3);">🚀 Запуск</button>
                                                </div>
                                                <div style="display:flex; justify-content:space-around; background:rgba(255,255,255,0.03); padding:8px; border-radius:8px; font-size:0.75rem; color:#94a3b8;">
                                                    <div>Дальность: <b id="phys-mech-res-dist" style="color:#38bdf8;">0 м</b></div>
                                                    <div>Высота: <b id="phys-mech-res-height" style="color:#34d399;">0 м</b></div>
                                                    <div>Время: <b id="phys-mech-res-time" style="color:#fbbf24;">0 с</b></div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- 2. ELECTRICITY VIEW -->
                                        <div id="phys-view-electric" style="display:none; flex-direction:column; gap:12px;">
                                            <div style="position:relative; width:100%; height:200px; background:#090d16; border-radius:14px; border:1px solid rgba(255,255,255,0.08); overflow:hidden;">
                                                <canvas id="phys-canvas-electric" width="488" height="200" style="width:100%; height:100%; display:block;"></canvas>
                                            </div>
                                            <div style="background:rgba(0,0,0,0.3); padding:12px; border-radius:12px; border:1px solid rgba(255,255,255,0.05); display:flex; flex-direction:column; gap:10px;">
                                                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                                                    <div>
                                                        <label style="font-size:0.75rem; color:#94a3b8; display:flex; justify-content:space-between;">Напряжение (U): <span id="phys-elec-volt-val" style="color:#60a5fa; font-weight:700;">12 В</span></label>
                                                        <input type="range" id="phys-elec-volt" min="1" max="36" value="12" oninput="window.updatePhysicsElectric()" style="width:100%; accent-color:#3b82f6;">
                                                    </div>
                                                    <div>
                                                        <label style="font-size:0.75rem; color:#94a3b8; display:flex; justify-content:space-between;">Сопротивление (R): <span id="phys-elec-res-val" style="color:#f59e0b; font-weight:700;">20 Ом</span></label>
                                                        <input type="range" id="phys-elec-res" min="5" max="100" value="20" oninput="window.updatePhysicsElectric()" style="width:100%; accent-color:#f59e0b;">
                                                    </div>
                                                </div>
                                                <div style="display:flex; justify-content:space-around; background:rgba(255,255,255,0.03); padding:8px; border-radius:8px; font-size:0.78rem; color:#94a3b8;">
                                                    <div>Сила тока (I = U/R): <b id="phys-elec-res-current" style="color:#60a5fa;">0.60 А</b></div>
                                                    <div>Мощность (P = U·I): <b id="phys-elec-res-power" style="color:#fde047;">7.20 Вт</b></div>
                                                </div>
                                                <div id="phys-elec-status-msg" style="padding:8px 12px; border-radius:8px; font-size:0.74rem; border:1px solid rgba(59,130,246,0.2); background:rgba(59,130,246,0.1); color:#93c5fd;">
                                                    💡 Нормальный ток. Электроны замкнули цепь в реальном времени.
                                                </div>
                                            </div>
                                        </div>

                                        <!-- 3. OPTICS VIEW -->
                                        <div id="phys-view-optics" style="display:none; flex-direction:column; gap:12px;">
                                            <div style="position:relative; width:100%; height:200px; background:#090d16; border-radius:14px; border:1px solid rgba(255,255,255,0.08); overflow:hidden;">
                                                <canvas id="phys-canvas-optics" width="488" height="200" style="width:100%; height:100%; display:block;"></canvas>
                                            </div>
                                            <div style="background:rgba(0,0,0,0.3); padding:12px; border-radius:12px; border:1px solid rgba(255,255,255,0.05); display:flex; flex-direction:column; gap:10px;">
                                                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                                                    <div>
                                                        <label style="font-size:0.75rem; color:#94a3b8; display:flex; justify-content:space-between;">Угол падения (θ₁): <span id="phys-opt-angle-val" style="color:#ef4444; font-weight:700;">35°</span></label>
                                                        <input type="range" id="phys-opt-angle" min="0" max="85" value="35" oninput="window.updatePhysicsOptics()" style="width:100%; accent-color:#ef4444;">
                                                    </div>
                                                    <div>
                                                        <label style="font-size:0.75rem; color:#94a3b8; display:block; margin-bottom:4px;">Вторая среда (n₂):</label>
                                                        <select id="phys-opt-medium" onchange="window.updatePhysicsOptics()" style="width:100%; background:#1e293b; color:white; border:1px solid rgba(255,255,255,0.1); padding:6px 10px; border-radius:8px; font-size:0.78rem; outline:none;">
                                                            <option value="1.33">💧 Вода (n=1.33)</option>
                                                            <option value="1.52">🔮 Стекло (n=1.52)</option>
                                                            <option value="2.42">💎 Алмаз (n=2.42)</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div style="display:flex; justify-content:space-around; background:rgba(255,255,255,0.03); padding:8px; border-radius:8px; font-size:0.78rem; color:#94a3b8;">
                                                    <div>Угол преломления (θ₂): <b id="phys-opt-res-angle" style="color:#2dd4bf;">25.6°</b></div>
                                                    <div>Скорость света: <b id="phys-opt-res-speed" style="color:#38bdf8;">225 408 км/с</b></div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- 4. PENDULUM VIEW -->
                                        <div id="phys-view-pendulum" style="display:none; flex-direction:column; gap:12px;">
                                            <div style="position:relative; width:100%; height:200px; background:#090d16; border-radius:14px; border:1px solid rgba(255,255,255,0.08); overflow:hidden;">
                                                <canvas id="phys-canvas-pendulum" width="488" height="200" style="width:100%; height:100%; display:block;"></canvas>
                                            </div>
                                            <div style="background:rgba(0,0,0,0.3); padding:12px; border-radius:12px; border:1px solid rgba(255,255,255,0.05); display:flex; flex-direction:column; gap:10px;">
                                                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                                                    <div>
                                                        <label style="font-size:0.75rem; color:#94a3b8; display:flex; justify-content:space-between;">Длина нити (L): <span id="phys-pend-len-val" style="color:#ec4899; font-weight:700;">1.5 м</span></label>
                                                        <input type="range" id="phys-pend-len" min="0.5" max="3.0" step="0.1" value="1.5" oninput="window.updatePhysicsPendulum()" style="width:100%; accent-color:#ec4899;">
                                                    </div>
                                                    <div>
                                                        <label style="font-size:0.75rem; color:#94a3b8; display:flex; justify-content:space-between;">Начальное отклонение: <span id="phys-pend-angle-val" style="color:#ec4899; font-weight:700;">30°</span></label>
                                                        <input type="range" id="phys-pend-angle" min="5" max="60" value="30" oninput="window.updatePhysicsPendulum()" style="width:100%; accent-color:#ec4899;">
                                                    </div>
                                                </div>
                                                <div style="display:flex; justify-content:space-around; background:rgba(255,255,255,0.03); padding:8px; border-radius:8px; font-size:0.78rem; color:#94a3b8;">
                                                    <div>Период (T = 2π√(L/g)): <b id="phys-pend-res-period" style="color:#ec4899;">2.46 с</b></div>
                                                    <div>Частота (f = 1/T): <b id="phys-pend-res-freq" style="color:#a78bfa;">0.41 Гц</b></div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- 5. LIFE VIEW -->
                                        <div id="phys-view-life" style="display:none; flex-direction:column; gap:10px; max-height:340px; overflow-y:auto; padding-right:4px;">
                                            <div style="font-size:0.82rem; color:#94a3b8;">Нажмите на явление, чтобы узнать как работают законы физики в повседневной жизни:</div>
                                            <div style="display:flex; flex-direction:column; gap:8px;">
                                                <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:10px; cursor:pointer;" onclick="this.querySelector('.life-desc').style.display = this.querySelector('.life-desc').style.display === 'none' ? 'block' : 'none'">
                                                    <div style="font-weight:700; color:#38bdf8; font-size:0.85rem;">✈️ Почему самолет летает в воздухе?</div>
                                                    <div class="life-desc" style="display:none; margin-top:6px; font-size:0.78rem; color:#cbd5e1; line-height:1.4;">
                                                        <b>Закон Бернулли:</b> Форма крыла заставляет воздух над крылом двигаться быстрее, чем под ним. Там где скорость выше — давление ниже. Возникающая разница давлений (подъемная сила) толкает тяжелый самолет вверх!
                                                    </div>
                                                </div>
                                                <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:10px; cursor:pointer;" onclick="this.querySelector('.life-desc').style.display = this.querySelector('.life-desc').style.display === 'none' ? 'block' : 'none'">
                                                    <div style="font-weight:700; color:#fbbf24; font-size:0.85rem;">🚗 Тормозной путь при удвоении скорости</div>
                                                    <div class="life-desc" style="display:none; margin-top:6px; font-size:0.78rem; color:#cbd5e1; line-height:1.4;">
                                                        <b>Кинетическая энергия (E_k = m·v²/2):</b> Энергия зависит от <i>квадрата</i> скорости. Если скорость вырастет в 2 раза, кинетическая энергия вырастет в 4 раза! Тормозам требуется совершить в 4 раза больше работы.
                                                    </div>
                                                </div>
                                                <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:10px; cursor:pointer;" onclick="this.querySelector('.life-desc').style.display = this.querySelector('.life-desc').style.display === 'none' ? 'block' : 'none'">
                                                    <div style="font-weight:700; color:#34d399; font-size:0.85rem;">🛡️ Зачем нужен ремень безопасности?</div>
                                                    <div class="life-desc" style="display:none; margin-top:6px; font-size:0.78rem; color:#cbd5e1; line-height:1.4;">
                                                        <b>1-й закон Ньютона (Инерция):</b> Тело сохраняет состояние движения, пока на него не подействует внешняя сила. При резком торможении ваше тело продолжает двигаться вперед. Ремень дает внешнюю удерживающую силу!
                                                    </div>
                                                </div>
                                                <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:10px; cursor:pointer;" onclick="this.querySelector('.life-desc').style.display = this.querySelector('.life-desc').style.display === 'none' ? 'block' : 'none'">
                                                    <div style="font-weight:700; color:#c084fc; font-size:0.85rem;">📡 Как микроволновка греет еду?</div>
                                                    <div class="life-desc" style="display:none; margin-top:6px; font-size:0.78rem; color:#cbd5e1; line-height:1.4;">
                                                        <b>Резонанс и дипольный сдвиг:</b> Молекулы воды в еде под действием электромагнитных волн 2.45 ГГц вращаются 2.45 миллиарда раз в секунду, выделяя теплоту от трения!
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>`;

const fullPhysicsLabKz = fullPhysicsLabRu
    .replace('Виртуальная Лаборатория Физики', 'Физика Виртуалды Зертханасы')
    .replace('Интерактивные симуляции законов природы', 'Табиғат заңдарының интерактивті симуляциялары')
    .replace('🚀 Механика', '🚀 Механика')
    .replace('⚡ Цепь', '⚡ Тізбек')
    .replace('🔍 Оптика', '🔍 Оптика')
    .replace('⏱️ Маятник', '⏱️ Маятник')
    .replace('✈️ В жизни', '✈️ Өмірде')
    .replace('Угол пуска:', 'Ұшыру бұрышы:')
    .replace('Скорость:', 'Жылдамдық:')
    .replace('Сопротивление воздуха', 'Ауа кедергісі')
    .replace('🚀 Запуск', '🚀 Ұшыру')
    .replace('Дальность:', 'Қашықтық:')
    .replace('Высота:', 'Биіктік:')
    .replace('Время:', 'Уақыт:')
    .replace('🌍 Земля (9.8 м/с²)', '🌍 Жер (9.8 м/с²)')
    .replace('🌙 Луна (1.6 м/с²)', '🌙 Ай (1.6 м/с²)')
    .replace('🔴 Марс (3.7 м/с²)', '🔴 Марс (3.7 м/с²)')
    .replace('⚡ Юпитер (24.8 м/с²)', '⚡ Юпитер (24.8 м/с²)')
    .replace('Напряжение (U):', 'Кернеу (U):')
    .replace('Сопротивление (R):', 'Кедергі (R):')
    .replace('Сила тока (I = U/R):', 'Ток күші (I = U/R):')
    .replace('Мощность (P = U·I):', 'Қуат (P = U·I):')
    .replace('💡 Нормальный ток. Электроны замкнули цепь в реальном времени.', '💡 Қалыпты ток. Электрондар тізбекті нақты уақытта тұйықтады.')
    .replace('Угол падения (θ₁):', 'Түсу бұрышы (θ₁):')
    .replace('Вторая среда (n₂):', 'Екінші орта (n₂):')
    .replace('💧 Вода (n=1.33)', '💧 Су (n=1.33)')
    .replace('🔮 Стекло (n=1.52)', '🔮 Шыны (n=1.52)')
    .replace('💎 Алмаз (n=2.42)', '💎 Алмаз (n=2.42)')
    .replace('Угол преломления (θ₂):', 'Сыну бұрышы (θ₂):')
    .replace('Скорость света:', 'Жарық жылдамдығы:')
    .replace('Длина нити (L):', 'Жіптің ұзындығы (L):')
    .replace('Начальное отклонение:', 'Бастапқы ауытқу:')
    .replace('Период (T = 2π√(L/g)):', 'Период (T = 2π√(L/g)):')
    .replace('Частота (f = 1/T):', 'Жиілік (f = 1/T):')
    .replace('Нажмите на явление, чтобы узнать как работают законы физики в повседневной жизни:', 'Құбылысты таңдап, физика заңдарының өмірде қалай жұмыс істейтінін көріңіз:')
    .replace('✈️ Почему самолет летает в воздухе?', '✈️ Неліктен ұшақ ауада ұшады?')
    .replace('<b>Закон Бернулли:</b> Форма крыла заставляет воздух над крылом двигаться быстрее, чем под ним. Там где скорость выше — давление ниже. Возникающая разница давлений (подъемная сила) толкает тяжелый самолет вверх!', '<b>Бернулли заңы:</b> Қанаттың пішіні жоғарғы жағындағы ауаны төменгі жағына қарағанда жылдамырақ қозғалуға мәжбүр етеді. Жылдамдық жоғары жерде қысым төмен болады. Пайда болған қысым айырмашылығы (көтергіш күш) ауыр ұшақты жоғары итерейді!')
    .replace('🚗 Тормозной путь при удвоении скорости', '🚗 Жылдамдық екі есе өскендегі тежеу жолы')
    .replace('<b>Кинетическая энергия (E_k = m·v²/2):</b> Энергия зависит от <i>квадрата</i> скорости. Если скорость вырастет в 2 раза, кинетическая энергия вырастет в 4 раза! Тормозам требуется совершить в 4 раза больше работы.', '<b>Кинетикалық энергия (E_k = m·v²/2):</b> Энергия жылдамдықтың <i>квадратына</i> тәуелді. Жылдамдық 2 есе артса, кинетикалық энергия 4 есе артады! Тежегіштерге 4 есе көп жұмыс жасау қажет болады.')
    .replace('🛡️ Зачем нужен ремень безопасности?', '🛡️ Қауіпсіздік белдігі не үшін қажет?')
    .replace('<b>1-й закон Ньютона (Инерция):</b> Тело сохраняет состояние движения, пока на него не подействует внешняя сила. При резком торможении ваше тело продолжает двигаться вперед. Ремень дает внешнюю удерживающую силу!', '<b>Ньютонның 1-ші заңы (Инерция):</b> Денеге сыртқы күштер әсер етпесе, ол өзінің қозғалысын сақтайды. Көлік кілт тоқтағанда, сіздің денеңіз ілгері қозғала береді. Белдік ұстап тұратын сыртқы күшті береді!')
    .replace('📡 Как микроволновка греет еду?', '📡 Микротолқынды пеш тамақты қалай жылытады?')
    .replace('<b>Резонанс и дипольный сдвиг:</b> Молекулы воды в еде под действием электромагнитных волн 2.45 ГГц вращаются 2.45 миллиарда раз в секунду, выделяя теплоту от трения!', '<b>Резонанс және дипольді ығысу:</b> Тамақтағы су молекулалары 2.45 ГГц жиілігі бар электромагниттік толқындар әсерінен секундта 2.45 миллиард рет бағытын өзгертіп, үйкеліс арқылы жылу бөледі!');

function replacePhysicsLab(filename, replacementHtml) {
    let content = fs.readFileSync(filename, 'utf8');
    const startIdx = content.indexOf('<div id="physics-lab-panel"');
    if (startIdx === -1) {
        console.error(`physics-lab-panel not found in ${filename}`);
        return;
    }
    const endTag = '</div>';
    // We need to find the matching closing </div> for <div id="physics-lab-panel">
    let depth = 0;
    let endIdx = -1;
    for (let i = startIdx; i < content.length; i++) {
        if (content.substr(i, 4) === '<div') {
            depth++;
        } else if (content.substr(i, 6) === '</div>') {
            depth--;
            if (depth === 0) {
                endIdx = i + 6;
                break;
            }
        }
    }

    if (endIdx !== -1) {
        content = content.substring(0, startIdx) + replacementHtml + content.substring(endIdx);
        fs.writeFileSync(filename, content, 'utf8');
        console.log(`Replaced physics-lab-panel in ${filename} successfully!`);
    } else {
        console.error(`Failed to find matching closing div for physics-lab-panel in ${filename}`);
    }
}

replacePhysicsLab('index.html', fullPhysicsLabRu);
replacePhysicsLab('index_kz.html', fullPhysicsLabKz);
