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
let occurrences = [];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, i) => {
        if (line.includes('$')) {
            // filter out pure template literal injections if it's backticked:
            // This is a naive filter to reduce noise.
            // Let's just output the line
            occurrences.push(`${file.split('src')[1]}:${i+1}: ${line.trim()}`);
        }
    });
});
fs.writeFileSync('c:/Users/kmrut/Desktop/Restaurant/frontend/src/dollar_log.txt', occurrences.join('\n'));
