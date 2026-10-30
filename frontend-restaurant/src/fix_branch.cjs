const fs = require('fs');
const path = require('path');
const dir = 'c:/Users/kmrut/Desktop/Restaurant/frontend/src/pages/admin';

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
    
    // Replace something.branch?._id || '' with something.branch?._id || something.branch || ''
    content = content.replace(/([a-zA-Z0-9_]+)\.branch\?\._id \|\| ''/g, '$1.branch?._id || $1.branch || \'\'');
    
    // Replace something.branchId?._id || '' with something.branchId?._id || something.branchId || ''
    content = content.replace(/([a-zA-Z0-9_]+)\.branchId\?\._id \|\| ''/g, '$1.branchId?._id || $1.branchId || \'\'');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated branch assignment in ${file}`);
    }
});
