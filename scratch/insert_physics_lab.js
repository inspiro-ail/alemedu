const fs = require('fs');

const physicsLabPanelRu = `
                            <!-- Virtual Physics Laboratory Panel (shown only for Физика) -->
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
                                        <button onclick="window.switchPhysicsTab('mechanics')" id="p-tab-mechanics" class="p-tab-btn active" style="flex:1; padding:7px 10px; border:none; border-radius:8px; background:rgba(139,92,246,0.8); color:white; font-size:0.78rem; font-weight:600; cursor:pointer; white-space:nowrap;">🚀 Механика</button>
                                        <button onclick="window.switchPhysicsTab('circuit')" id="p-tab-circuit" class="p-tab-btn" style="flex:1; padding:7px 10px; border:none; border-radius:8px; background:transparent; color:#94a3b8; font-size:0.78rem; font-weight:600; cursor:pointer; white-space:nowrap;">⚡ Цепь</button>
                                        <button onclick="window.switchPhysicsTab('optics')" id="p-tab-optics" class="p-tab-btn" style="flex:1; padding:7px 10px; border:none; border-radius:8px; background:transparent; color:#94a3b8; font-size:0.78rem; font-weight:600; cursor:pointer; white-space:nowrap;">🔍 Оптика</button>
                                        <button onclick="window.switchPhysicsTab('pendulum')" id="p-tab-pendulum" class="p-tab-btn" style="flex:1; padding:7px 10px; border:none; border-radius:8px; background:transparent; color:#94a3b8; font-size:0.78rem; font-weight:600; cursor:pointer; white-space:nowrap;">⏱️ Маятник</button>
                                        <button onclick="window.switchPhysicsTab('life')" id="p-tab-life" class="p-tab-btn" style="flex:1; padding:7px 10px; border:none; border-radius:8px; background:transparent; color:#94a3b8; font-size:0.78rem; font-weight:600; cursor:pointer; white-space:nowrap;">✈️ В жизни</button>
                                    </div>

                                    <!-- Simulation View Area -->
                                    <div style="padding:16px;">
                                        <div id="p-canvas-container" style="position:relative; width:100%; height:260px; background:#090d16; border-radius:14px; border:1px solid rgba(255,255,255,0.08); overflow:hidden;">
                                            <canvas id="physics-canvas" width="488" height="260" style="width:100%; height:100%; display:block;"></canvas>

                                            <!-- Life view overlay -->
                                            <div id="p-life-view" style="display:none; position:absolute; top:0; left:0; width:100%; height:100%; padding:14px; overflow-y:auto; box-sizing:border-box; background:#090d16;">
                                                <div style="font-size:0.82rem; color:#94a3b8; margin-bottom:10px;">
                                                    Нажмите на явление, чтобы узнать как работают законы физики в жизни:
                                                </div>
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
                                                            <b>Кинетическая энергия \( E_k = \\frac{m v^2}{2} \):</b> Энергия зависит от <i>квадрата</i> скорости. Если скорость вырастет в 2 раза, кинетическая энергия вырастет в 4 раза! Тормозам требуется совершить в 4 раза больше работы.
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

                                        <!-- Controls Panel Area -->
                                        <div id="p-controls-area" style="margin-top:12px; background:rgba(0,0,0,0.3); padding:12px; border-radius:10px; border:1px solid rgba(255,255,255,0.05);">
                                        </div>
                                    </div>
                                </div>
                            </div>`;

