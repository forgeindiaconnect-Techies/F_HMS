const fs = require('fs');
const path = require('path');
const dir = 'c:/Users/kmrut/Desktop/Restaurant/frontend/src';

function walk(d) {
    let results = [];
    const list = fs.readdirSync(d);
    list.forEach(file => {
        file = path.join(d, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk(dir);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // targeted replacements for JSX text nodes containing ${
    
    // 1. >${
    content = content.replace(/>\$\{/g, '>₹{');
    // 2. > ${
    content = content.replace(/> \$\{/g, '> ₹{');
    // 3. line starting with spaces and then ${ (e.g. `      ${price}`)
    content = content.replace(/^(\s*)\$\{/gm, '$1₹{');
    // 4. -${
    content = content.replace(/-\$\{/g, '-₹{');
    // 5. Pay ${
    content = content.replace(/Pay \$\{/g, 'Pay ₹{');
    // 6. • ${
    content = content.replace(/• \$\{/g, '• ₹{');
    // 7. discount > 0 ? '$' : ''
    content = content.replace(/discount > 0 \? '\$' : ''/g, "discount > 0 ? '₹' : ''");
    
    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Modified ${file}`);
    }
});
