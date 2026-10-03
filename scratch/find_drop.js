const fs = require('fs');

function findDepthDrop(filename, startLine, endLine) {
    console.log(`=== Tracking lines ${startLine} to ${endLine} in ${filename} ===`);
    const content = fs.readFileSync(filename, 'utf8');
    const lines = content.split('\n');

    let depth = 0;
    for (let i = 0; i < lines.length; i++) {
        const lineNo = i + 1;
        const line = lines[i];
        const openDivs = (line.match(/<div[\s>]/gi) || []).length;
        const closeDivs = (line.match(/<\/div>/gi) || []).length;

        const prevDepth = depth;
        depth += (openDivs - closeDivs);

        if (lineNo >= startLine && lineNo <= endLine) {
            console.log(`L${lineNo} (diff: +${openDivs} -${closeDivs} -> depth ${depth}): ${line.trim().slice(0, 70)}`);
        }
    }
}

findDepthDrop('index.html', 425, 605);
