const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '..', 'css', 'styles.css');
const indexPath = path.join(__dirname, '..', 'index.html');

// 1. Update css/styles.css
let cssContent = fs.readFileSync(cssPath, 'utf8');

// Replace Dashboard layout and Sidebar rules to ensure scrollable nav and prevent cropping
const oldDashLayout = `/* DASHBOARD LAYOUT (PERMANENT SIDEBAR) */
.dashboard-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  grid-template-rows: 100vh;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  border-radius: 0;
  border: none;
}`;

const newDashLayout = `/* DASHBOARD LAYOUT (PERMANENT SIDEBAR) */
.dashboard-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  grid-template-rows: 100vh;
  width: 100%;
  max-width: 100vw;
  height: 100vh;
  max-height: 100vh;
  overflow: hidden;
  border-radius: 0;
  border: none;
  box-sizing: border-box;
}`;

if (cssContent.includes(oldDashLayout)) {
    cssContent = cssContent.replace(oldDashLayout, newDashLayout);
}

const oldSideMenu = `/* SIDEBAR (PERMANENT) */
.side-menu-drawer {
    width: 280px;
    height: 100vh;
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(25px);
    border-right: 1px solid var(--glass-border);
    display: flex;
    flex-direction: column;
    padding: 40px 24px;
    /* Static layout, always visible */
}`;

const newSideMenu = `/* SIDEBAR (PERMANENT & SCROLLABLE) */
.side-menu-drawer {
    width: 260px;
    height: 100vh;
    background: rgba(15, 23, 42, 0.75);
    backdrop-filter: blur(25px);
    border-right: 1px solid var(--glass-border);
    display: flex;
    flex-direction: column;
    padding: 24px 16px;
    overflow: hidden;
    box-sizing: border-box;
}`;

if (cssContent.includes(oldSideMenu)) {
    cssContent = cssContent.replace(oldSideMenu, newSideMenu);
}

const oldDrawerHeader = `.drawer-header {
    margin-bottom: 40px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--glass-border);
}`;

const newDrawerHeader = `.drawer-header {
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--glass-border);
    flex-shrink: 0;
}`;

if (cssContent.includes(oldDrawerHeader)) {
    cssContent = cssContent.replace(oldDrawerHeader, newDrawerHeader);
}

const oldDashNav = `.side-menu-drawer .dash-nav {
    flex-direction: column;
    background: transparent;
    padding: 0;
    gap: 12px;
}`;

const newDashNav = `.side-menu-drawer .dash-nav {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    background: transparent;
    padding: 0 4px 20px 0;
    gap: 8px;
    scrollbar-width: thin;
    scrollbar-color: rgba(139, 92, 246, 0.4) transparent;
}

.side-menu-drawer .dash-nav::-webkit-scrollbar {
    width: 4px;
}

.side-menu-drawer .dash-nav::-webkit-scrollbar-thumb {
    background: rgba(139, 92, 246, 0.4);
    border-radius: 4px;
}`;

if (cssContent.includes(oldDashNav)) {
    cssContent = cssContent.replace(oldDashNav, newDashNav);
}

const oldNavBtn = `.side-menu-drawer .nav-btn {
    width: 100%;
    text-align: left;
    padding: 16px 20px;
    font-size: 1.05rem;
    display: flex;
    align-items: center;
    gap: 14px;
    background: rgba(255,255,255,0.03);
    border-radius: var(--radius-md);
    border: 1px solid transparent;
}`;

const newNavBtn = `.side-menu-drawer .nav-btn {
    width: 100%;
    text-align: left;
    padding: 12px 16px;
    font-size: 0.92rem;
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(255,255,255,0.03);
    border-radius: var(--radius-md);
    border: 1px solid transparent;
    flex-shrink: 0;
}`;

if (cssContent.includes(oldNavBtn)) {
    cssContent = cssContent.replace(oldNavBtn, newNavBtn);
}

const oldTaskPanel = `.task-creation-panel {
  width: 620px;
  min-width: 580px;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  background: rgba(0,0,0,0.2);
  overflow-y: auto;
}`;

