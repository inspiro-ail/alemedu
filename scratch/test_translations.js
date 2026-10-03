const fs = require('fs');
const path = require('path');

const transPath = path.join(__dirname, '..', 'js', 'translations.js');
const transCode = fs.readFileSync(transPath, 'utf8');

console.log('translations.js size:', transCode.length, 'bytes');
if (transCode.includes('window.setLanguage') && transCode.includes('DICTIONARY')) {
    console.log('✅ translations.js contains setLanguage and DICTIONARY');
} else {
    console.error('❌ translations.js missing required exports');
}
