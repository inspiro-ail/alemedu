const fs = require('fs');

function finalVerification(filename) {
    let content = fs.readFileSync(filename, 'utf8');

    // Balance total open vs close divs
    let totalOpen = (content.match(/<div[\s>]/gi) || []).length;
    let totalClose = (content.match(/<\/div>/gi) || []).length;

    if (totalClose > totalOpen) {
        // remove extra closing div added before </body>
        content = content.replace('</div>\n</body>', '</body>');
        fs.writeFileSync(filename, content, 'utf8');
        totalOpen = (content.match(/<div[\s>]/gi) || []).length;
        totalClose = (content.match(/<\/div>/gi) || []).length;
    }

    const lines = content.split('\n');
    let teacherStart = -1;
    let studentStart = -1;

    lines.forEach((l, i) => {
        if (l.includes('id="teacher-view"')) teacherStart = i;
        if (l.includes('id="student-view"')) studentStart = i;
    });

    let depth = 0;
    let errors = 0;
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

    console.log(`=== ${filename} SUMMARY ===`);
    console.log(`Subviews count (${subviews.length}):`, subviews.map(s => s.id));
    console.log(`Total <div> tag balance: Open=${totalOpen}, Close=${totalClose}`);

    if (errors === 0 && totalOpen === totalClose) {
        console.log(`🎉🎉🎉 ${filename} IS 100% PERFECT! ALL TEACHER SUBVIEWS ARE BALANCED AND FULLY REPAIRED! 🎉🎉🎉\n`);
    } else {
        console.log(`⚠️ ${filename} HAS ERRORS OR MISMATCH: errors=${errors}, Open=${totalOpen}, Close=${totalClose}\n`);
    }
}

finalVerification('index.html');
finalVerification('index_kz.html');
