const fs = require('fs');

function traceExamsLines(filename, startLine, endLine) {
    console.log(`=== Tracing lines ${startLine} to ${endLine} in ${filename} ===`);
    const content = fs.readFileSync(filename, 'utf8');
    const lines = content.split('\n');

    let depth = 0;
    for (let i = 0; i < lines.length; i++) {
        const lineNo = i + 1;
        const line = lines[i];

        const openCount = (line.match(/<div[\s>]/gi) || []).length;
        const closeCount = (line.match(/<\/div>/gi) || []).length;

        depth += (openCount - closeCount);

        if (lineNo >= startLine && lineNo <= endLine) {
            if (openCount !== closeCount) {
                console.log(`L${lineNo} (+${openCount} -${closeCount} => depth ${depth}): ${line.trim().slice(0, 70)}`);
            }
        }
    }
}

traceExamsLines('index.html', 425, 593);
traceExamsLines('index_kz.html', 430, 600);
