const fs = require('fs');

function fixHtmlFile(filename) {
    console.log(`\n=================== FIXING AND VERIFYING ${filename} ===================`);
    let content = fs.readFileSync(filename, 'utf8');

    // Step 1: Remove duplicate t-view-gradebook block in index.html if present
    if (filename === 'index.html') {
        const dupPattern = /<!-- ==========================\s+SUB-VIEW 6: GRADEBOOK \(TEACHER\)[\s\S]*?<\/div>\s+<\/div>\s+<\/div>\s+<\/div>/;
        content = content.replace(dupPattern, '');
    }

    // Step 2: Fix t-view-workspace closing tag (needs 1 closing div to close t-view-workspace)
    if (filename === 'index.html') {
        content = content.replace(
            `                        </div>\n\n                <!-- ==========================\n                     SUB-VIEW 1.5: LESSONS`,
            `                        </div>\n                </div>\n\n                <!-- ==========================\n                     SUB-VIEW 1.5: LESSONS`
        );
    } else {
        content = content.replace(
            `                            </div>\n\n                <!-- ==========================\n                     SUB-VIEW 1.5: LESSONS`,
            `                            </div>\n                </div>\n\n                <!-- ==========================\n                     SUB-VIEW 1.5: LESSONS`
        );
    }

    // Step 3: Fix t-view-exams closing tags
    // Replace 4 closing divs at end of t-view-exams with 1 closing div (so t-view-exams ends cleanly at depth 4)
    content = content.replace(
        `                                <div id="exam-analytics-table-container" style="margin-top:24px; display:none;">\n                                </div>\n                            </div>\n                        </div>\n                    </div>\n                </div>`,
        `                                <div id="exam-analytics-table-container" style="margin-top:24px; display:none;">\n                                </div>\n                            </div>`
    );

    // Save file
    fs.writeFileSync(filename, content, 'utf8');

    // Step 4: Verify tree depth of every subview in teacher-view
    const lines = content.split('\n');
    let teacherStart = -1;
    let studentStart = -1;

    lines.forEach((l, i) => {
        if (l.includes('id="teacher-view"')) teacherStart = i;
        if (l.includes('id="student-view"')) studentStart = i;
    });

    let depth = 0;
    let errors = 0;

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
                if (depthBefore !== 4) {
                    console.log(`❌ L${lineNo} [${id}] Depth before tag: ${depthBefore} (Expected: 4)`);
                    errors++;
                } else {
                    console.log(`✅ L${lineNo} [${id}] PERFECT! Depth before tag is 4.`);
                }
            }
        }
    }

    const totalOpen = (content.match(/<div[\s>]/gi) || []).length;
    const totalClose = (content.match(/<\/div>/gi) || []).length;

    console.log(`Total <div> balance in ${filename}: Open=${totalOpen}, Close=${totalClose}`);

    if (errors === 0 && totalOpen === totalClose) {
        console.log(`🎉🎉🎉 ${filename} IS 100% PERFECT! ALL TEACHER SUBVIEWS ARE SIBLINGS AT DEPTH 4 AND TOTAL DIV TAGS ARE ABSOLUTELY BALANCED! 🎉🎉🎉`);
    } else {
        console.log(`⚠️ ${filename}: ${errors} subview depth errors, Tag diff = ${totalOpen - totalClose}`);
    }
}

fixHtmlFile('index.html');
fixHtmlFile('index_kz.html');
