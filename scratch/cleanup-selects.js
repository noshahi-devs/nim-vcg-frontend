const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.component.css')) {
                results.push(file);
            }
        }
    });
    return results;
}

const cssFiles = walk('e:/GitHub Projects/Noshahi-Institute-Manager/nim-vcg-frontend/src/app/pages');

cssFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Remove background-image: var(--select-chevron) rules (with or without !important)
    content = content.replace(/background-image:\s*var\(--select-chevron\)[^;]*;/gi, '');
    
    // Remove background-repeat: no-repeat rules that follow background-image or are inside select blocks
    // This is tricky, so let's just remove them globally from component files since we want global control anyway
    content = content.replace(/background-repeat:\s*no-repeat[^;]*;/gi, '');
    
    // Also remove background-position and background-size if they are specific to selects
    // But be careful not to remove them for other things. 
    // However, usually these components only use them for selects.
    
    if (content !== original) {
        console.log(`Updating ${file}`);
        fs.writeFileSync(file, content);
    }
});
