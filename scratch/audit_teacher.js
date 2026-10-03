const fs = require('fs');

function auditTeacherView(filename) {
    console.log(`\n=================== AUDITING TEACHER VIEW IN ${filename} ===================`);
    const content = fs.readFileSync(filename, 'utf8');
    const lines = content.split('\n');

    let teacherStartLine = -1;
    let teacherEndLine = -1;

    // Find teacher view start and end (before student view)
    lines.forEach((l, idx) => {
        if (l.includes('id="teacher-view"')) teacherStartLine = idx + 1;
        if (l.includes('id="student-view"')) teacherEndLine = idx + 1;
    });

    console.log(`Teacher View lines: L${teacherStartLine} to L${teacherEndLine}`);

    // Analyze line by line in teacher view
    let stack = [];
    let subviewStack = [];

    for (let i = teacherStartLine - 1; i < teacherEndLine - 1; i++) {
        const lineNo = i + 1;
        const line = lines[i];

        const divMatches = line.match(/<\/?div[^>]*>/gi) || [];
        divMatches.forEach(tag => {
            if (tag.toLowerCase().startsWith('</div')) {
                if (stack.length === 0) {
                    console.log(`L${lineNo} UNBALANCED CLOSING DIV!`);
                } else {
                    const top = stack.pop();
                    if (top.isSubview) {
                        console.log(`L${lineNo} SUBVIEW CLOSED: ${top.id} (Opened at L${top.lineNo}, stack depth was ${stack.length})`);
                    }
                }
            } else {
                const isSubview = tag.includes('class="teacher-subview"') || tag.includes('id="t-view-');
                let id = 'div';
                const idMatch = tag.match(/id=["']([^"']+)["']/);
                if (idMatch) id = idMatch[1];

                const item = { lineNo, tag, isSubview, id, depth: stack.length };
                stack.push(item);
                if (isSubview) {
                    console.log(`L${lineNo} SUBVIEW OPENED: ${id} (Stack depth before open: ${stack.length - 1})`);
                }
            }
        });
    }

    console.log(`\nEnd of teacher view stack remaining items count: ${stack.length}`);
    stack.forEach(s => console.log(`  Unclosed at L${s.lineNo}: <div id="${s.id}">`));
}

auditTeacherView('index.html');
auditTeacherView('index_kz.html');
