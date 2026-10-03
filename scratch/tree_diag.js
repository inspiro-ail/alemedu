const fs = require('fs');

function findTeacherDivErrors(filename) {
    console.log(`\n=================== TREE DIAGNOSIS: ${filename} ===================`);
    const content = fs.readFileSync(filename, 'utf8');
    const lines = content.split('\n');

    let teacherStart = -1;
    let studentStart = -1;

    lines.forEach((l, i) => {
        if (l.includes('id="teacher-view"')) teacherStart = i;
        if (l.includes('id="student-view"')) studentStart = i;
    });

    let depth = 0;
    // We expect depth inside dash-body to be 3 (teacher-view -> view-section-content -> dash-body)
    for (let i = teacherStart; i < studentStart; i++) {
        const lineNo = i + 1;
        const line = lines[i];

        const openCount = (line.match(/<div[\s>]/gi) || []).length;
        const closeCount = (line.match(/<\/div>/gi) || []).length;

        depth += (openCount - closeCount);

        const isSub = line.includes('id="t-view-') || line.includes('class="teacher-subview"');
        if (isSub) {
            console.log(`L${lineNo} [depth=${depth}] SUBVIEW: ${line.trim().slice(0, 70)}`);
            if (depth !== 4) { // inside dash-body (depth 3), subview header makes it 4
                console.log(`  >>> ERROR: Subview opened at depth ${depth} instead of 4!`);
            }
        }
    }
}

findTeacherDivErrors('index.html');
findTeacherDivErrors('index_kz.html');
