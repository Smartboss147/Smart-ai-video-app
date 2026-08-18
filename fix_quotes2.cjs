const fs = require('fs');

function fix(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/fetch\(`\$\{import\.meta\.env\.VITE_API_URL \|\| ''\}\/api\/(.*?)', \{/g, "fetch(`${import.meta.env.VITE_API_URL || ''}/api/$1`, {");
  fs.writeFileSync(file, content);
}

fix('src/components/Dashboard.tsx');
fix('src/components/UsageView.tsx');
fix('src/components/AuthModal.tsx');
fix('src/components/VideoUploader.tsx');
