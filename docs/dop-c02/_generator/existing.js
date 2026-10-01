// Gom đầu các câu đã có (domain-*.json, đề_1, đề_2) theo tag -> existing/<slug>.txt
const fs = require('fs');
const path = require('path');
const { TAGS } = require('./config');
const DIR = path.join(__dirname, '..');
const files = [];
const walk = d => fs.readdirSync(d, { withFileTypes: true }).forEach(e => {
  const p = path.join(d, e.name);
  if (e.isDirectory() && e.name !== '_generator') walk(p); else if (e.name.endsWith('.json')) files.push(p);
});
walk(DIR);
const byTag = {};
for (const f of files) for (const q of JSON.parse(fs.readFileSync(f, 'utf8')).questions) for (const t of q.tagNames) (byTag[t] = byTag[t] || new Set()).add(q.questionText.replace(/\s+/g, ' ').slice(0, 260));
for (const t of TAGS) {
  const set = byTag[`${t.part} > ${t.name}`] || new Set();
  fs.writeFileSync(path.join(__dirname, 'existing', t.slug + '.txt'), [...set].map((x, i) => `${i + 1}. ${x}`).join('\n') + '\n');
  console.log(t.slug, set.size);
}
