const fs = require('fs');
const code = fs.readFileSync('js/presentations.js', 'utf8');

try {
    require('vm').runInNewContext(code);
    console.log('✅ Syntax valid!');
} catch (err) {
    console.log('❌ Error:', err.message);
    const match = err.stack.match(/evalmachine\.<anonymous>:(\d+)/);
    if (match) {
        const lineNum = parseInt(match[1], 10);
        console.log(`Line ${lineNum}:`, code.split('\n')[lineNum - 1]);
    } else {
        console.log(err.stack);
    }
}
