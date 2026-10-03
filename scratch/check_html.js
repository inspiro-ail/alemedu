const fs = require('fs');

function analyzeFile(filename) {
    console.log(`=== ANALYZING ${filename} ===`);
    const content = fs.readFileSync(filename, 'utf8');
    const lines = content.split('\n');
    
    // Find teacher section
    let teacherStart = -1;
    let teacherEnd = -1;
    lines.forEach((l, i) => {
        if (l.includes('t-view-') || l.includes('teacher-')) {
            // console.log(`L${i+1}: ${l.trim()}`);
        }
    });

    // Match all IDs starting with t-view-
    const subviews = [];
    const subviewRegex = /id=["'](t-view-[^"']+)["']/g;
    let match;
    while ((match = subviewRegex.exec(content)) !== null) {
        subviews.push(match[1]);
    }
    console.log("Teacher subview IDs found:", subviews);

    // Track tree nesting of teacher view
    // Let's trace divs inside the teacher main container
    let depth = 0;
    let inTeacher = false;
    lines.forEach((line, idx) => {
        const lineNo = idx + 1;
        if (line.includes('id="t-view-generator"') || line.includes('id="t-view-')) {
            // print context
        }
    });
}

analyzeFile('index.html');
analyzeFile('index_kz.html');
