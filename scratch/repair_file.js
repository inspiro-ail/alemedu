const fs = require('fs');

function repairFile(filename) {
    console.log(`\n=================== REPAIRING ${filename} ===================`);
    let html = fs.readFileSync(filename, 'utf8');

    // 1. Remove duplicate t-view-gradebook block in index.html if present
    if (filename === 'index.html') {
        const dupPattern = /<!-- ==========================\s+SUB-VIEW 6: GRADEBOOK \(TEACHER\)[\s\S]*?<\/div>\s+<\/div>\s+<\/div>\s+<\/div>/;
        html = html.replace(dupPattern, '');
    }

    // 2. Fix t-view-exams ending in both files
    // In both files around t-view-exams end (lines 580-595):
    // Table container -> closes task-form-panel -> closes exam-tab-results -> closes max-width -> closes t-view-exams
    // We replace the messy closing block at the end of exam-analytics-table-container with 4 clean closing divs:
    html = html.replace(
        /<div id="exam-analytics-table-container"[^>]*>[\s\S]*?<\/div>[\s\n]*<\/div>[\s\n]*<\/div>[\s\n]*<\/div>[\s\n]*<\/div>/,
        `<div id="exam-analytics-table-container" style="margin-top:24px; display:none;">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`
    );

    // Save and analyze
    fs.writeFileSync(filename, html, 'utf8');

    // Analyze line by line
    const lines = html.split('\n');
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

    const totalOpen = (html.match(/<div[\s>]/gi) || []).length;
    const totalClose = (html.match(/<\/div>/gi) || []).length;

    console.log(`Subviews found (${subviews.length}):`, subviews.map(s => s.id));
    console.log(`Total <div> tag balance: Open=${totalOpen}, Close=${totalClose}`);

    if (errors === 0 && totalOpen === totalClose) {
        console.log(`🎉🎉🎉 ${filename} IS 100% PERFECTLY FIXED AND BALANCED! 🎉🎉🎉`);
    } else {
        console.log(`⚠️ ${filename} needs further fine-tuning: ${errors} errors, Tag diff = ${totalOpen - totalClose}`);
    }
}

repairFile('index.html');
repairFile('index_kz.html');
