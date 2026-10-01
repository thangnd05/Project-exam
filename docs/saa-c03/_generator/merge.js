// node merge.js --status        : trạng thái từng tag
// node merge.js [--write]       : kiểm tra toàn bộ, cân bằng nhãn đáp án, ghi file domain vào docs/saa-c03
const fs = require('fs');
const path = require('path');
const { TAGS } = require('./config');
const { loadTag, check, permute, LABELS } = require('./lib');

const DEST = 'D:/Project-exam/docs/saa-c03';
const PER_TAG = 70;
const FILES = [
  { file: 'domain-01-secure-architectures.json', part: 'Secure Architectures', from: 0, to: 12 },
  { file: 'domain-02-resilient-architectures-part-1.json', part: 'Resilient Architectures', from: 0, to: 9 },
  { file: 'domain-02-resilient-architectures-part-2.json', part: 'Resilient Architectures', from: 9, to: 17 },
  { file: 'domain-03-high-performing-architectures-part-1.json', part: 'High-Performing Architectures', from: 0, to: 8 },
  { file: 'domain-03-high-performing-architectures-part-2.json', part: 'High-Performing Architectures', from: 8, to: 16 },
  { file: 'domain-04-cost-optimized-architectures.json', part: 'Cost-Optimized Architectures', from: 0, to: 6 },
];

function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function shuffle(a, r) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const norm = s => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const words = s => new Set(norm(s).split(' ').filter(w => w.length > 3));
function jaccard(a, b) { let i = 0; for (const w of a) if (b.has(w)) i++; return i / (a.size + b.size - i || 1); }

const args = process.argv.slice(2);
const status = TAGS.map(t => {
  const qs = loadTag(t.slug);
  const errs = qs.flatMap(check);
  return { t, qs: qs.filter(q => !q.__error), errs };
});

if (args.includes('--status')) {
  for (const s of status) console.log(`${s.t.slug.padEnd(32)} ${String(s.qs.length).padStart(3)} câu  ${s.errs.length ? s.errs.length + ' lỗi' : ''}`);
  const done = status.filter(s => s.qs.length === PER_TAG && !s.errs.length).length;
  console.log(`Hoàn tất ${done}/${TAGS.length} tag`);
  process.exit(0);
}

// Trùng lặp: giữa các câu mới với nhau và với câu đã có
const dup = [];
const all = status.flatMap(s => s.qs.map(q => ({ slug: s.t.slug, src: q.__src, w: words(q.questionText) })));
for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
  if (all[i].slug !== all[j].slug && all[i].slug.slice(3) !== all[j].slug.slice(3)) continue;
  const sim = jaccard(all[i].w, all[j].w);
  if (sim > 0.6) dup.push(`${all[i].src} ~ ${all[j].src} (${sim.toFixed(2)})`);
}
for (const s of status) {
  const ex = fs.readFileSync(path.join(__dirname, 'existing', s.t.slug + '.txt'), 'utf8').split('\n').filter(Boolean).map(l => words(l.replace(/^\d+\. /, '')));
  for (const q of s.qs) {
    const w = words(q.questionText.slice(0, 260));
    for (const e of ex) { const sim = jaccard(w, e); if (sim > 0.6) { dup.push(`${q.__src} ~ câu đã có (${sim.toFixed(2)})`); break; } }
  }
}

const bad = status.filter(s => s.qs.length !== PER_TAG || s.errs.length);
if (bad.length) {
  console.log('Chưa đủ/lỗi:');
  bad.forEach(s => console.log(` - ${s.t.slug}: ${s.qs.length} câu, ${s.errs.length} lỗi`));
}
if (dup.length) { console.log(`Nghi trùng (${dup.length}):`); dup.forEach(d => console.log(' - ' + d)); }
const PARTIAL = args.includes('--partial');
if ((bad.length || dup.length) && !args.includes('--force') && !PARTIAL) { console.log('Dừng. (thêm --force để bỏ qua)'); process.exit(1); }
if (!args.includes('--write') && !PARTIAL) { console.log('Kiểm tra xong, chưa ghi (thêm --write).'); process.exit(0); }

fs.mkdirSync(DEST, { recursive: true });
let seed = 20260930;
const numbers = {};
for (const f of FILES) {
  const tags = TAGS.filter(t => t.part === f.part).slice(f.from, f.to);
  const r = rng(seed++);
  const mcqCount = Object.fromEntries(LABELS.slice(0, 4).map(l => [l, 0]));
  const msqCount = Object.fromEntries(LABELS.slice(0, 6).map(l => [l, 0]));
  const out = [];
  numbers[f.part] = numbers[f.part] || 0;
  for (const t of tags) {
    const s = status.find(x => x.t === t);
    if (!s) continue;
    if (!PARTIAL && (s.qs.length !== PER_TAG || s.errs.length)) continue;
    for (const q0 of s.qs) {
      if (check(q0).length) continue;
      const n = q0.answers.length;
      const correctIdx = q0.answers.map((a, i) => a.isCorrect ? i : -1).filter(i => i >= 0);
      let perm;
      if (q0.questionType === 'MCQ') {
        const min = Math.min(...Object.values(mcqCount));
        const target = shuffle(Object.keys(mcqCount).filter(l => mcqCount[l] === min), r)[0];
        const ti = LABELS.indexOf(target);
        const wrong = shuffle(q0.answers.map((_, i) => i).filter(i => i !== correctIdx[0]), r);
        perm = []; for (let i = 0; i < n; i++) perm.push(i === ti ? correctIdx[0] : wrong.shift());
        mcqCount[target]++;
      } else {
        let best, bestScore = Infinity;
        for (let k = 0; k < 40; k++) {
          const p = shuffle(q0.answers.map((_, i) => i), r);
          const c = Object.assign({}, msqCount);
          p.forEach((oi, ni) => { if (q0.answers[oi].isCorrect) c[LABELS[ni]]++; });
          const score = Object.values(c).reduce((a, b) => a + b * b, 0);
          if (score < bestScore) { bestScore = score; best = p; }
        }
        perm = best;
        perm.forEach((oi, ni) => { if (q0.answers[oi].isCorrect) msqCount[LABELS[ni]]++; });
      }
      const q = permute(q0, perm);
      const errs = check(Object.assign({}, q, { __src: q0.__src }));
      if (errs.length) throw new Error('Sau hoán vị lỗi: ' + errs.join('; '));
      out.push({
        questionNumber: ++numbers[f.part],
        questionType: q.questionType,
        questionText: q.questionText.trim(),
        explanation: q.explanation.trim(),
        tagNames: [`${t.part} > ${t.name}`],
        answers: q.answers,
      });
    }
  }
  if (!out.length) { console.log(`${f.file}: bỏ qua (chưa có tag nào hoàn tất)`); continue; }
  const json = JSON.stringify({ version: 1, usageScope: 'PRACTICE', questions: out }, null, 2) + '\n';
  fs.writeFileSync(path.join(DEST, f.file), json);
  const correct = {};
  out.forEach(q => q.answers.forEach(a => { if (a.isCorrect) correct[a.answerLabel] = (correct[a.answerLabel] || 0) + 1; }));
  console.log(`${f.file}: ${out.length} câu, ${(json.length / 1024 / 1024).toFixed(2)} MB, MCQ ${JSON.stringify(mcqCount)}, đúng theo nhãn ${JSON.stringify(correct)}`);
}
