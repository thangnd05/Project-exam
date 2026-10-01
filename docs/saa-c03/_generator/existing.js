// Trích câu hỏi SAA-C03 đang có trong dump DB, gom theo tag sau gộp -> existing/<slug>.txt
const fs = require('fs');
const path = require('path');
const { TAGS } = require('./config');
const S = __dirname;
const lines = fs.readFileSync('D:/Project-exam/database/project_exam.sql', 'utf8').split('\n');
function copy(name) { const i = lines.findIndex(l => l.startsWith('COPY ' + name + ' ')); const out = []; for (let j = i + 1; lines[j] !== '\\.'; j++) out.push(lines[j].split('\t')); return out; }
const SAA = '019efe62-ab79-7c17-a467-9137b82b86d7';
const parts = Object.fromEntries(copy('assessment.exam_parts').map(r => [r[0], r[4]]));
const tagById = Object.fromEntries(copy('assessment.tags').filter(r => r[1] === SAA).map(r => [r[0], { name: r[2], part: parts[r[4]] }]));
const qs = Object.fromEntries(copy('assessment.questions').map(r => [r[0], r]));
const byOld = {};
for (const r of copy('assessment.question_tags')) {
  const t = tagById[r[2]]; const q = qs[r[1]];
  if (!t || !q || q[14] !== '\\N') continue;
  const k = t.part + '|' + t.name;
  (byOld[k] = byOld[k] || new Set()).add(q[10].replace(/\\n/g, ' ').replace(/\s+/g, ' ').slice(0, 260));
}
fs.mkdirSync(path.join(S, 'existing'), { recursive: true });
for (const t of TAGS) {
  const set = new Set();
  for (const o of t.old) for (const x of (byOld[t.part + '|' + o] || [])) set.add(x);
  fs.writeFileSync(path.join(S, 'existing', t.slug + '.txt'), [...set].map((x, i) => `${i + 1}. ${x}`).join('\n') + '\n');
  console.log(t.slug, set.size);
}
