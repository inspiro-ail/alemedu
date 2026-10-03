const fs = require('fs');

// --- 1. UPDATE python_ml_proctor.py ---
const newPythonPredict = `def predict_proctor_state(features):
    yaw = float(features.get('yaw', 0.0))
    pitch = float(features.get('pitch', 0.0))
    ear = float(features.get('ear', 0.3))
    mar = float(features.get('mar', 0.0))
    gaze_offset = float(features.get('gaze_offset', 0.0))
    blink_var = float(features.get('blink_var', 0.0))
    face_count = int(features.get('face_count', 1))
    tension = float(features.get('tension', 0.1))

    # Deadzone filtering for natural head & eye movements (reading test text)
    eff_yaw = max(0.0, abs(yaw) - 0.22)
    eff_pitch = max(0.0, abs(pitch) - 0.22)
    eff_gaze = max(0.0, gaze_offset - 0.22)

    # Calibrated Weight Multi-Class Logits Matrix calculation
    # z_0: Focused, z_1: Cheating/Looking Away, z_2: Stressed/Anxious, z_3: Violation
    z_focused = 3.8 - (eff_yaw * 3.5) - (eff_pitch * 2.8) - (eff_gaze * 3.0)
    z_cheating = -3.2 + (eff_yaw * 7.5) + (eff_pitch * 6.5) + (eff_gaze * 7.0)
    z_stressed = -1.8 + (mar * 2.2) + (blink_var * 2.5) + (tension * 2.0)
    z_violation = 4.5 if (face_count == 0 or face_count > 1) else -4.0

    logits = [z_focused, z_cheating, z_stressed, z_violation]
    probs = softmax(logits)

    p_focused = round(probs[0], 4)
    p_cheating = round(probs[1], 4)
    p_stressed = round(probs[2], 4)
    p_violation = round(probs[3], 4)

    # Calculate Face Stress Index (0-100%)
    raw_stress = (probs[2] * 40.0) + (mar * 25.0) + (blink_var * 20.0)
    stress_index = min(100, max(0, int(round(raw_stress))))

    # Risk badge state determination with calibrated threshold (0.78)
    if p_cheating > 0.78:
        risk_badge = f"🔴 Подозрение на списывание ({int(p_cheating*100)}%)"
        status_flag = "CHEATING_ALERT"
    elif p_violation > 0.75:
        risk_badge = "⚠️ Лицо отсутствует или посторонние в кадре!"
        status_flag = "FACE_VIOLATION"
    elif p_stressed > 0.70:
        risk_badge = f"🟡 Умеренное волнение ({int(p_stressed*100)}%)"
        status_flag = "STRESS_WARNING"
    else:
        risk_badge = f"🟢 Внимателен ({int(p_focused*100)}%)"
        status_flag = "FOCUSED"

    return {
        "status": "success",
        "engine": "Python PyTorch/NumPy ML Softmax Backend (Calibrated)",
        "softmax": {
            "focused": p_focused,
            "cheating": p_cheating,
            "stressed": p_stressed,
            "violation": p_violation
        },
        "stress_index": stress_index,
        "risk_badge": risk_badge,
        "status_flag": status_flag
    }`;

let pyCode = fs.readFileSync('python_ml_proctor.py', 'utf8');
const pyStart = pyCode.indexOf('def predict_proctor_state(features):');
const pyEnd = pyCode.indexOf('if __name__ == "__main__":');
if (pyStart !== -1 && pyEnd !== -1) {
    pyCode = pyCode.substring(0, pyStart) + newPythonPredict + '\n\n' + pyCode.substring(pyEnd);
    fs.writeFileSync('python_ml_proctor.py', pyCode, 'utf8');
    console.log('Calibrated python_ml_proctor.py successfully!');
}

// --- 2. UPDATE proxy.js ---
let proxyJs = fs.readFileSync('proxy.js', 'utf8');
proxyJs = proxyJs.replace(
    `const z_focused = 2.5 - (Math.abs(yaw) * 3.2) - (Math.abs(pitch) * 2.5) - (gazeOffset * 4.0);`,
    `const eff_yaw = Math.max(0, Math.abs(yaw) - 0.22); const eff_pitch = Math.max(0, Math.abs(pitch) - 0.22); const eff_gaze = Math.max(0, gazeOffset - 0.22);\n            const z_focused = 3.8 - (eff_yaw * 3.5) - (eff_pitch * 2.8) - (eff_gaze * 3.0);\n            const z_cheating = -3.2 + (eff_yaw * 7.5) + (eff_pitch * 6.5) + (eff_gaze * 7.0);`
);
fs.writeFileSync('proxy.js', proxyJs, 'utf8');
console.log('Calibrated proxy.js embedded fallback successfully!');

// --- 3. UPDATE js/app.js AND js_kz/app.js ---
function calibrateClientJs(filePath) {
    let js = fs.readFileSync(filePath, 'utf8');

    // Update sensitivity multipliers in FaceMesh onResults
    js = js.replace(
        `yaw: yaw * 2.8,
                            pitch: pitch * 2.4,
                            roll: 0,
                            ear,
                            mar: mar * 1.5,
                            gazeOffset: gazeOffset * 1.5,`,
        `yaw: yaw * 1.2,
                            pitch: pitch * 1.0,
                            roll: 0,
                            ear,
                            mar: mar * 1.0,
                            gazeOffset: gazeOffset * 0.9,`
    );

    // Update predictState logits formula in JS client
    js = js.replace(
        `let z_focused = 2.5 - (Math.abs(features.yaw) * 3.2) - (Math.abs(features.pitch) * 2.5) - (features.gazeOffset * 4.0);
            let z_cheating = -1.0 + (Math.abs(features.yaw) * 4.5) + (Math.abs(features.pitch) * 3.8) + (features.gazeOffset * 5.0);`,
        `const eff_yaw = Math.max(0, Math.abs(features.yaw) - 0.22);
            const eff_pitch = Math.max(0, Math.abs(features.pitch) - 0.22);
            const eff_gaze = Math.max(0, features.gazeOffset - 0.22);
            let z_focused = 3.8 - (eff_yaw * 3.5) - (eff_pitch * 2.8) - (eff_gaze * 3.0);
            let z_cheating = -3.2 + (eff_yaw * 7.5) + (eff_pitch * 6.5) + (eff_gaze * 7.0);`
    );

    // Increase trigger alert threshold to 0.78
    js = js.replace(
        `if (p.cheating > 0.65) {`,
        `if (p.cheating > 0.78) {`
    );

    fs.writeFileSync(filePath, js, 'utf8');
    console.log(`Calibrated client ML engine in ${filePath}!`);
}

calibrateClientJs('js/app.js');
calibrateClientJs('js_kz/app.js');
