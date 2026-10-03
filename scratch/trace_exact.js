const fs = require('fs');

function checkSubviewsExact(filename) {
    console.log(`\n=================== EXACT SUBVIEW BALANCE: ${filename} ===================`);
    const content = fs.readFileSync(filename, 'utf8');
    const lines = content.split('\n');

    let currentSubview = null;
    let subviewStartLine = 0;
    let subviewDepth = 0;

    lines.forEach((line, idx) => {
        const lineNo = idx + 1;

        if (line.includes('id="t-view-') || (line.includes('class="teacher-subview"') && !currentSubview)) {
            const match = line.match(/id=["']([^"']+)["']/);
            const id = match ? match[1] : 'unknown';
            if (currentSubview) {
                console.log(`L${subviewStartLine}-${lineNo-1} ${currentSubview}: UNCLOSED! Net div change inside: ${subviewDepth}`);
            }
            currentSubview = id;
            subviewStartLine = lineNo;
            subviewDepth = 0;
        }

        if (currentSubview) {
            const openDivs = (line.match(/<div[\s>]/gi) || []).length;
            const closeDivs = (line.match(/<\/div>/gi) || []).length;
            subviewDepth += (openDivs - closeDivs);

            if (subviewDepth === 0 && lineNo > subviewStartLine) {
                console.log(`L${subviewStartLine}-L${lineNo} ${currentSubview}: BALANCED SUCCESS (Net div change = 0)`);
                currentSubview = null;
            }
        }
    });

    if (currentSubview) {
        console.log(`L${subviewStartLine}-end ${currentSubview}: UNCLOSED! Net div change inside: ${subviewDepth}`);
    }
}

checkSubviewsExact('index.html');
checkSubviewsExact('index_kz.html');
