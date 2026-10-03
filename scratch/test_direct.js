async function test() {
    const url = "https://llm.alem.ai/v1/chat/completions";
    const key = "sk-zdCkdfqoNH3KKTjIkNenhQ";
    console.log("Fetching direct...");
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
            },
            body: JSON.stringify({
                model: "alemllm",
                messages: [{ role: "user", content: "Say hello in JSON format: {\"message\": \"hello\"}" }]
            })
        });
        console.log("Status:", res.status);
        const text = await res.text();
        console.log("Response:", text);
    } catch(e) {
        console.error("Error:", e);
    }
}
test();
