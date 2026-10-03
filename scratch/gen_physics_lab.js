const fs = require('fs');
const path = require('path');

const html = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AlemEdu — Физическая лаборатория</title>
    <meta name="description" content="Интерактивная физическая лаборатория AlemEdu. 8 симуляций: баллистика, маятник, электричество, оптика, волны, газ, сила Лоренца, эффект Доплера.">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #060913;
            --surface: rgba(15,23,42,0.75);
            --glass: rgba(255,255,255,0.04);
            --border: rgba(255,255,255,0.08);
            --primary: #6366f1;
            --secondary: #8b5cf6;
            --text: #f1f5f9;
            --muted: #64748b;
            --font: 'Outfit','Inter',sans-serif;
        }
        *{box-sizing:border-box;margin:0;padding:0;font-family:var(--font)}
        html,body{background:var(--bg);color:var(--text);min-height:100vh;overflow-x:hidden}
        body::before{content:'';position:fixed;inset:0;z-index:-1;background:radial-gradient(ellipse 80% 60% at 10% 0%,rgba(99,102,241,.18) 0%,transparent 60%),radial-gradient(ellipse 60% 50% at 90% 80%,rgba(139,92,246,.14) 0%,transparent 55%)}

        /* NAV */
        .topnav{display:flex;align-items:center;justify-content:space-between;padding:14px 28px;background:rgba(6,9,19,.9);backdrop-filter:blur(20px);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:100}
        .logo{font-size:1.2rem;font-weight:800;color:#fff;text-decoration:none;display:flex;align-items:center;gap:8px}
        .logo span{color:var(--primary)}
        .badge{background:linear-gradient(135deg,var(--primary),var(--secondary));padding:4px 12px;border-radius:20px;font-size:.75rem;font-weight:700;color:#fff}
        .back-btn{display:flex;align-items:center;gap:6px;background:var(--glass);border:1px solid var(--border);color:var(--muted);padding:8px 16px;border-radius:10px;text-decoration:none;font-size:.85rem;font-weight:600;transition:all .2s}
        .back-btn:hover{color:#fff;border-color:var(--primary);background:rgba(99,102,241,.1)}

        /* HERO */
        .hero{text-align:center;padding:48px 20px 28px}
        .eyebrow{display:inline-flex;align-items:center;gap:8px;background:rgba(99,102,241,.12);border:1px solid rgba(99,102,241,.25);color:#a5b4fc;padding:6px 16px;border-radius:30px;font-size:.78rem;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-bottom:18px}
        .hero h1{font-size:clamp(2rem,5vw,3.2rem);font-weight:900;line-height:1.1;margin-bottom:12px}
        .hero h1 .gr{background:linear-gradient(135deg,#818cf8,#a78bfa,#38bdf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
        .hero p{color:var(--muted);max-width:580px;margin:0 auto;line-height:1.6}

        /* GRID */
        .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:20px;padding:16px 24px 48px;max-width:1440px;margin:0 auto}

        /* CARD */
        .card{background:var(--surface);border:1px solid var(--border);border-radius:20px;overflow:hidden;display:flex;flex-direction:column;transition:transform .25s,box-shadow .25s,border-color .25s}
        .card:hover{transform:translateY(-4px);box-shadow:0 20px 40px rgba(0,0,0,.4),0 0 0 1px rgba(99,102,241,.2);border-color:rgba(99,102,241,.3)}
        .span2{grid-column:span 2}

        .ch{display:flex;align-items:center;justify-content:space-between;padding:16px 20px 10px}
        .ct-row{display:flex;align-items:center;gap:10px}
        .ci{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0}
        .ct{font-size:1rem;font-weight:700;color:#fff}
        .cs{font-size:.74rem;color:var(--muted);margin-top:1px}
        .tag{font-size:.68rem;font-weight:700;padding:3px 10px;border-radius:20px;letter-spacing:.5px;text-transform:uppercase;flex-shrink:0}

        /* Canvas */
        .cw{margin:0 16px;border-radius:14px;overflow:hidden;background:#050810;border:1px solid rgba(255,255,255,.06)}
        .cw canvas{display:block;width:100%}

        /* Controls */
        .ctrl{padding:14px 16px 14px;display:flex;flex-direction:column;gap:10px}
        .crow{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
        .cg{flex:1;min-width:110px}
        .cl{font-size:.71rem;color:var(--muted);font-weight:600;display:flex;justify-content:space-between;margin-bottom:4px}
        input[type=range]{width:100%;height:4px;border-radius:4px;-webkit-appearance:none;cursor:pointer;background:rgba(255,255,255,.12)}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:15px;height:15px;border-radius:50%;cursor:pointer;box-shadow:0 0 0 3px rgba(0,0,0,.5)}
        select.sel{background:rgba(12,20,40,.9);color:#fff;border:1px solid var(--border);border-radius:8px;padding:6px 10px;font-size:.78rem;outline:none;cursor:pointer;flex:1}
        .btn{padding:7px 16px;border:none;border-radius:10px;font-size:.81rem;font-weight:700;cursor:pointer;color:#fff;transition:transform .15s;flex-shrink:0}
        .btn:hover{transform:scale(1.05)} .btn:active{transform:scale(.97)}

        .rrow{display:flex;justify-content:space-around;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:10px;padding:8px;flex-wrap:wrap;gap:4px}
        .rv{text-align:center}
        .rl{font-size:.67rem;color:var(--muted)}
        .rn{font-size:.88rem;font-weight:700;margin-top:2px}

        /* Colors */
        .cv{color:#a78bfa} .csk{color:#38bdf8} .cam{color:#fbbf24} .cgr{color:#34d399} .crs{color:#fb7185} .cor{color:#fb923c} .cpk{color:#f472b6}
        .bv{background:rgba(139,92,246,.15)} .bsk{background:rgba(56,189,248,.12)} .bgr{background:rgba(16,185,129,.12)} .bam{background:rgba(245,158,11,.12)} .brs{background:rgba(244,63,94,.12)} .bpk{background:rgba(244,114,182,.12)} .bor{background:rgba(251,146,60,.12)}
        .tm{background:rgba(139,92,246,.2);color:#c4b5fd;border:1px solid rgba(139,92,246,.3)}
        .te{background:rgba(56,189,248,.2);color:#7dd3fc;border:1px solid rgba(56,189,248,.3)}
        .to{background:rgba(244,63,94,.2);color:#fda4af;border:1px solid rgba(244,63,94,.3)}
        .tt{background:rgba(245,158,11,.2);color:#fde68a;border:1px solid rgba(245,158,11,.3)}
        .tw{background:rgba(16,185,129,.2);color:#6ee7b7;border:1px solid rgba(16,185,129,.3)}
        .tmg{background:rgba(244,114,182,.2);color:#f9a8d4;border:1px solid rgba(244,114,182,.3)}

        /* Info */
        .ir{padding:0 16px 14px}
        .itog{width:100%;text-align:left;background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:8px;color:var(--muted);font-size:.74rem;padding:7px 12px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;transition:all .2s}
        .itog:hover{color:#fff;border-color:rgba(255,255,255,.15)}
        .ibody{display:none;padding:10px 12px;font-size:.77rem;color:#cbd5e1;line-height:1.6;border:1px solid var(--border);border-top:none;border-radius:0 0 8px 8px;background:rgba(255,255,255,.02)}
        .ibody b{color:#a5b4fc}

        footer{text-align:center;padding:20px;color:var(--muted);font-size:.78rem;border-top:1px solid var(--border)}
        footer a{color:var(--primary);text-decoration:none}

        @media(max-width:700px){.span2{grid-column:span 1}.grid{padding:12px 12px 36px;gap:14px}}
    </style>
</head>
<body>
<nav class="topnav">
    <a href="index.html" class="logo">✨ AlemEdu <span>Physics</span></a>
    <div class="badge">⚗️ Виртуальная Лаборатория</div>
    <a href="index.html" class="back-btn">← Назад на платформу</a>
</nav>

<section class="hero">
    <div class="eyebrow">⚛️ HTML5 Canvas · Интерактивные симуляции</div>
    <h1>Физическая <span class="gr">Лаборатория</span></h1>
    <p>8 интерактивных экспериментов с реальными физическими вычислениями. Изменяйте параметры — наблюдайте законы природы.</p>
</section>

<main class="grid">

<!-- 1. PROJECTILE -->
<div class="card">
    <div class="ch"><div class="ct-row"><div class="ci bv">🚀</div><div><div class="ct">Баллистика</div><div class="cs">Движение тела, брошенного под углом</div></div></div><div class="tag tm">Механика</div></div>
    <div class="cw"><canvas id="c-proj" height="220"></canvas></div>
    <div class="ctrl">
        <div class="crow">
            <div class="cg"><div class="cl">Угол α <span id="p-av" class="cv">45°</span></div><input type="range" id="p-a" min="5" max="85" value="45" style="accent-color:#a78bfa"></div>
            <div class="cg"><div class="cl">Скорость v₀ <span id="p-sv" class="cv">50 м/с</span></div><input type="range" id="p-s" min="10" max="100" value="50" style="accent-color:#a78bfa"></div>
        </div>
        <div class="crow">
            <select id="p-g" class="sel"><option value="9.8">🌍 Земля (9.8)</option><option value="1.6">🌙 Луна (1.6)</option><option value="3.7">🔴 Марс (3.7)</option><option value="24.8">♃ Юпитер (24.8)</option></select>
            <label style="display:flex;align-items:center;gap:5px;font-size:.74rem;color:var(--muted);cursor:pointer"><input type="checkbox" id="p-air" style="accent-color:#a78bfa"> Воздух</label>
            <button id="p-btn" class="btn" style="background:linear-gradient(135deg,#8b5cf6,#6366f1)">🚀 Пуск</button>
        </div>
        <div class="rrow">
            <div class="rv"><div class="rl">Дальность</div><div class="rn csk" id="p-rd">—</div></div>
            <div class="rv"><div class="rl">Макс. высота</div><div class="rn cgr" id="p-rh">—</div></div>
            <div class="rv"><div class="rl">Время полёта</div><div class="rn cam" id="p-rt">—</div></div>
        </div>
    </div>
    <div class="ir"><button class="itog" onclick="ti(this)">📐 Формулы <span>▾</span></button><div class="ibody"><b>x(t)</b>=v₀cos(α)t &nbsp;|&nbsp; <b>y(t)</b>=v₀sin(α)t−gt²/2<br><b>R</b>=v₀²sin(2α)/g &nbsp;|&nbsp; <b>H</b>=v₀²sin²(α)/2g<br>Максимальная дальность при α=45°. На Луне — дальность в 6× больше!</div></div>
</div>

<!-- 2. PENDULUM -->
<div class="card">
    <div class="ch"><div class="ct-row"><div class="ci bpk">⏱️</div><div><div class="ct">Математический маятник</div><div class="cs">Период T=2π√(L/g)</div></div></div><div class="tag tm">Механика</div></div>
    <div class="cw"><canvas id="c-pend" height="220"></canvas></div>
    <div class="ctrl">
        <div class="crow">
            <div class="cg"><div class="cl">Длина L <span id="pd-lv" class="cpk">1.5 м</span></div><input type="range" id="pd-l" min="0.3" max="3" step="0.1" value="1.5" style="accent-color:#f472b6"></div>
            <div class="cg"><div class="cl">Отклонение <span id="pd-av" class="cpk">30°</span></div><input type="range" id="pd-a" min="5" max="70" value="30" style="accent-color:#f472b6"></div>
        </div>
        <div class="crow">
            <div class="cg"><div class="cl">Затухание <span id="pd-dv" class="cpk">0%</span></div><input type="range" id="pd-d" min="0" max="5" step="0.1" value="0" style="accent-color:#f472b6"></div>
            <select id="pd-g" class="sel"><option value="9.8">🌍 Земля</option><option value="1.6">🌙 Луна</option><option value="3.7">🔴 Марс</option></select>
        </div>
        <div class="rrow">
            <div class="rv"><div class="rl">Период T</div><div class="rn cpk" id="pd-rp">—</div></div>
            <div class="rv"><div class="rl">Частота f</div><div class="rn cv" id="pd-rf">—</div></div>
            <div class="rv"><div class="rl">ω рад/с</div><div class="rn csk" id="pd-ro">—</div></div>
        </div>
    </div>
    <div class="ir"><button class="itog" onclick="ti(this)">📐 Формулы <span>▾</span></button><div class="ibody"><b>T=2π√(L/g)</b> — период не зависит от массы (малые углы).<br>Галилей открыл это, наблюдая за люстрой в Пизе в 1583 г.<br>На маятниковых часах основан точный ход времени.</div></div>
</div>

<!-- 3. ELECTRIC CIRCUIT -->
<div class="card">
    <div class="ch"><div class="ct-row"><div class="ci bsk">⚡</div><div><div class="ct">Закон Ома · Электрическая цепь</div><div class="cs">Ток, напряжение, мощность, электроны</div></div></div><div class="tag te">Электричество</div></div>
    <div class="cw"><canvas id="c-elec" height="220"></canvas></div>
    <div class="ctrl">
        <div class="crow">
            <div class="cg"><div class="cl">ЭДС U <span id="el-uv" class="csk">12 В</span></div><input type="range" id="el-u" min="1" max="48" value="12" style="accent-color:#38bdf8"></div>
            <div class="cg"><div class="cl">Сопр. R <span id="el-rv" class="cam">20 Ом</span></div><input type="range" id="el-r" min="1" max="120" value="20" style="accent-color:#fbbf24"></div>
        </div>
        <div class="crow">
            <div class="cg"><div class="cl">Внутр. r <span id="el-rv2" class="crs">0 Ом</span></div><input type="range" id="el-ri" min="0" max="20" value="0" style="accent-color:#fb7185"></div>
            <select id="el-t" class="sel"><option value="s">Последовательно</option><option value="p">Параллельно</option></select>
        </div>
        <div class="rrow">
            <div class="rv"><div class="rl">Ток I (А)</div><div class="rn csk" id="el-ri2">—</div></div>
            <div class="rv"><div class="rl">Мощность P (Вт)</div><div class="rn cam" id="el-rp">—</div></div>
            <div class="rv"><div class="rl">Напряж. на R</div><div class="rn cgr" id="el-rur">—</div></div>
        </div>
        <div id="el-st" style="padding:6px 12px;border-radius:8px;font-size:.74rem;background:rgba(56,189,248,.08);border:1px solid rgba(56,189,248,.2);color:#7dd3fc"></div>
    </div>
    <div class="ir"><button class="itog" onclick="ti(this)">📐 Формулы <span>▾</span></button><div class="ibody"><b>Закон Ома:</b> I=U/(R+r) &nbsp;|&nbsp; <b>P</b>=UI=I²R<br><b>Послед:</b> R=R₁+R₂ &nbsp;|&nbsp; <b>Парал:</b> 1/R=1/R₁+1/R₂<br>Скорость электронов на анимации = скорость тока.</div></div>
</div>

<!-- 4. OPTICS -->
<div class="card">
    <div class="ch"><div class="ct-row"><div class="ci brs">🔍</div><div><div class="ct">Оптика · Закон Снеллиуса</div><div class="cs">Преломление света, дисперсия, ПВО</div></div></div><div class="tag to">Оптика</div></div>
    <div class="cw"><canvas id="c-opt" height="220"></canvas></div>
    <div class="ctrl">
        <div class="crow">
            <div class="cg"><div class="cl">Угол падения θ₁ <span id="op-av" class="crs">35°</span></div><input type="range" id="op-a" min="1" max="89" value="35" style="accent-color:#fb7185"></div>
            <div class="cg"><div class="cl">n₁ первая среда <span id="op-n1v" class="csk">1.00</span></div><input type="range" id="op-n1" min="100" max="250" value="100" style="accent-color:#38bdf8"></div>
        </div>
        <div class="crow">
            <select id="op-m" class="sel"><option value="1.33">💧 Вода n=1.33</option><option value="1.52">🔮 Стекло n=1.52</option><option value="2.42">💎 Алмаз n=2.42</option><option value="1.0003">💨 Воздух n≈1</option><option value="1.77">🔷 Тяж. стекло n=1.77</option></select>
            <label style="display:flex;align-items:center;gap:5px;font-size:.74rem;color:var(--muted);cursor:pointer"><input type="checkbox" id="op-d" style="accent-color:#fb7185"> Дисперсия</label>
        </div>
        <div class="rrow">
            <div class="rv"><div class="rl">θ₂ преломл.</div><div class="rn cgr" id="op-rt2">—</div></div>
            <div class="rv"><div class="rl">Скорость в среде</div><div class="rn csk" id="op-rv">—</div></div>
            <div class="rv"><div class="rl">Полн. отражение</div><div class="rn crs" id="op-rtir">—</div></div>
        </div>
    </div>
    <div class="ir"><button class="itog" onclick="ti(this)">📐 Формулы <span>▾</span></button><div class="ibody"><b>n₁sin(θ₁)=n₂sin(θ₂)</b> — закон Снеллиуса.<br><b>ПВО</b> при sinθ₁ > n₂/n₁ (критический угол).<br>Оптоволокно и блеск бриллианта — применения ПВО.</div></div>
</div>

<!-- 5. WAVE (wide) -->
<div class="card span2">
    <div class="ch"><div class="ct-row"><div class="ci bgr">〰️</div><div><div class="ct">Интерференция волн</div><div class="cs">Принцип суперпозиции · Биения · Конструктивная и деструктивная интерференция</div></div></div><div class="tag tw">Волны</div></div>
    <div class="cw"><canvas id="c-wave" height="250"></canvas></div>
    <div class="ctrl">
        <div class="crow">
            <div class="cg"><div class="cl">f₁ <span id="w-f1v" class="cgr">2.0 Гц</span></div><input type="range" id="w-f1" min="5" max="50" value="20" style="accent-color:#34d399"></div>
            <div class="cg"><div class="cl">f₂ <span id="w-f2v" class="csk">2.0 Гц</span></div><input type="range" id="w-f2" min="5" max="50" value="20" style="accent-color:#38bdf8"></div>
            <div class="cg"><div class="cl">Δφ <span id="w-phv" class="cam">0°</span></div><input type="range" id="w-ph" min="0" max="360" value="0" style="accent-color:#fbbf24"></div>
            <div class="cg"><div class="cl">Амплитуда A <span id="w-av" class="cv">1.0</span></div><input type="range" id="w-am" min="1" max="10" value="5" style="accent-color:#a78bfa"></div>
        </div>
        <div class="rrow">
            <div class="rv"><div class="rl">Тип интерференции</div><div class="rn" id="w-rtype" style="color:#fff">—</div></div>
            <div class="rv"><div class="rl">Δf биений</div><div class="rn cam" id="w-rbeat">—</div></div>
            <div class="rv"><div class="rl">Период биений</div><div class="rn cgr" id="w-rbt">—</div></div>
        </div>
    </div>
    <div class="ir"><button class="itog" onclick="ti(this)">📐 Формулы <span>▾</span></button><div class="ibody"><b>y = A·sin(2πf₁t) + A·sin(2πf₂t+Δφ)</b><br>Δφ=0 → <b>конструктивная</b> (усиление) | Δφ=180° → <b>деструктивная</b> (гашение).<br><b>Биения:</b> пульсация с частотой |f₁−f₂|.</div></div>
</div>

<!-- 6. GAS -->
<div class="card">
    <div class="ch"><div class="ct-row"><div class="ci bam">🔥</div><div><div class="ct">Идеальный газ · МКТ</div><div class="cs">Молекулярная динамика, Броуновское движение</div></div></div><div class="tag tt">Термодинамика</div></div>
    <div class="cw"><canvas id="c-gas" height="220"></canvas></div>
    <div class="ctrl">
        <div class="crow">
            <div class="cg"><div class="cl">Температура T <span id="g-tv" class="cam">300 K</span></div><input type="range" id="g-t" min="50" max="1000" value="300" style="accent-color:#fbbf24"></div>
            <div class="cg"><div class="cl">Объём V <span id="g-vv" class="csk">100%</span></div><input type="range" id="g-v" min="30" max="100" value="100" style="accent-color:#38bdf8"></div>
        </div>
        <div class="rrow">
            <div class="rv"><div class="rl">Давление P</div><div class="rn crs" id="g-rp">—</div></div>
            <div class="rv"><div class="rl">Ср. скорость</div><div class="rn cam" id="g-rv">—</div></div>
            <div class="rv"><div class="rl">Закон</div><div class="rn cgr" id="g-rl">—</div></div>
        </div>
    </div>
    <div class="ir"><button class="itog" onclick="ti(this)">📐 Формулы <span>▾</span></button><div class="ibody"><b>PV=nRT</b> | <b>Бойль:</b> P₁V₁=P₂V₂ (T=const) | <b>Гей-Люссак:</b> P/T=const (V=const)<br><b>⟨Eₖ⟩=3/2·kT</b> — средняя кинетическая энергия молекулы.<br>Рост T → молекулы быстрее → давление растёт.</div></div>
</div>

<!-- 7. LORENTZ -->
<div class="card">
    <div class="ch"><div class="ct-row"><div class="ci bpk">🧲</div><div><div class="ct">Сила Лоренца</div><div class="cs">Движение заряда в магнитном поле</div></div></div><div class="tag tmg">Магнетизм</div></div>
    <div class="cw"><canvas id="c-lor" height="220"></canvas></div>
    <div class="ctrl">
        <div class="crow">
            <div class="cg"><div class="cl">Индукция B <span id="lo-bv" class="cpk">1.0 Тл</span></div><input type="range" id="lo-b" min="1" max="50" value="10" style="accent-color:#f472b6"></div>
            <div class="cg"><div class="cl">Скорость v <span id="lo-vv" class="csk">100 м/с</span></div><input type="range" id="lo-v" min="10" max="200" value="100" style="accent-color:#38bdf8"></div>
        </div>
        <div class="crow">
            <select id="lo-q" class="sel"><option value="1">⊕ Протон (+e)</option><option value="-1">⊖ Электрон (−e)</option><option value="2">⊕⊕ Альфа (+2e)</option></select>
            <select id="lo-d" class="sel"><option value="1">B из плоскости ⊙</option><option value="-1">B в плоскость ⊗</option></select>
        </div>
        <div class="rrow">
            <div class="rv"><div class="rl">Радиус r (усл.)</div><div class="rn cpk" id="lo-rr">—</div></div>
            <div class="rv"><div class="rl">Сила F (фН)</div><div class="rn cv" id="lo-rf">—</div></div>
            <div class="rv"><div class="rl">Период T (нс)</div><div class="rn csk" id="lo-rt">—</div></div>
        </div>
    </div>
    <div class="ir"><button class="itog" onclick="ti(this)">📐 Формулы <span>▾</span></button><div class="ibody"><b>F=qvB</b> &nbsp;|&nbsp; <b>r=mv/(|q|B)</b><br>Заряд движется по окружности в однородном поле.<br>Циклотроны, МРТ-сканеры работают на этом принципе.</div></div>
</div>

<!-- 8. DOPPLER -->
<div class="card">
    <div class="ch"><div class="ct-row"><div class="ci bor">📡</div><div><div class="ct">Эффект Доплера</div><div class="cs">Изменение частоты при движении источника</div></div></div><div class="tag tw">Волны</div></div>
    <div class="cw"><canvas id="c-dop" height="220"></canvas></div>
    <div class="ctrl">
        <div class="crow">
            <div class="cg"><div class="cl">Скорость vs <span id="do-vsv" class="cor">50 м/с</span></div><input type="range" id="do-vs" min="0" max="380" value="50" style="accent-color:#fb923c"></div>
            <div class="cg"><div class="cl">Частота f₀ <span id="do-f0v" class="cam">440 Гц</span></div><input type="range" id="do-f0" min="100" max="1000" value="440" style="accent-color:#fbbf24"></div>
        </div>
        <div class="rrow">
            <div class="rv"><div class="rl">f спереди (Гц)</div><div class="rn cgr" id="do-rfa">—</div></div>
            <div class="rv"><div class="rl">f сзади (Гц)</div><div class="rn crs" id="do-rfb">—</div></div>
            <div class="rv"><div class="rl">Число Маха</div><div class="rn cor" id="do-rm">—</div></div>
        </div>
    </div>
    <div class="ir"><button class="itog" onclick="ti(this)">📐 Формулы <span>▾</span></button><div class="ibody"><b>f=f₀·c/(c±vs)</b>, c=343 м/с звука.<br>Приближение → выше тон | Удаление → ниже тон.<br><b>M=vs/c.</b> При M≥1 — ударная волна (звуковой «бум»).</div></div>
</div>

</main>

<footer>AlemEdu Физическая Лаборатория · HTML5 Canvas · <a href="index.html">← Вернуться на платформу</a></footer>

<script>
/* ─── UTILS ─── */
function ti(b){const d=b.nextElementSibling,o=d.style.display==='block';d.style.display=o?'none':'block';b.querySelector('span').textContent=o?'▾':'▴'}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function mc(id,h){
    const c=document.getElementById(id);
    const dpr=window.devicePixelRatio||1;
    const r=c.parentElement.getBoundingClientRect();
    const w=Math.max(r.width||500,280);
    c.width=w*dpr; c.height=h*dpr;
    c.style.width=w+'px'; c.style.height=h+'px';
    const ctx=c.getContext('2d');
    ctx.scale(dpr,dpr);
    return{ctx,w,h};
}

/* ─── 1. PROJECTILE ─── */
(function(){
    let raf,trail=[],ap=0;
    const pA=document.getElementById('p-a'),pS=document.getElementById('p-s'),pG=document.getElementById('p-g'),pAir=document.getElementById('p-air'),pBtn=document.getElementById('p-btn');
    const vA=document.getElementById('p-av'),vS=document.getElementById('p-sv');
    pA.oninput=()=>{vA.textContent=pA.value+'°';draw(false)};
    pS.oninput=()=>{vS.textContent=pS.value+' м/с';draw(false)};
    pG.onchange=()=>draw(false);
    pBtn.onclick=launch;
    function params(){return{a:+pA.value*Math.PI/180,v0:+pS.value,g:+pG.value,air:pAir.checked}}
    function path(p){
        const{a,v0,g,air}=p,vx=v0*Math.cos(a),k=air?.01:0;
        let vy=v0*Math.sin(a),x=0,y=0,t=0,pts=[{x,y}];
        for(let i=0;i<6000;i++){
            const sp=Math.sqrt(vx*vx+vy*vy);
            vy+=(-g-k*vy*sp)*.02; x+=vx*.02; y+=vy*.02; t+=.02;
            pts.push({x,y}); if(y<0)break;
        }
        return{pts,t,H:Math.max(...pts.map(p=>p.y)),R:x};
    }
    function draw(anim){
        const{ctx,w,h}=mc('c-proj',220);
        const p=params(),{pts,t,H,R}=path(p);
        document.getElementById('p-rd').textContent=R.toFixed(1)+' м';
        document.getElementById('p-rh').textContent=H.toFixed(1)+' м';
        document.getElementById('p-rt').textContent=t.toFixed(2)+' с';
        const ml=30,mr=10,mt=14,mb=28,pw=w-ml-mr,ph=h-mt-mb;
        const sx=(x)=>ml+(x/(R||1))*pw, sy=(y)=>mt+ph-(y/(H||1))*ph;
        const bg=ctx.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#08101e');bg.addColorStop(1,'#050810');
        ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
        ctx.strokeStyle='rgba(255,255,255,.04)';ctx.lineWidth=1;
        for(let i=0;i<=4;i++){ctx.beginPath();ctx.moveTo(ml,mt+ph/4*i);ctx.lineTo(w-mr,mt+ph/4*i);ctx.stroke()}
        ctx.strokeStyle='rgba(52,211,153,.35)';ctx.lineWidth=1.5;ctx.setLineDash([6,4]);
        ctx.beginPath();ctx.moveTo(ml,mt+ph);ctx.lineTo(w-mr,mt+ph);ctx.stroke();ctx.setLineDash([]);
        ctx.beginPath();ctx.strokeStyle='rgba(167,139,250,.15)';ctx.lineWidth=1.5;
        pts.forEach((p,i)=>i===0?ctx.moveTo(sx(p.x),sy(p.y)):ctx.lineTo(sx(p.x),sy(p.y)));ctx.stroke();
        if(anim&&trail.length>1){
            const gt=ctx.createLinearGradient(0,0,w,0);gt.addColorStop(0,'rgba(167,139,250,0)');gt.addColorStop(1,'rgba(167,139,250,.9)');
            ctx.strokeStyle=gt;ctx.lineWidth=2.5;ctx.beginPath();
            trail.forEach((p,i)=>i===0?ctx.moveTo(sx(p.x),sy(p.y)):ctx.lineTo(sx(p.x),sy(p.y)));ctx.stroke();
            const l=trail[trail.length-1],bx=sx(l.x),by=sy(l.y);
            const gb=ctx.createRadialGradient(bx,by,0,bx,by,10);gb.addColorStop(0,'#fff');gb.addColorStop(.4,'#a78bfa');gb.addColorStop(1,'transparent');
            ctx.fillStyle=gb;ctx.beginPath();ctx.arc(bx,by,10,0,Math.PI*2);ctx.fill();
        }else if(!anim){ctx.fillStyle='#a78bfa';ctx.beginPath();ctx.arc(sx(0),sy(0),7,0,Math.PI*2);ctx.fill()}
        ctx.fillStyle='rgba(148,163,184,.7)';ctx.font='11px Inter';ctx.textAlign='center';
        ctx.fillText(R.toFixed(0)+' м',w-mr-14,mt+ph+18);ctx.textAlign='left';ctx.fillText(H.toFixed(0)+' м',ml+4,mt+10);
    }
    function launch(){
        if(raf)cancelAnimationFrame(raf);trail=[];ap=0;
        const{pts}=path(params());
        function step(){ap=Math.min(ap+1,pts.length-1);trail=pts.slice(Math.max(0,ap-60),ap+1);draw(true);if(ap<pts.length-1)raf=requestAnimationFrame(step)}
        raf=requestAnimationFrame(step);
    }
    draw(false);
})();

/* ─── 2. PENDULUM ─── */
(function(){
    let raf,theta,omega=0,t=0;
    const slL=document.getElementById('pd-l'),slA=document.getElementById('pd-a'),slD=document.getElementById('pd-d'),selG=document.getElementById('pd-g');
    const vL=document.getElementById('pd-lv'),vA=document.getElementById('pd-av'),vD=document.getElementById('pd-dv');
    slL.oninput=()=>{vL.textContent=parseFloat(slL.value).toFixed(1)+' м';rst()};
    slA.oninput=()=>{vA.textContent=slA.value+'°';rst()};
    slD.oninput=()=>{vD.textContent=parseFloat(slD.value).toFixed(1)+'%'};
    selG.onchange=rst;
    function rst(){omega=0;t=0;theta=+slA.value*Math.PI/180;upR()}
    function upR(){const L=+slL.value,g=+selG.value,T=2*Math.PI*Math.sqrt(L/g);document.getElementById('pd-rp').textContent=T.toFixed(3)+' с';document.getElementById('pd-rf').textContent=(1/T).toFixed(3)+' Гц';document.getElementById('pd-ro').textContent=(2*Math.PI/T).toFixed(3)+' рад/с'}
    function draw(){
        const{ctx,w,h}=mc('c-pend',220);
        const L=+slL.value,g=+selG.value,d=+slD.value*.001;
        omega+=-(g/L)*Math.sin(theta)*.016-d*omega;theta+=omega*.016;
        const bg=ctx.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#08101e');bg.addColorStop(1,'#050810');
        ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
        const cx=w/2,cy=26,sc=Math.min((h-48)/L,90);
        const bx=cx+sc*L*Math.sin(theta),by=cy+sc*L*Math.cos(theta);
        const th0=+slA.value*Math.PI/180;
        ctx.strokeStyle='rgba(244,114,182,.1)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(cx,cy,sc*L,Math.PI/2-th0,Math.PI/2+th0);ctx.stroke();
        const sg=ctx.createLinearGradient(cx,cy,bx,by);sg.addColorStop(0,'rgba(148,163,184,.5)');sg.addColorStop(1,'rgba(244,114,182,.8)');
        ctx.strokeStyle=sg;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(bx,by);ctx.stroke();
        ctx.fillStyle='#64748b';ctx.beginPath();ctx.arc(cx,cy,4,0,Math.PI*2);ctx.fill();
        const glow=ctx.createRadialGradient(bx,by,0,bx,by,22);glow.addColorStop(0,'rgba(244,114,182,.35)');glow.addColorStop(1,'transparent');
        ctx.fillStyle=glow;ctx.beginPath();ctx.arc(bx,by,22,0,Math.PI*2);ctx.fill();
        const gb=ctx.createRadialGradient(bx-4,by-4,0,bx,by,13);gb.addColorStop(0,'#fff');gb.addColorStop(.3,'#f472b6');gb.addColorStop(1,'#be185d');
        ctx.fillStyle=gb;ctx.beginPath();ctx.arc(bx,by,13,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='rgba(244,114,182,.8)';ctx.font='11px Inter';ctx.fillText((theta*180/Math.PI).toFixed(1)+'°',cx+6,cy+13);
        upR();raf=requestAnimationFrame(draw);
    }
    rst();draw();
})();

/* ─── 3. ELECTRIC ─── */
(function(){
    let raf,eT=0;
    const slU=document.getElementById('el-u'),slR=document.getElementById('el-r'),slRi=document.getElementById('el-ri'),selT=document.getElementById('el-t');
    const vU=document.getElementById('el-uv'),vR=document.getElementById('el-rv'),vRi=document.getElementById('el-rv2');
    [slU,slR,slRi,selT].forEach(e=>e.oninput=upd);
    function upd(){vU.textContent=slU.value+' В';vR.textContent=slR.value+' Ом';vRi.textContent=slRi.value+' Ом'}
    function draw(){
        const{ctx,w,h}=mc('c-elec',220);
        const U=+slU.value,R=+slR.value,ri=+slRi.value;
        const Reff=selT.value==='p'?R/2:2*R;
        const I=U/(Reff+ri),P=U*I,Ur=I*R;
        document.getElementById('el-ri2').textContent=I.toFixed(3)+' А';
        document.getElementById('el-rp').textContent=P.toFixed(2)+' Вт';
        document.getElementById('el-rur').textContent=Ur.toFixed(2)+' В';
        const st=document.getElementById('el-st');
        if(I>2){st.style.cssText='padding:6px 12px;border-radius:8px;font-size:.74rem;background:rgba(244,63,94,.1);border:1px solid rgba(244,63,94,.3);color:#fda4af';st.textContent='🔴 Высокий ток — опасность перегрева!'}
        else if(I>.5){st.style.cssText='padding:6px 12px;border-radius:8px;font-size:.74rem;background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.3);color:#fde68a';st.textContent='🟡 Нормальный ток. Лампочка горит!'}
        else{st.style.cssText='padding:6px 12px;border-radius:8px;font-size:.74rem;background:rgba(56,189,248,.08);border:1px solid rgba(56,189,248,.2);color:#7dd3fc';st.textContent='💡 Слабый ток. Увеличьте U или уменьшите R.'}
        const bg=ctx.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#08101e');bg.addColorStop(1,'#050810');
        ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
        const m=34,cw=w-2*m,ch=h-2*m;
        const wc=\`rgba(56,189,248,\${.25+clamp(I*.12,0,.6)})\`;
        ctx.strokeStyle=wc;ctx.lineWidth=2.5;ctx.shadowColor='#38bdf8';ctx.shadowBlur=clamp(I*4,0,20);
        [[m,m,w-m,m],[w-m,m,w-m,h-m],[m,h-m,w-m,h-m],[m,m,m,h-m]].forEach(([x1,y1,x2,y2])=>{ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()});
        ctx.shadowBlur=0;
        // Battery (left)
        const bx=m,by=h/2;
        [-10,-4,4,10].forEach((dy,i)=>{ctx.strokeStyle='#38bdf8';ctx.lineWidth=i%2===0?2.5:1;ctx.beginPath();ctx.moveTo(bx-(i%2===0?10:6),by+dy);ctx.lineTo(bx+(i%2===0?10:6),by+dy);ctx.stroke()});
        ctx.fillStyle='#38bdf8';ctx.font='bold 12px Inter';ctx.fillText('+',bx-22,by-16);ctx.fillText('−',bx-22,by+22);
        ctx.fillStyle='rgba(148,163,184,.6)';ctx.font='10px Inter';ctx.fillText(U+'В',bx-20,h-m+16);
        // Resistor (right)
        const rx=w-m,ry=h/2;
        ctx.strokeStyle='#fbbf24';ctx.lineWidth=2;ctx.beginPath();
        const rh=38,steps=8;ctx.moveTo(rx,ry-rh/2);
        for(let i=0;i<steps;i++){const yy=ry-rh/2+(rh/steps)*i;ctx.lineTo(rx+(i%2===0?8:-8),yy+rh/steps/2);ctx.lineTo(rx,yy+rh/steps)}ctx.stroke();
        ctx.fillStyle='#fbbf24';ctx.font='10px Inter';ctx.fillText(R+'Ω',rx+12,ry+4);
        // Electrons
        eT+=clamp(I*.013,.002,.045);
        const ne=Math.min(14,Math.max(2,Math.round(I*6)));
        const perim=2*(cw+ch);
        for(let i=0;i<ne;i++){
            let d=((eT+i/ne)%1)*perim,ex,ey;
            if(d<cw){ex=m+d;ey=m}else if(d<cw+ch){ex=w-m;ey=m+(d-cw)}else if(d<2*cw+ch){ex=w-m-(d-cw-ch);ey=h-m}else{ex=m;ey=h-m-(d-2*cw-ch)}
            ctx.fillStyle='#38bdf8';ctx.shadowColor='#38bdf8';ctx.shadowBlur=8;
            ctx.beginPath();ctx.arc(ex,ey,3,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
        }
        // Ammeter
        const ax=w/2,ay=m;
        ctx.fillStyle='rgba(12,20,40,.9)';ctx.beginPath();ctx.arc(ax,ay,16,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='#38bdf8';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(ax,ay,16,0,Math.PI*2);ctx.stroke();
        ctx.fillStyle='#38bdf8';ctx.font='bold 9px Inter';ctx.textAlign='center';ctx.fillText('A',ax,ay-2);ctx.fillText(I.toFixed(2),ax,ay+9);ctx.textAlign='left';
        raf=requestAnimationFrame(draw);
    }
    upd();draw();
})();

/* ─── 4. OPTICS ─── */
(function(){
    const slA=document.getElementById('op-a'),slN1=document.getElementById('op-n1'),selM=document.getElementById('op-m'),chkD=document.getElementById('op-d');
    const vA=document.getElementById('op-av'),vN1=document.getElementById('op-n1v');
    [slA,slN1,selM,chkD].forEach(e=>e.oninput=draw);
    function draw(){
        vA.textContent=slA.value+'°';const n1v=+slN1.value/100;vN1.textContent=n1v.toFixed(2);
        const{ctx,w,h}=mc('c-opt',220);
        const t1=+slA.value*Math.PI/180,n1=n1v,n2=+selM.value,disp=chkD.checked;
        const s2=n1/n2*Math.sin(t1),tir=s2>1,t2=tir?null:Math.asin(s2);
        document.getElementById('op-rt2').textContent=tir?'ПВО!':(t2*180/Math.PI).toFixed(2)+'°';
        document.getElementById('op-rv').textContent=((3e5/n2)).toFixed(0)+' км/с';
        document.getElementById('op-rtir').textContent=tir?'⚠️ Да':'Нет';
        const bg=ctx.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#05070f');bg.addColorStop(1,'#050810');
        ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
        const my=h/2+10,cx=w/2;
        ctx.fillStyle='rgba(16,185,129,.07)';ctx.fillRect(0,my,w,h-my);
        ctx.strokeStyle='rgba(16,185,129,.35)';ctx.lineWidth=1.5;ctx.setLineDash([8,5]);
        ctx.beginPath();ctx.moveTo(0,my);ctx.lineTo(w,my);ctx.stroke();ctx.setLineDash([]);
        ctx.strokeStyle='rgba(255,255,255,.18)';ctx.lineWidth=1;ctx.setLineDash([4,4]);
        ctx.beginPath();ctx.moveTo(cx,0);ctx.lineTo(cx,h);ctx.stroke();ctx.setLineDash([]);
        const ray=(t,fy,ty,dir,col,a)=>{
            ctx.strokeStyle=col;ctx.lineWidth=2.5;ctx.globalAlpha=a;ctx.shadowColor=col;ctx.shadowBlur=12;
            ctx.beginPath();ctx.moveTo(cx,fy);ctx.lineTo(cx+Math.sin(t)*dir*(h*.44),ty);ctx.stroke();
            ctx.shadowBlur=0;ctx.globalAlpha=1;
        };
        if(!disp){
            ray(t1,0,my,-1,'#ef4444',.9);ray(t1,my,0,1,'#fbbf24',.45);
            if(!tir)ray(t2,my,h,-1,'#34d399',.9);
            else{ray(t1,my,0,1,'#f43f5e',.9);ctx.fillStyle='#f43f5e';ctx.font='bold 11px Inter';ctx.textAlign='center';ctx.fillText('⚠️ Полное внутреннее отражение',cx,my+28);ctx.textAlign='left'}
        }else{
            const cols=['#ef4444','#f97316','#fbbf24','#4ade80','#38bdf8','#6366f1','#a855f7'];
            const n2s=[n2*.97,n2*.98,n2*.99,n2,n2*1.01,n2*1.02,n2*1.03];
            cols.forEach((c,i)=>{const st=n1/n2s[i]*Math.sin(t1);if(st<=1){const t=Math.asin(st);ray(t,my,h,-1,c,.75)}});
            ray(t1,0,my,-1,'#fff',.9);
        }
        ctx.fillStyle='rgba(148,163,184,.8)';ctx.font='11px Inter';
        ctx.fillText('n₁='+n1.toFixed(2),8,my-10);ctx.fillText('n₂='+n2,8,my+20);
        if(!tir){
            ctx.strokeStyle='rgba(239,68,68,.45)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(cx,my,38,-Math.PI/2-t1,-Math.PI/2);ctx.stroke();
            ctx.strokeStyle='rgba(52,211,153,.45)';ctx.beginPath();ctx.arc(cx,my,38,Math.PI/2,Math.PI/2+t2);ctx.stroke();
            ctx.fillStyle='#ef4444';ctx.font='10px Inter';ctx.fillText('θ₁='+slA.value+'°',cx-70,my-12);
            ctx.fillStyle='#34d399';ctx.fillText('θ₂='+(t2*180/Math.PI).toFixed(1)+'°',cx+8,my+28);
        }
    }
    draw();
})();

/* ─── 5. WAVE ─── */
(function(){
    let raf,t=0;
    const slF1=document.getElementById('w-f1'),slF2=document.getElementById('w-f2'),slPh=document.getElementById('w-ph'),slAm=document.getElementById('w-am');
    const vF1=document.getElementById('w-f1v'),vF2=document.getElementById('w-f2v'),vPh=document.getElementById('w-phv'),vAm=document.getElementById('w-av');
    [slF1,slF2,slPh,slAm].forEach(e=>e.oninput=upd);
    function upd(){vF1.textContent=(+slF1.value/10).toFixed(1)+' Гц';vF2.textContent=(+slF2.value/10).toFixed(1)+' Гц';vPh.textContent=slPh.value+'°';vAm.textContent=(+slAm.value/5).toFixed(1)}
    function draw(){
        const{ctx,w,h}=mc('c-wave',250);
        const f1=+slF1.value/10,f2=+slF2.value/10,ph=+slPh.value*Math.PI/180,A=+slAm.value/5;
        const df=Math.abs(f1-f2),bt=df>0?1/df:Infinity,phD=+slPh.value;
        let tp='↔️ Частичная';if(phD===0)tp='✅ Конструктивная';else if(phD===180)tp='❌ Деструктивная';
        document.getElementById('w-rtype').textContent=tp;
        document.getElementById('w-rbeat').textContent=df.toFixed(2)+' Гц';
        document.getElementById('w-rbt').textContent=isFinite(bt)?bt.toFixed(2)+' с':'∞ (f₁=f₂)';
        ctx.fillStyle='#050810';ctx.fillRect(0,0,w,h);
        ctx.strokeStyle='rgba(255,255,255,.04)';ctx.lineWidth=1;
        [h*.22,h*.5,h*.78].forEach(y=>{ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()});
        const rows=[
            {lbl:'Волна 1 (f₁='+f1.toFixed(1)+' Гц)',fn:x=>A*Math.sin(2*Math.PI*f1*(t+x/w*2)),col:'#34d399',y0:h*.22},
            {lbl:'Волна 2 (f₂='+f2.toFixed(1)+' Гц)',fn:x=>A*Math.sin(2*Math.PI*f2*(t+x/w*2)+ph),col:'#38bdf8',y0:h*.5},
            {lbl:'Суперпозиция',fn:x=>A*Math.sin(2*Math.PI*f1*(t+x/w*2))+A*Math.sin(2*Math.PI*f2*(t+x/w*2)+ph),col:'#a78bfa',y0:h*.78}
        ];
        rows.forEach(r=>{
            const amp=h*.16/Math.max(A,1);
            ctx.beginPath();
            for(let x=0;x<w;x++){const y=r.y0-r.fn(x)*amp/1.5;x===0?ctx.moveTo(x,y):ctx.lineTo(x,y)}
            ctx.strokeStyle=r.col;ctx.lineWidth=2;ctx.shadowColor=r.col;ctx.shadowBlur=8;ctx.stroke();ctx.shadowBlur=0;
            ctx.fillStyle='rgba(12,20,40,.75)';ctx.fillRect(4,r.y0-h*.18,w*.52,16);
            ctx.fillStyle=r.col;ctx.font='bold 10px Inter';ctx.fillText(r.lbl,8,r.y0-h*.18+11);
        });
        t+=.008;raf=requestAnimationFrame(draw);
    }
    upd();draw();
})();

/* ─── 6. GAS ─── */
(function(){
    let raf;
    const mols=[];const N=38,COLS=['#fbbf24','#f87171','#60a5fa','#34d399','#a78bfa'];
    const slT=document.getElementById('g-t'),slV=document.getElementById('g-v');
    const vT=document.getElementById('g-tv'),vV=document.getElementById('g-vv');
    for(let i=0;i<N;i++)mols.push({x:Math.random(),y:Math.random(),vx:(Math.random()-.5),vy:(Math.random()-.5),r:4+Math.random()*2,c:COLS[i%COLS.length]});
    slT.oninput=()=>{vT.textContent=slT.value+' K';upSp()};
    slV.oninput=()=>{vV.textContent=slV.value+'%'};
    function upSp(){const sf=Math.sqrt(+slT.value/300);mols.forEach(m=>{const a=Math.random()*Math.PI*2;m.vx=Math.cos(a)*sf;m.vy=Math.sin(a)*sf})}
    function draw(){
        const{ctx,w,h}=mc('c-gas',220);
        const T=+slT.value,vp=+slV.value/100,pad=20,bw=(w-pad*2)*vp,bh=h-pad*2,bx=pad+(w-pad*2-bw)/2,by=pad;
        const sf=Math.sqrt(T/300)*.55;
        ctx.fillStyle='#050810';ctx.fillRect(0,0,w,h);
        const hg=ctx.createLinearGradient(0,h,0,0);hg.addColorStop(0,\`rgba(\${Math.round(T/4)},\${Math.max(0,80-T/12)},20,.12)\`);hg.addColorStop(1,'transparent');
        ctx.fillStyle=hg;ctx.fillRect(0,0,w,h);
        ctx.strokeStyle='rgba(56,189,248,.5)';ctx.lineWidth=2;ctx.strokeRect(bx,by,bw,bh);
        mols.forEach(m=>{
            m.x+=m.vx*sf*.003;m.y+=m.vy*sf*.003;
            const ax=bx+m.x*bw,ay=by+m.y*bh;
            if(ax-m.r<bx){m.vx=Math.abs(m.vx);m.x=m.r/bw}if(ax+m.r>bx+bw){m.vx=-Math.abs(m.vx);m.x=1-m.r/bw}
            if(ay-m.r<by){m.vy=Math.abs(m.vy);m.y=m.r/bh}if(ay+m.r>by+bh){m.vy=-Math.abs(m.vy);m.y=1-m.r/bh}
            const gm=ctx.createRadialGradient(ax-1,ay-1,0,ax,ay,m.r+2);gm.addColorStop(0,'#fff');gm.addColorStop(.4,m.c);gm.addColorStop(1,'transparent');
            ctx.fillStyle=gm;ctx.beginPath();ctx.arc(ax,ay,m.r+2,0,Math.PI*2);ctx.fill();
        });
        const P=T/(vp*300);
        document.getElementById('g-rp').textContent=P.toFixed(2)+' атм';
        document.getElementById('g-rv').textContent=(sf*490).toFixed(0)+' м/с';
        document.getElementById('g-rl').textContent=vp<1?(T<305&&T>295?'Бойль-Мариотт':'Адиаб.'):'Гей-Люссак';
        const tc=T>600?'#f87171':T>300?'#fbbf24':'#60a5fa';
        ctx.fillStyle=tc;ctx.font='bold 12px Inter';ctx.textAlign='right';ctx.fillText('T='+T+' K',w-10,22);ctx.textAlign='left';
        raf=requestAnimationFrame(draw);
    }
    upSp();draw();vT.textContent=slT.value+' K';vV.textContent=slV.value+'%';
})();

/* ─── 7. LORENTZ ─── */
(function(){
    let raf,t=0;
    const slB=document.getElementById('lo-b'),slV=document.getElementById('lo-v'),selQ=document.getElementById('lo-q'),selD=document.getElementById('lo-d');
    const vB=document.getElementById('lo-bv'),vV=document.getElementById('lo-vv');
    [slB,slV,selQ,selD].forEach(e=>e.oninput=()=>t=0);
    function draw(){
        vB.textContent=(+slB.value/10).toFixed(1)+' Тл';vV.textContent=slV.value+' м/с';
        const{ctx,w,h}=mc('c-lor',220);
        const B=+slB.value/10,v=+slV.value,q=+selQ.value,d=+selD.value;
        const m=1.67e-27,qe=1.6e-19,R=clamp(v/(Math.abs(q)*B*2),18,110);
        const F=Math.abs(q)*qe*v*B,T=2*Math.PI*m/(Math.abs(q)*qe*B);
        document.getElementById('lo-rr').textContent=R.toFixed(1)+' (усл.)';
        document.getElementById('lo-rf').textContent=(F/1e-15).toFixed(2)+' фН';
        document.getElementById('lo-rt').textContent=(T*1e8).toFixed(2);
        ctx.fillStyle='#050810';ctx.fillRect(0,0,w,h);
        ctx.fillStyle=d>0?'rgba(244,114,182,.4)':'rgba(99,102,241,.4)';ctx.font='13px serif';ctx.textAlign='center';
        const step=28;for(let xi=step/2;xi<w;xi+=step)for(let yi=step/2;yi<h;yi+=step)ctx.fillText(d>0?'·':'×',xi,yi+5);ctx.textAlign='left';
        ctx.fillStyle=d>0?'#f9a8d4':'#a5b4fc';ctx.font='bold 11px Inter';ctx.fillText('B='+(B).toFixed(1)+' Тл '+(d>0?'⊙':'⊗'),10,h-10);
        t+=.025;const cx=w/2,cy=h/2,sp=q*d;
        const tLen=80;
        for(let i=0;i<tLen;i++){const tt=t-i*.025,tx=cx+R*Math.cos(sp*tt),ty=cy+R*Math.sin(sp*tt),a=1-i/tLen;ctx.fillStyle=q>0?\`rgba(251,146,60,\${a})\`:\`rgba(96,165,250,\${a})\`;ctx.beginPath();ctx.arc(tx,ty,2.5,0,Math.PI*2);ctx.fill()}
        ctx.strokeStyle=q>0?'rgba(251,146,60,.2)':'rgba(96,165,250,.2)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(cx,cy,R,0,Math.PI*2);ctx.stroke();
        const px=cx+R*Math.cos(sp*t),py=cy+R*Math.sin(sp*t),pc=q>0?'#fb923c':'#60a5fa';
        const pg=ctx.createRadialGradient(px,py,0,px,py,13);pg.addColorStop(0,'#fff');pg.addColorStop(.4,pc);pg.addColorStop(1,'transparent');
        ctx.fillStyle=pg;ctx.beginPath();ctx.arc(px,py,13,0,Math.PI*2);ctx.fill();
        const vxa=-R*Math.sin(sp*t)*sp*.7,vya=R*Math.cos(sp*t)*sp*.7;
        ctx.strokeStyle='#34d399';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+vxa,py+vya);ctx.stroke();
        ctx.fillStyle='#fff';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillText(q>0?'+':'−',px,py+4);ctx.textAlign='left';
        raf=requestAnimationFrame(draw);
    }
    draw();
})();

/* ─── 8. DOPPLER ─── */
(function(){
    let raf,t=0;
    const slVs=document.getElementById('do-vs'),slF0=document.getElementById('do-f0');
    const vVs=document.getElementById('do-vsv'),vF0=document.getElementById('do-f0v');
    [slVs,slF0].forEach(e=>e.oninput=upd);
    function upd(){vVs.textContent=slVs.value+' м/с';vF0.textContent=slF0.value+' Гц'}
    const csnd=343;
    function draw(){
        const{ctx,w,h}=mc('c-dop',220);
        const vs=+slVs.value,f0=+slF0.value,mc2=vs/csnd;
        const fa=vs<csnd?f0*csnd/(csnd-vs):Infinity,fb=f0*csnd/(csnd+vs);
        document.getElementById('do-rfa').textContent=isFinite(fa)?fa.toFixed(1):'∞ (ударн. волна)';
        document.getElementById('do-rfb').textContent=fb.toFixed(1);
        document.getElementById('do-rm').textContent=mc2.toFixed(3);
        ctx.fillStyle='#050810';ctx.fillRect(0,0,w,h);
        const sx=(w*.25+t*vs*.28)%(w*.6)+w*.15,sy=h/2;
        t+=.016;
        const wn=10;
        for(let i=0;i<wn;i++){
            const age=(t*2-i*.5)%(wn*.5),ex=sx-(vs>0?vs*age*.09:0),rad=age*csnd*.09,a=Math.max(0,1-age/(wn*.5))*.6;
            if(rad<0)continue;
            ctx.strokeStyle=\`rgba(56,189,248,\${a})\`;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(ex,sy,rad,0,Math.PI*2);ctx.stroke();
        }
        if(mc2>=1){
            const ca=Math.asin(clamp(1/mc2,0,1)),cl=200;
            ctx.strokeStyle='rgba(244,63,94,.7)';ctx.lineWidth=2;ctx.beginPath();
            ctx.moveTo(sx,sy);ctx.lineTo(sx-cl*Math.cos(ca),sy-cl*Math.sin(ca));
            ctx.moveTo(sx,sy);ctx.lineTo(sx-cl*Math.cos(ca),sy+cl*Math.sin(ca));ctx.stroke();
            ctx.fillStyle='rgba(244,63,94,.85)';ctx.font='bold 11px Inter';ctx.textAlign='center';
            ctx.fillText('💥 Ударная волна! M='+mc2.toFixed(2),sx-cl*.5,sy-cl*Math.sin(ca)*.5-10);ctx.textAlign='left';
        }
        const sg=ctx.createRadialGradient(sx,sy,0,sx,sy,16);sg.addColorStop(0,'#fff');sg.addColorStop(.4,'#fb923c');sg.addColorStop(1,'transparent');
        ctx.fillStyle=sg;ctx.beginPath();ctx.arc(sx,sy,16,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#fff';ctx.font='14px sans-serif';ctx.textAlign='center';ctx.fillText('🚗',sx,sy+6);ctx.textAlign='left';
        ctx.fillStyle='#34d399';ctx.font='bold 11px Inter';ctx.fillText('▶ '+( isFinite(fa)?fa.toFixed(0)+'Гц':'∞!'),sx+22,sy-8);
        ctx.fillStyle='#fb7185';ctx.fillText('◀ '+fb.toFixed(0)+' Гц',8,sy+26);
        const mc2c=mc2<.5?'#34d399':mc2<1?'#fbbf24':'#f43f5e';
        ctx.fillStyle=mc2c;ctx.font='bold 12px Inter';ctx.textAlign='right';ctx.fillText('M='+mc2.toFixed(2),w-10,22);ctx.textAlign='left';
        raf=requestAnimationFrame(draw);
    }
    upd();draw();
})();
</script>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, '..', 'physics_lab.html'), html, 'utf8');
console.log('✅ physics_lab.html created! Size:', Buffer.byteLength(html, 'utf8'), 'bytes');
