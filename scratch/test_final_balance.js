const fs = require('fs');

function testFinalBalance(filename) {
    console.log(`\n=== TESTING EXACT BALANCE ON ${filename} ===`);
    let html = fs.readFileSync(filename, 'utf8');

    if (filename === 'index.html') {
        // Fix 1: Add 1 closing div at end of t-view-workspace
        html = html.replace(
            `                        </div>\n\n                <!-- ==========================\n                     SUB-VIEW 1.5: LESSONS`,
            `                        </div>\n                </div>\n\n                <!-- ==========================\n                     SUB-VIEW 1.5: LESSONS`
        );

        // Fix 2: Keep exactly 3 closing divs at end of t-view-exams (lines 587-592)
        html = html.replace(
            `                                <div id="exam-analytics-table-container" style="margin-top:24px; display:none;">\n                                </div>\n                            </div>\n                        </div>\n                    </div>\n                </div>`,
            `                                <div id="exam-analytics-table-container" style="margin-top:24px; display:none;">\n                                </div>\n                            </div>\n                        </div>\n                    </div>`
        );

        // Fix 3: Ensure student view starts cleanly after teacher-view ends
        // Check teacher view closing tags at end of t-view-wheel (around line 990)
    }

    if (filename === 'index_kz.html') {
        // Fix 1: Add 1 closing div at end of t-view-workspace
        html = html.replace(
            `                            </div>\n\n                <!-- ==========================\n                     SUB-VIEW 1.5: LESSONS`,
            `                            </div>\n                </div>\n\n                <!-- ==========================\n                     SUB-VIEW 1.5: LESSONS`
        );

        // Fix 2: Keep exactly 3 closing divs at end of t-view-exams
        html = html.replace(
            `                                <div id="exam-analytics-table-container" style="margin-top:24px; display:none;">\n                                </div>\n                            </div>\n                        </div>\n                    </div>\n                </div>`,
            `                                <div id="exam-analytics-table-container" style="margin-top:24px; display:none;">\n                                </div>\n                            </div>\n                        </div>\n                    </div>`
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
            } else {
                console.log(`  ✅ PERFECT! ${id} is correctly at depth 4.`);
            }
        }
    });

    const openCount = (html.match(/<div[\s>]/gi) || []).length;
    const closeCount = (html.match(/<\/div>/gi) || []).length;

    console.log(`Tag Balance in ${filename}: Open=${openCount}, Close=${closeCount}`);
    if (errors === 0 && openCount === closeCount) {
        console.log(`🎉🎉🎉 ${filename} IS 100% PERFECT! ALL TEACHER SUBVIEWS ARE SIBLINGS AT DEPTH 4 AND TOTAL DIV TAGS ARE ABSOLUTELY BALANCED! 🎉🎉🎉`);
    } else {
        console.log(`Remaining errors: ${errors}, Tag difference: ${openCount - closeCount}`);
    }
}

testFinalBalance('index.html');
testFinalBalance('index_kz.html');
