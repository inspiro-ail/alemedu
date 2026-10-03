const fs = require('fs');

function fixKzRegex() {
    let content = fs.readFileSync('index_kz.html', 'utf8');

    // Replace target marker right before SUB-VIEW 1.5: LESSONS
    content = content.replace(
        /(<\/div>\s*<\/div>\s*)(<!-- ==========================\s*SUB-VIEW 1\.5: LESSONS)/,
        '$1                </div>\n\n                $2'
    );

    fs.writeFileSync('index_kz.html', content, 'utf8');

    // Verify index_kz.html
    const updatedLines = content.split('\n');
    let teacherStart = -1;
    let studentStart = -1;

    updatedLines.forEach((l, i) => {
        if (l.includes('id="teacher-view"')) teacherStart = i;
        if (l.includes('id="student-view"')) studentStart = i;
    });

    let newDepth = 0;
    let errors = 0;

    for (let i = 0; i < updatedLines.length; i++) {
        const lineNo = i + 1;
        const line = updatedLines[i];

        const openCount = (line.match(/<div[\s>]/gi) || []).length;
        const closeCount = (line.match(/<\/div>/gi) || []).length;

        const depthBefore = newDepth;
        newDepth += (openCount - closeCount);

        if (i >= teacherStart && i < studentStart) {
            if (line.includes('id="t-view-') || line.includes('class="teacher-subview"')) {
                const match = line.match(/id=["']([^"']+)["']/);
                const id = match ? match[1] : 'unknown';
                if (depthBefore !== 4) {
                    console.log(`❌ L${lineNo} [${id}] Depth before tag: ${depthBefore} (Expected: 4)`);
                    errors++;
                } else {
                    console.log(`✅ L${lineNo} [${id}] PERFECT! Depth before tag is 4.`);
                }
            }
        }
    }

    const finalOpen = (content.match(/<div[\s>]/gi) || []).length;
    const finalClose = (content.match(/<\/div>/gi) || []).length;

    console.log(`index_kz.html balance: Open=${finalOpen}, Close=${finalClose}`);
    if (errors === 0 && finalOpen === finalClose) {
        console.log(`🎉🎉🎉 index_kz.html IS ALSO 100% PERFECT AND BALANCED! 🎉🎉🎉`);
    } else {
        console.log(`⚠️ index_kz.html errors: ${errors}`);
    }
}

fixKzRegex();
