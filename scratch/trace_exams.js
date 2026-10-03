const fs = require('fs');

function traceRange(filename, startLine, endLine) {
    const content = fs.readFileSync(filename, 'utf8');
    const lines = content.split('\n');
    let stack = [];

    for (let i = startLine - 1; i < endLine && i < lines.length; i++) {
        const line = lines[i];
        const lineNo = i + 1;

        // find all div tags
        const regex = /<\/?div[^>]*>/gi;
        let match;
        while ((match = regex.exec(line)) !== null) {
            const tag = match[0];
            if (tag.toLowerCase().startsWith('</div')) {
                if (stack.length === 0) {
                    console.log(`L${lineNo} Extra closing </div> tag!`);
                } else {
                    const popped = stack.pop();
                    // console.log(`L${lineNo} Closed div opened at L${popped.lineNo}`);
                }
            } else {
                stack.push({ lineNo, tag });
            }
        }
    }
    console.log(`Remaining unclosed divs from L${startLine} to L${endLine}:`, stack.length);
    stack.forEach(s => console.log(`  Unclosed: L${s.lineNo} -> ${s.tag.slice(0, 60)}`));
}

console.log("=== INDEX.HTML L428-595 ===");
traceRange('index.html', 428, 595);

console.log("\n=== INDEX_KZ.HTML L436-602 ===");
traceRange('index_kz.html', 436, 602);
