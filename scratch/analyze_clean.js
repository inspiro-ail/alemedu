const fs = require('fs');

function analyzeClean(filename) {
    console.log(`\n=================== CLEAN BASELINE ANALYSIS: ${filename} ===================`);
    const content = fs.readFileSync(filename, 'utf8');
    const lines = content.split('\n');

    let teacherStart = -1;
    let studentStart = -1;

    lines.forEach((l, i) => {
        if (l.includes('id="teacher-view"')) teacherStart = i;
        if (l.includes('id="student-view"')) studentStart = i;
    });

    let depth = 0;
    let subviews = [];

    for (let i = 0; i < lines.length; i++) {
        const lineNo = i + 1;
        const line = lines[i];

        const openCount = (line.match(/<div[\s>]/gi) || []).length;
        const closeCount = (line.match(/<\/div>/gi) || []).length;

        const depthBefore = depth;
        depth += (openCount - closeCount);

        if (i >= teacherStart && i < studentStart) {
            if (line.includes('id="t-view-') || line.includes('class="teacher-subview"')) {
                const match = line.match(/id=["']([^"']+)["']/);
                const id = match ? match[1] : 'unknown';
                subviews.push({ id, lineNo, depthBefore, depthAfter: depth });
                console.log(`L${lineNo} [${id}] Depth before: ${depthBefore}, Depth after: ${depth}`);
            }
        }
    }

    const openTotal = (content.match(/<div[\s>]/gi) || []).length;
    const closeTotal = (content.match(/<\/div>/gi) || []).length;
    console.log(`Total balance: Open=${openTotal}, Close=${closeTotal}, Diff=${openTotal - closeTotal}`);
}

analyzeClean('index.html');
analyzeClean('index_kz.html');
