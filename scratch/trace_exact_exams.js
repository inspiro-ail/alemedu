const fs = require('fs');

function traceExactExams(filename) {
    let html = fs.readFileSync(filename, 'utf8');

    if (filename === 'index.html') {
        html = html.replace(
            `                        </div>\n\n                <!-- ==========================\n                     SUB-VIEW 1.5: LESSONS`,
            `                        </div>\n                </div>\n\n                <!-- ==========================\n                     SUB-VIEW 1.5: LESSONS`
        );

        html = html.replace(
            `                                <div id="exam-analytics-table-container" style="margin-top:24px; display:none;">\n                                </div>\n                            </div>\n                        </div>\n                    </div>\n                </div>`,
            `                                <div id="exam-analytics-table-container" style="margin-top:24px; display:none;">\n                                </div>\n                            </div>\n                        </div>\n                    </div>`
        );
    }

    const lines = html.split('\n');
    let depth = 0;

    for (let i = 0; i < lines.length; i++) {
        const lineNo = i + 1;
        const line = lines[i];

        const openCount = (line.match(/<div[\s>]/gi) || []).length;
        const closeCount = (line.match(/<\/div>/gi) || []).length;

        depth += (openCount - closeCount);

        if (lineNo >= 575 && lineNo <= 605) {
            console.log(`L${lineNo} (+${openCount} -${closeCount} => depth ${depth}): ${line.trim().slice(0, 75)}`);
        }
    }
}

traceExactExams('index.html');
