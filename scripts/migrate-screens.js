const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../components/screens');
const outDir = path.join(__dirname, '../src/screens');
const files = fs.readdirSync(srcDir).filter((f) => f.endsWith('.js') && f !== 'index.js');

const replacements = [
  [/"\.\.\/\.\.\/config\/colors"/g, '"../utils"'],
  [/"\.\.\/\.\.\/config\/fonts"/g, '"../utils"'],
  [/"\.\.\/\.\.\/config\/supabase"/g, '"../api"'],
  [/"\.\.\/\.\.\/services\/habitService"/g, '"../api"'],
  [/"\.\.\/\.\.\/services\/completionService"/g, '"../api"'],
  [/"\.\.\/\.\.\/services\/geminiService"/g, '"../api"'],
  [/"\.\.\/\.\.\/services\/onboardingService"/g, '"../api"'],
  [/'\.\.\/molecules'/g, "'../components'"],
  [/'\.\.\/atoms'/g, "'../components'"],
  [/'\.\.\/organisms'/g, "'../components'"],
];

files.forEach((file) => {
  const content = fs.readFileSync(path.join(srcDir, file), 'utf8');
  let out = content;
  replacements.forEach(([from, to]) => {
    out = out.replace(from, to);
  });
  fs.writeFileSync(path.join(outDir, file), out);
  console.log('Migrated', file);
});

console.log('Done. Migrated', files.length, 'files.');
