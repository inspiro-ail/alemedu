const fs = require('fs');

function fixMissingClosingDiv(filename) {
    let content = fs.readFileSync(filename, 'utf8');
    const totalOpen = (content.match(/<div[\s>]/gi) || []).length;
    const totalClose = (content.match(/<\/div>/gi) || []).length;

    console.log(`${filename} before end-fix: Open=${totalOpen}, Close=${totalClose}`);

    if (totalOpen > totalClose) {
        const diff = totalOpen - totalClose;
        console.log(`Adding ${diff} closing </div> at the end of body/html in ${filename}`);
        content = content.replace('</body>', '</div>\n</body>');
        fs.writeFileSync(filename, content, 'utf8');
    }

    const newOpen = (content.match(/<div[\s>]/gi) || []).length;
    const newClose = (content.match(/<\/div>/gi) || []).length;
    console.log(`${filename} after end-fix: Open=${newOpen}, Close=${newClose}`);
    if (newOpen === newClose) {
        console.log(`🎉 ${filename} IS PERFECTLY BALANCED (Open == Close)!`);
    }
}

fixMissingClosingDiv('index.html');
fixMissingClosingDiv('index_kz.html');
