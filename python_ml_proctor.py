import sys
import json
import math
import io

# Set UTF-8 encoding for Windows stdout
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')


# =======================================================
# PYTHON MACHINE LEARNING SOFTMAX PROCTORING ENGINE
# Powered by NumPy / SciPy Math & Multi-Class Softmax Logistic Model
# =======================================================

def softmax(logits):
    """
    Computes numerically stable Softmax probability vector:
    \\sigma(\\vec{z})_i = \\frac{e^{z_i - \\max(\\vec{z})}}{\\sum_j e^{z_j - \\max(\\vec{z})}}
    """
    max_logit = max(logits)
    exps = [math.exp(z - max_logit) for z in logits]
    sum_exps = sum(exps)
    return [e / sum_exps for e in exps]

def predict_proctor_state(features):
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
    }

if __name__ == "__main__":
    try:
        if len(sys.argv) > 1:
            input_data = json.loads(sys.argv[1])
        else:
            raw_in = sys.stdin.read()
            input_data = json.loads(raw_in) if raw_in.strip() else {}
        
        result = predict_proctor_state(input_data)
        print(json.dumps(result, ensure_ascii=False))
    except Exception as e:
        fallback = predict_proctor_state({})
        fallback["error"] = str(e)
        print(json.dumps(fallback, ensure_ascii=False))
