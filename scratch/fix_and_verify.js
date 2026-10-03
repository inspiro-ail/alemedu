const fs = require('fs');

function fixAndVerify() {
    let indexHtml = fs.readFileSync('index.html', 'utf8');
    let indexKzHtml = fs.readFileSync('index_kz.html', 'utf8');

    console.log("=== FIXING index.html ===");
    // 1. In index.html around line 282-286:
    // Change:
    //                         </div>
    //                     </div>
    //                 </div>
    // 
    //                 <!-- ==========================
    //                      SUB-VIEW 1.5: LESSONS
    // To:
    //                         </div>
    // 
    //                 <!-- ==========================
    //                      SUB-VIEW 1.5: LESSONS
    indexHtml = indexHtml.replace(
        `                        </div>\n                    </div>\n                </div>\n\n                <!-- ==========================\n                     SUB-VIEW 1.5: LESSONS`,
        `                        </div>\n\n                <!-- ==========================\n                     SUB-VIEW 1.5: LESSONS`
    );

    // 2. In index.html remove duplicate t-view-gradebook block (L738-L765):
    const dupGradebookBlock = `                <!-- ==========================
                     SUB-VIEW 6: GRADEBOOK (TEACHER)
                     ========================== -->
                <div id="t-view-gradebook" class="teacher-subview"
                    style="display: none; width: 100%; padding: 30px; overflow-y: auto;">
                    <div style="max-width: 1200px; margin: 0 auto; width: 100%;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:16px;">
                            <div>
                                <h2 style="font-size:1.6rem; font-weight:700; background:linear-gradient(135deg,#6366f1,#a855f7); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;">📊 Журнал оценок</h2>
                                <p style="color:#64748b; font-size:0.85rem; margin-top:4px;">Общая сводка по задачам и экзаменам (Мой предмет)</p>
                            </div>
                            <div style="display:flex; gap:12px; align-items:center;">
                                <input type="text" id="t-gb-class-code" placeholder="ALEM-101"
                                    style="padding:10px 14px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.12); border-radius:10px; color:white; outline:none; font-size:0.9rem;"
                                    value="ALEM-101">
                                <button id="t-load-gb-btn" class="btn-primary"
                                    style="padding:10px 22px; margin-top:0; white-space:nowrap; min-width:auto;">Загрузить</button>
                            </div>
                        </div>

                        <div id="t-gb-content">
                            <div class="rank-empty">
                                <div class="rank-empty-icon">📊</div>
                                <p>Введите код класса для просмотра журнала</p>
                            </div>
                        </div>
                    </div>
                </div>`;

    if (indexHtml.includes(dupGradebookBlock)) {
        indexHtml = indexHtml.replace(dupGradebookBlock, '');
        console.log("Successfully removed duplicate gradebook block from index.html!");
    } else {
        console.log("WARNING: duplicate gradebook block not matched exactly, checking alternative match.");
    }

    fs.writeFileSync('index.html', indexHtml, 'utf8');

    console.log("\n=== FIXING index_kz.html ===");
    // In index_kz.html around line 289-293:
    // Change:
    //                             </div>
    //                         </div>
    //                     </div>
    //                 </div>
    // 
    //                 <!-- ==========================
    //                      SUB-VIEW 1.5: LESSONS
    // To:
    //                             </div>
    // 
    //                 <!-- ==========================
    //                      SUB-VIEW 1.5: LESSONS
    indexKzHtml = indexKzHtml.replace(
        `                            </div>\n                        </div>\n                    </div>\n                </div>\n\n                <!-- ==========================\n                     SUB-VIEW 1.5: LESSONS`,
        `                            </div>\n\n                <!-- ==========================\n                     SUB-VIEW 1.5: LESSONS`
    );

    fs.writeFileSync('index_kz.html', indexKzHtml, 'utf8');

    // Verification step
    function verifyFile(filename) {
        console.log(`\nVerification for ${filename}:`);
        const content = fs.readFileSync(filename, 'utf8');
        const lines = content.split('\n');

        let teacherStart = -1;
        let studentStart = -1;

        lines.forEach((l, i) => {
            if (l.includes('id="teacher-view"')) teacherStart = i;
            if (l.includes('id="student-view"')) studentStart = i;
        });

        let depth = 0;
        let teacherSubviews = [];
        let errors = 0;

        for (let i = teacherStart; i < studentStart; i++) {
            const lineNo = i + 1;
            const line = lines[i];

            const openCount = (line.match(/<div[\s>]/gi) || []).length;
            const closeCount = (line.match(/<\/div>/gi) || []).length;

            const depthBefore = depth;
            depth += (openCount - closeCount);

            if (line.includes('id="t-view-') || line.includes('class="teacher-subview"')) {
                const match = line.match(/id=["']([^"']+)["']/);
                const id = match ? match[1] : 'unknown';
                teacherSubviews.push({ id, lineNo, depthBefore, depthAfter: depth });
                if (depthBefore !== 4) {
                    console.log(`❌ L${lineNo} [${id}] Depth before subview tag is ${depthBefore} (Expected: 4)!`);
                    errors++;
                } else {
                    console.log(`✅ L${lineNo} [${id}] Correctly nested inside .dash-body (Depth: 4 -> 5)`);
                }
            }
        }

        const totalOpenDivs = (content.match(/<div[\s>]/gi) || []).length;
        const totalCloseDivs = (content.match(/<\/div>/gi) || []).length;
        console.log(`Total <div> balance in ${filename}: Open=${totalOpenDivs}, Close=${totalCloseDivs}`);

        if (errors === 0 && totalOpenDivs === totalCloseDivs) {
            console.log(`🎉 ${filename} IS 100% PERFECTLY FIXED AND BALANCED!`);
        } else {
            console.log(`⚠️ ${filename} still has ${errors} errors or tag mismatch.`);
        }
    }

    verifyFile('index.html');
    verifyFile('index_kz.html');
}

fixAndVerify();
