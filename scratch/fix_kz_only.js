const fs = require('fs');

function fixKzOnly() {
    let content = fs.readFileSync('index_kz.html', 'utf8');

    // Restore 1 closing div after t-view-workspace if depth was 5
    // Let's check depth before t-view-lessons
    const lines = content.split('\n');
    let depth = 0;
    lines.forEach((line, idx) => {
        const lineNo = idx + 1;
        const openCount = (line.match(/<div[\s>]/gi) || []).length;
        const closeCount = (line.match(/<\/div>/gi) || []).length;

        const depthBefore = depth;
        depth += (openCount - closeCount);

        if (line.includes('id="t-view-lessons"')) {
            console.log(`t-view-lessons depth before: ${depthBefore}`);
            if (depthBefore === 5) {
                console.log("Adding 1 closing div before t-view-lessons to drop depth from 5 to 4!");
                content = content.replace(
                    `                <!-- ==========================\n                     SUB-VIEW 1.5: LESSONS`,
                    `                </div>\n\n                <!-- ==========================\n                     SUB-VIEW 1.5: LESSONS`
                );
            }
        }
    });

    const totalOpen = (content.match(/<div[\s>]/gi) || []).length;
    const totalClose = (content.match(/<\/div>/gi) || []).length;

    if (totalOpen > totalClose) {
        content = content.replace('</body>', '</div>\n</body>');
    }

    fs.writeFileSync('index_kz.html', content, 'utf8');

    // Re-verify index_kz.html
    const updatedLines = content.split('\n');
    let teacherStart = -1;
    let studentStart = -1;

    updatedLines.forEach((l, i) => {
        if (l.includes('id="teacher-view"')) teacherStart = i;
        if (l.includes('id="student-view"')) studentStart = i;
    });

    let newDepth = 0;
    let errors = 0;
    let subviews = [];

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
                subviews.push({ id, lineNo, depthBefore });
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

fixKzOnly();
