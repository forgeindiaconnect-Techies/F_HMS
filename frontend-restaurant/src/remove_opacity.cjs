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
        } else if (file.endsWith('.jsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk(dir);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // Remove opacity-0 group-hover:opacity-100
    // Sometimes it's followed by a space, sometimes not.
    content = content.replace(/opacity-0 group-hover:opacity-100\s?/g, '');
    
    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated opacity in ${file}`);
    }
});
