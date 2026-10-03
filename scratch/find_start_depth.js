const fs = require('fs');

function findDepthFromStart(filename) {
    console.log(`=== Tracking subviews start depth in ${filename} ===`);
    const content = fs.readFileSync(filename, 'utf8');
    const lines = content.split('\n');

    let depth = 0;
    for (let i = 0; i < lines.length; i++) {
        const lineNo = i + 1;
        const line = lines[i];
        const openDivs = (line.match(/<div[\s>]/gi) || []).length;
        const closeDivs = (line.match(/<\/div>/gi) || []).length;

        depth += (openDivs - closeDivs);

        if (line.includes('id="teacher-view"') || line.includes('id="dash-body"') || line.includes('id="t-view-')) {
            console.log(`L${lineNo} [depth=${depth}]: ${line.trim().slice(0, 75)}`);
        }
    }
}

findDepthFromStart('index.html');
findDepthFromStart('index_kz.html');
