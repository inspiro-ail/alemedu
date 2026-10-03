const fs = require('fs');

function detailedTrace(filename) {
    const html = fs.readFileSync(filename, 'utf8');
    const lines = html.split('\n');
    let depth = 0;

    for (let i = 0; i < lines.length; i++) {
        const lineNo = i + 1;
        const line = lines[i];

        const openCount = (line.match(/<div[\s>]/gi) || []).length;
        const closeCount = (line.match(/<\/div>/gi) || []).length;

        depth += (openCount - closeCount);

        if (lineNo >= 105 && lineNo <= 300) {
            if (line.includes('id="t-view-') || line.includes('class="dash-body"') || line.includes('class="teacher-subview"')) {
                console.log(`L${lineNo} [depth=${depth}] *** ${line.trim().slice(0, 70)}`);
            }
        }
    }
}

detailedTrace('index.html');
