const fs = require('fs');

function testExactFix(filename) {
    console.log(`\n=== TESTING EXACT FIX ON ${filename} ===`);
    let html = fs.readFileSync(filename, 'utf8');

    if (filename === 'index.html') {
        // Fix 1: Add 1 closing div at end of t-view-workspace
        html = html.replace(
            `                        </div>\n\n                <!-- ==========================\n                     SUB-VIEW 1.5: LESSONS`,
            `                        </div>\n                </div>\n\n                <!-- ==========================\n                     SUB-VIEW 1.5: LESSONS`
        );

        // Fix 2: Remove extra div after exam-analytics-summary (line 578)
        html = html.replace(
            `                                        <div id="analytics-avg-score" style="font-size:2rem; font-weight:bold; color:white;">0%</div>\n                                    </div>\n                                </div>\n\n                                <!-- AI Output area -->`,
            `                                        <div id="analytics-avg-score" style="font-size:2rem; font-weight:bold; color:white;">0%</div>\n                                    </div>\n                                </div>\n\n                                <!-- AI Output area -->`
        );

        // Fix 3: Fix closing divs at end of t-view-exams (lines 587-592)
        // Original has 4 closing divs after table container. We need 4 closing divs total (table-container, task-form-panel, exam-tab-results, max-width, t-view-exams = 5).
        // Let's check exact block:
        html = html.replace(
            `                                <div id="exam-analytics-table-container" style="margin-top:24px; display:none;">\n                                </div>\n                            </div>\n                        </div>\n                    </div>\n                </div>`,
            `                                <div id="exam-analytics-table-container" style="margin-top:24px; display:none;">\n                                </div>\n                            </div>\n                        </div>\n                    </div>\n                </div>`
        );
    }

    if (filename === 'index_kz.html') {
        html = html.replace(
            `                            </div>\n\n                <!-- ==========================\n                     SUB-VIEW 1.5: LESSONS`,
            `                            </div>\n                </div>\n\n                <!-- ==========================\n                     SUB-VIEW 1.5: LESSONS`
        );
    }

    // Let's write a script that tests exact lines 550 to 595
}

// Let's run a test parser that auto-corrects the exact div balance inside t-view-exams for both files!