const physicsLabPanelKz = `
                            <!-- Virtual Physics Laboratory Panel (shown only for Физика) -->
                            <div id="physics-lab-panel" style="display:none; flex-direction:column; width:520px; flex-shrink:0; position:sticky; top:20px;">
                                <div style="background:rgba(15,23,42,0.95); border:1px solid rgba(139,92,246,0.35); border-radius:20px; overflow:hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
                                    <!-- Panel Header -->
                                    <div style="display:flex; align-items:center; justify-content:space-between; padding:14px 18px; background:rgba(139,92,246,0.12); border-bottom:1px solid rgba(139,92,246,0.25);">
                                        <div style="display:flex; align-items:center; gap:10px;">
                                            <span style="font-size:1.3rem;">⚛️</span>
                                            <div>
                                                <span style="font-weight:700; color:white; font-size:0.95rem;">Физика Виртуалды Зертханасы</span>
                                                <div style="font-size:0.72rem; color:#a78bfa;">Табиғат заңдарының интерактивті симуляциялары</div>
                                            </div>
                                        </div>
                                        <span style="font-size:0.7rem; color:#c084fc; background:rgba(139,92,246,0.2); padding:3px 8px; border-radius:20px; border:1px solid rgba(139,92,246,0.3);">HTML5 Canvas</span>
                                    </div>

                                    <!-- Simulation Tabs -->
                                    <div style="display:flex; background:rgba(0,0,0,0.4); border-bottom:1px solid rgba(255,255,255,0.08); padding:4px; gap:4px; overflow-x:auto;">
                                        <button onclick="window.switchPhysicsTab('mechanics')" id="p-tab-mechanics" class="p-tab-btn active" style="flex:1; padding:7px 10px; border:none; border-radius:8px; background:rgba(139,92,246,0.8); color:white; font-size:0.78rem; font-weight:600; cursor:pointer; white-space:nowrap;">🚀 Механика</button>
                                        <button onclick="window.switchPhysicsTab('circuit')" id="p-tab-circuit" class="p-tab-btn" style="flex:1; padding:7px 10px; border:none; border-radius:8px; background:transparent; color:#94a3b8; font-size:0.78rem; font-weight:600; cursor:pointer; white-space:nowrap;">⚡ Тізбек</button>
                                        <button onclick="window.switchPhysicsTab('optics')" id="p-tab-optics" class="p-tab-btn" style="flex:1; padding:7px 10px; border:none; border-radius:8px; background:transparent; color:#94a3b8; font-size:0.78rem; font-weight:600; cursor:pointer; white-space:nowrap;">🔍 Оптика</button>
                                        <button onclick="window.switchPhysicsTab('pendulum')" id="p-tab-pendulum" class="p-tab-btn" style="flex:1; padding:7px 10px; border:none; border-radius:8px; background:transparent; color:#94a3b8; font-size:0.78rem; font-weight:600; cursor:pointer; white-space:nowrap;">⏱️ Маятник</button>
                                        <button onclick="window.switchPhysicsTab('life')" id="p-tab-life" class="p-tab-btn" style="flex:1; padding:7px 10px; border:none; border-radius:8px; background:transparent; color:#94a3b8; font-size:0.78rem; font-weight:600; cursor:pointer; white-space:nowrap;">✈️ Өмірде</button>
                                    </div>

                                    <!-- Simulation View Area -->
                                    <div style="padding:16px;">
                                        <div id="p-canvas-container" style="position:relative; width:100%; height:260px; background:#090d16; border-radius:14px; border:1px solid rgba(255,255,255,0.08); overflow:hidden;">
                                            <canvas id="physics-canvas" width="488" height="260" style="width:100%; height:100%; display:block;"></canvas>

                                            <!-- Life view overlay -->
                                            <div id="p-life-view" style="display:none; position:absolute; top:0; left:0; width:100%; height:100%; padding:14px; overflow-y:auto; box-sizing:border-box; background:#090d16;">
                                                <div style="font-size:0.82rem; color:#94a3b8; margin-bottom:10px;">
                                                    Құбылысты таңдап, физика заңдарының өмірде қалай жұмыс істейтінін көріңіз:
                                                </div>
                                                <div style="display:flex; flex-direction:column; gap:8px;">
                                                    <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:10px; cursor:pointer;" onclick="this.querySelector('.life-desc').style.display = this.querySelector('.life-desc').style.display === 'none' ? 'block' : 'none'">
                                                        <div style="font-weight:700; color:#38bdf8; font-size:0.85rem;">✈️ Неліктен ұшақ ауада ұшады?</div>
                                                        <div class="life-desc" style="display:none; margin-top:6px; font-size:0.78rem; color:#cbd5e1; line-height:1.4;">
                                                            <b>Бернулли заңы:</b> Қанаттың пішіні жоғарғы жағындағы ауаны төменгі жағына қарағанда жылдамырақ қозғалуға мәжбүр етеді. Жылдамдық жоғары жерде қысым төмен болады. Пайда болған қысым айырмашылығы (көтергіш күш) ауыр ұшақты жоғары итерейді!
                                                        </div>
                                                    </div>
                                                    <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:10px; cursor:pointer;" onclick="this.querySelector('.life-desc').style.display = this.querySelector('.life-desc').style.display === 'none' ? 'block' : 'none'">
                                                        <div style="font-weight:700; color:#fbbf24; font-size:0.85rem;">🚗 Жылдамдық екі есе өскендегі тежеу жолы</div>
                                                        <div class="life-desc" style="display:none; margin-top:6px; font-size:0.78rem; color:#cbd5e1; line-height:1.4;">
                                                            <b>Кинетикалық энергия \( E_k = \\frac{m v^2}{2} \):</b> Энергия жылдамдықтың <i>квадратына</i> тәуелді. Жылдамдық 2 есе артса, кинетикалық энергия \( 2^2 = 4 \) есе артады! Тежегіштерге 4 есе көп жұмыс жасау қажет болады.
                                                        </div>
                                                    </div>
                                                    <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:10px; cursor:pointer;" onclick="this.querySelector('.life-desc').style.display = this.querySelector('.life-desc').style.display === 'none' ? 'block' : 'none'">
                                                        <div style="font-weight:700; color:#34d399; font-size:0.85rem;">🛡️ Қауіпсіздік белдігі не үшін қажет?</div>
                                                        <div class="life-desc" style="display:none; margin-top:6px; font-size:0.78rem; color:#cbd5e1; line-height:1.4;">
                                                            <b>Ньютонның 1-ші заңы (Инерция):</b> Денеге сыртқы күштер әсер етпесе, ол өзінің қозғалысын сақтайды. Көлік кілт тоқтағанда, сіздің денеңіз ілгері қозғала береді. Белдік ұстап тұратын сыртқы күшті береді!
                                                        </div>
                                                    </div>
                                                    <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:10px; cursor:pointer;" onclick="this.querySelector('.life-desc').style.display = this.querySelector('.life-desc').style.display === 'none' ? 'block' : 'none'">
                                                        <div style="font-weight:700; color:#c084fc; font-size:0.85rem;">📡 Микротолқынды пеш тамақты қалай жылытады?</div>
                                                        <div class="life-desc" style="display:none; margin-top:6px; font-size:0.78rem; color:#cbd5e1; line-height:1.4;">
                                                            <b>Резонанс және дипольді ығысу:</b> Тамақтағы су молекулалары 2.45 ГГц жиілігі бар электромагниттік толқындар әсерінен секундта 2.45 миллиард рет бағытын өзгертіп, үйкеліс арқылы жылу бөледі!
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Controls Panel Area -->
                                        <div id="p-controls-area" style="margin-top:12px; background:rgba(0,0,0,0.3); padding:12px; border-radius:10px; border:1px solid rgba(255,255,255,0.05);">
                                        </div>
                                    </div>
                                </div>
                            </div>`;

function insertPhysicsLab(filename, panelCode) {
    let html = fs.readFileSync(filename, 'utf8');
    if (!html.includes('id="physics-lab-panel"')) {
        html = html.replace(
            '<div id="py-compiler-panel"',
            panelCode + '\n\n                            <div id="py-compiler-panel"'
        );
        fs.writeFileSync(filename, html, 'utf8');
        console.log(`Successfully inserted physics-lab-panel into ${filename}`);
    } else {
        console.log(`physics-lab-panel already exists in ${filename}`);
    }
}

insertPhysicsLab('index.html', physicsLabPanelRu);
insertPhysicsLab('index_kz.html', physicsLabPanelKz);
