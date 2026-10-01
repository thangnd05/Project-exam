// node validate.js <slug>  -> kiểm tra các file out/<slug>-N.json (định dạng, độ dài đáp án, trùng câu đã có)
const fs = require('fs');
const path = require('path');
const { loadTag, check } = require('./lib');
const slug = process.argv[2];
if (!slug) { console.error('usage: node validate.js <slug>'); process.exit(2); }
const qs = loadTag(slug);
const errs = qs.flatMap(check);
const ok = qs.filter(q => !q.__error);
const stat = f => ok.reduce((m, q) => (m[f(q)] = (m[f(q)] || 0) + 1, m), {});
let longest = 0, short = 0;
for (const q of ok) {
  if (q.questionType !== 'MCQ' || !Array.isArray(q.answers)) continue;
  const lens = q.answers.map(a => (a.answerText || '').length);
  const c = q.answers.findIndex(a => a.isCorrect);
  const max = Math.max(...lens);
  if (lens[c] === max && lens.filter(x => x === max).length === 1) longest++;
  if ([...lens].sort((a, b) => a - b).indexOf(lens[c]) <= 1) short++;
}
const mcq = ok.filter(q => q.questionType === 'MCQ').length;
const norm = s => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const words = s => new Set(norm(s).split(' ').filter(w => w.length > 3));
const jac = (a, b) => { let i = 0; for (const w of a) if (b.has(w)) i++; return i / (a.size + b.size - i || 1); };
const ex = fs.readFileSync(path.join(__dirname, 'existing', slug + '.txt'), 'utf8').split('\n').filter(Boolean).map(l => words(l.replace(/^\d+\. /, '')));
const dup = [];
const mine = ok.map(q => ({ src: q.__src, w: words(q.questionText.slice(0, 260)) }));
for (const m of mine) { for (const e of ex) { const s = jac(m.w, e); if (s > 0.5) { dup.push(`${m.src} ~ câu đã có (${s.toFixed(2)})`); break; } } }
for (let i = 0; i < mine.length; i++) for (let j = i + 1; j < mine.length; j++) { const s = jac(mine[i].w, mine[j].w); if (s > 0.5) dup.push(`${mine[i].src} ~ ${mine[j].src} (${s.toFixed(2)})`); }
console.log(`${slug}: ${ok.length} câu | type ${JSON.stringify(stat(q => q.questionType))} | đáp án đúng ${JSON.stringify(ok.reduce((m, q) => (q.answers || []).forEach(a => a.isCorrect && (m[a.answerLabel] = (m[a.answerLabel] || 0) + 1)) || m, {}))}`);
console.log(`MCQ đáp án đúng dài nhất: ${longest}/${mcq}${mcq && longest / mcq > 0.3 ? '  <-- QUÁ NHIỀU' : ''} | đúng là ngắn nhất/nhì: ${short}/${mcq}`);
if (dup.length) { console.log('Nghi trùng:'); dup.forEach(d => console.log(' - ' + d)); }
if (errs.length) { console.log(`${errs.length} lỗi:`); errs.slice(0, 60).forEach(x => console.log(' - ' + x)); process.exit(1); }
console.log('OK, không có lỗi định dạng.');
