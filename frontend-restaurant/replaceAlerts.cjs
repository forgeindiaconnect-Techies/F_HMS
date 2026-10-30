const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'pages', 'staff');
const files = fs.readdirSync(dir).filter(f => f.startsWith('Manager') && f.endsWith('.jsx'));

for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    if (content.includes('alert(')) {
        content = content.replace(/alert\(/g, 'toast.success(');
        if (!content.includes("import toast")) {
            // Find the first line after imports
            let lines = content.split('\n');
            let lastImportIndex = 0;
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].trim().startsWith('import ')) {
                    lastImportIndex = i;
                }
            }
            lines.splice(lastImportIndex + 1, 0, "import toast from 'react-hot-toast';");
            content = lines.join('\n');
        }
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${file}`);
    }
}
console.log('Done.');
