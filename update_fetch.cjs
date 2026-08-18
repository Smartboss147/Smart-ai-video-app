const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('src/components');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/fetch\('\/api\//g, "fetch(`${import.meta.env.VITE_API_URL || ''}/api/");
  content = content.replace(/fetch\(`\/api\//g, "fetch(`${import.meta.env.VITE_API_URL || ''}/api/");
  fs.writeFileSync(file, content);
});
console.log("Updated fetch calls");
