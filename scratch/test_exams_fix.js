const fs = require('fs');

function testExamsFix(filename) {
    console.log(`=== TESTING EXAMS FIX ON ${filename} ===`);
    let html = fs.readFileSync(filename, 'utf8');

    if (filename === 'index.html') {
        // Remove 2 extra closing divs after exam-analytics-table-container (lines 587-592)
        html = html.replace(
            `                                <div id="exam-analytics-table-container" style="margin-top:24px; display:none;">\n                                </div>\n                            </div>\n                        </div>\n                    </div>\n                </div>`,
            `                                <div id="exam-analytics-table-container" style="margin-top:24px; display:none;">\n                                </div>\n                            </div>\n                        </div>`
        );
    }

    if (filename === 'index_kz.html') {
        html = html.replace(
            `                                <div id="exam-analytics-table-container" style="margin-top:24px; display:none;">\n                                </div>\n                            </div>\n                        </div>\n                    </div>\n                </div>`,
            `                                <div id="exam-analytics-table-container" style="margin-top:24px; display:none;">\n                                </div>\n                            </div>\n                        </div>`
        );
    }

    const lines = html.split('\n');
    let depth = 0;
    let errors = 0;

    lines.forEach((line, idx) => {
        const lineNo = idx + 1;
        const openCount = (line.match(/<div[\s>]/gi) || []).length;
        const closeCount = (line.match(/<\/div>/gi) || []).length;

        const depthBefore = depth;
        depth += (openCount - closeCount);

        if (line.includes('id="t-view-') || line.includes('class="teacher-subview"')) {
            const match = line.match(/id=["']([^"']+)["']/);
            const id = match ? match[1] : 'unknown';
            console.log(`L${lineNo} [${id}] depth before: ${depthBefore}, depth after: ${depth}`);
            if (depthBefore !== 4) {
                console.log(`  ❌ FAIL! depth before ${id} is ${depthBefore}, expected 4!`);
                errors++;
            }
        }
    });

    const openCount = (html.match(/<div[\s>]/gi) || []).length;
    const closeCount = (html.match(/<\/div>/gi) || []).length;

    console.log(`Tag Balance in ${filename}: Open=${openCount}, Close=${closeCount}`);
    if (errors === 0 && openCount === closeCount) {
        console.log(`🎉 ${filename} IS 100% PERFECT! ALL TEACHER SUBVIEWS MATCH PERFECTLY!`);
    } else {
        console.log(`Remaining errors: ${errors}`);
    }
}

testExamsFix('index.html');
testExamsFix('index_kz.html');
