const fs = require('fs');
const path = require('path');

const translateKzPath = path.join(__dirname, '..', 'translate_kz.js');
const content = fs.readFileSync(translateKzPath, 'utf8');

// Extract dict array matching regex
const dictMatch = content.match(/const dict = \[\s*([\s\S]*?)\n\];/);
if (!dictMatch) {
    console.error("Could not find dict in translate_kz.js");
    process.exit(1);
}

// Evaluate or parse dict
const dictCode = `[${dictMatch[1]}]`;
try {
    const dict = eval(dictCode);
    console.log(`Extracted ${dict.length} translation pairs.`);
    fs.writeFileSync(path.join(__dirname, 'extracted_dict.json'), JSON.stringify(dict, null, 2), 'utf8');
} catch (e) {
    console.error("Eval error:", e.message);
}
