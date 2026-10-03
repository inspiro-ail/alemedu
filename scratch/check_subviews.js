const fs = require('fs');

function checkSubviews(filename) {
    console.log(`\n=================== ${filename} ===================`);
    const content = fs.readFileSync(filename, 'utf8');
    const lines = content.split('\n');

    let currentDivDepth = 0;
    let mainTeacherStartLine = -1;
    let mainTeacherDepth = -1;

    lines.forEach((line, idx) => {
        const lineNo = idx + 1;

        // Check if line opens teacher view or subview
        if (line.includes('class="nav-btn"') || line.includes('data-view="t-view-')) {
            console.log(`L${lineNo} Nav Button: ${line.trim()}`);
        }
        if (line.includes('id="t-view-') || line.includes('class="teacher-subview"')) {
            console.log(`L${lineNo} SUBVIEW FOUND: depth=${currentDivDepth} | ${line.trim().slice(0, 80)}`);
        }

        const openDivs = (line.match(/<div[\s>]/gi) || []).length;
        const closeDivs = (line.match(/<\/div>/gi) || []).length;

        currentDivDepth += (openDivs - closeDivs);

        if (currentDivDepth < 0) {
            console.log(`L${lineNo} WARNING: Negative div depth! (${currentDivDepth})`);
            currentDivDepth = 0;
        }
    });
}

checkSubviews('index.html');
checkSubviews('index_kz.html');