const newTaskPanel = `.task-creation-panel {
  width: 540px;
  max-width: 100%;
  min-width: 320px;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  background: rgba(0,0,0,0.2);
  overflow-y: auto;
  box-sizing: border-box;
}`;

if (cssContent.includes(oldTaskPanel)) {
    cssContent = cssContent.replace(oldTaskPanel, newTaskPanel);
}

// Append global layout protection rules at end of styles.css
const additionalResponsiveCSS = `

/* ============================================
   RESPONSIVE & FULLSCREEN LAYOUT FIXES
   ============================================ */

html, body {
  width: 100%;
  max-width: 100vw;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow-x: hidden;
  box-sizing: border-box;
}

#app-container {
  width: 100%;
  max-width: 100vw;
  box-sizing: border-box;
}

.view-section-content {
  overflow-x: auto !important;
  box-sizing: border-box;
}

.teacher-subview, .student-subview {
  box-sizing: border-box;
  max-width: 100%;
}

.tasks-grid, .subject-grid {
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}

@media (max-width: 1200px) {
  .dashboard-layout {
    grid-template-columns: 240px 1fr;
  }
  .side-menu-drawer {
    width: 240px;
  }
  .task-creation-panel {
    width: 480px;
  }
}

@media (max-width: 900px) {
  .dashboard-layout {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
    height: auto;
    min-height: 100vh;
  }
  .side-menu-drawer {
    width: 100%;
    height: auto;
    max-height: 220px;
    padding: 14px;
    border-right: none;
    border-bottom: 1px solid var(--glass-border);
  }
  .side-menu-drawer .dash-nav {
    flex-direction: row;
    flex-wrap: wrap;
    overflow-y: auto;
    max-height: 140px;
  }
  .side-menu-drawer .nav-btn {
    width: auto;
    padding: 8px 14px;
    font-size: 0.85rem;
  }
}
`;

if (!cssContent.includes('RESPONSIVE & FULLSCREEN LAYOUT FIXES')) {
    cssContent += additionalResponsiveCSS;
}

fs.writeFileSync(cssPath, cssContent, 'utf8');
console.log('✅ css/styles.css updated');

// 2. Update index.html
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Ensure subject detail view two-column layout wraps properly on smaller screens
const oldSubjDetailLayout = `<div style="display:flex; gap:24px; align-items:flex-start;">`;
const newSubjDetailLayout = `<div style="display:flex; gap:24px; align-items:flex-start; flex-wrap:wrap;">`;

if (indexContent.includes(oldSubjDetailLayout)) {
    indexContent = indexContent.replace(oldSubjDetailLayout, newSubjDetailLayout);
}

// Adjust inline physics panel style to be max-width responsive
const oldPhysicsPanelStyle = `<div id="physics-lab-panel" style="display:none; flex-direction:column; width:520px; flex-shrink:0; position:sticky; top:20px;">`;
const newPhysicsPanelStyle = `<div id="physics-lab-panel" style="display:none; flex-direction:column; width:520px; max-width:100%; flex-shrink:0; position:sticky; top:20px; box-sizing:border-box;">`;

if (indexContent.includes(oldPhysicsPanelStyle)) {
    indexContent = indexContent.replace(oldPhysicsPanelStyle, newPhysicsPanelStyle);
}

// Adjust inline py compiler panel style
const oldPyCompilerStyle = `<div id="py-compiler-panel" style="display:none; flex-direction:column; width:420px; flex-shrink:0; position:sticky; top:20px;">`;
const newPyCompilerStyle = `<div id="py-compiler-panel" style="display:none; flex-direction:column; width:420px; max-width:100%; flex-shrink:0; position:sticky; top:20px; box-sizing:border-box;">`;

if (indexContent.includes(oldPyCompilerStyle)) {
    indexContent = indexContent.replace(oldPyCompilerStyle, newPyCompilerStyle);
}

fs.writeFileSync(indexPath, indexContent, 'utf8');
console.log('✅ index.html updated');
