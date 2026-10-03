const fs = require('fs');

function traceHeader(filename) {
    console.log(`=== TRACING HEADER DIVS IN ${filename} ===`);
    const content = fs.readFileSync(filename, 'utf8');
    const lines = content.split('\n');

    let depth = 0;
    for (let i = 0; i < lines.length; i++) {
        const lineNo = i + 1;
        const line = lines[i];

        const openCount = (line.match(/<div[\s>]/gi) || []).length;
        const closeCount = (line.match(/<\/div>/gi) || []).length;

        depth += (openCount - closeCount);

        if (lineNo >= 105 && lineNo <= 205) {
            console.log(`L${lineNo} [depth=${depth}]: ${line.trim().slice(0, 75)}`);
        }
    }
}

traceHeader('index.html');
traceHeader('index_kz.html');
