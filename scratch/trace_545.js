const fs = require('fs');

function traceLines(filename, start, end) {
    const html = fs.readFileSync(filename, 'utf8');
    const lines = html.split('\n');

    let depth = 0;
    for (let i = 0; i < lines.length; i++) {
        const lineNo = i + 1;
        const line = lines[i];

        const openCount = (line.match(/<div[\s>]/gi) || []).length;
        const closeCount = (line.match(/<\/div>/gi) || []).length;

        depth += (openCount - closeCount);

        if (lineNo >= start && lineNo <= end) {
            console.log(`L${lineNo} (+${openCount} -${closeCount} => depth ${depth}): ${line.trim().slice(0, 70)}`);
        }
    }
}

traceLines('index.html', 545, 595);
