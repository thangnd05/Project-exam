// node merge.js --status     : số câu từng tag
// node merge.js --partial    : ghi mọi câu hợp lệ hiện có vào docs/dop-c02/domain-0X-*-2.json
// node merge.js --write      : bản cuối (bắt buộc đủ 50 câu/tag, không lỗi)
// Hoán vị đáp án để đáp án đúng chia đều A/B/C/D (và sửa nhãn trong giải thích).
const fs = require('fs');
const path = require('path');
const { TAGS } = require('./config');
const { loadTag, check, permute, LABELS } = require('./lib');

const DEST = path.join(__dirname, '..');
const PER_TAG = 50;
const FILES = [
  { file: 'domain-04-resiliency-ha-dr-2.json', part: 'Resilient Cloud Solutions', keep: 'Resilient Cloud Solutions > AWS Auto Scaling' },
  { file: 'domain-05-security-compliance-2.json', part: 'Security and Compliance' },
  { file: 'domain-06-incident-event-response-2.json', part: 'Incident and Event Response' },
];

function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function shuffle(a, r) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

const args = process.argv.slice(2);
const status = TAGS.map(t => { const qs = loadTag(t.slug); return { t, qs: qs.filter(q => !q.__error), errs: qs.flatMap(check) }; });

if (args.includes('--status')) {
  for (const s of status) console.log(`${s.t.slug.padEnd(26)} ${String(s.qs.length).padStart(3)} câu  ${s.errs.length ? s.errs.length + ' lỗi' : ''}`);
  console.log(`Hoàn tất ${status.filter(s => s.qs.length === PER_TAG && !s.errs.length).length}/${TAGS.length} tag`);
  process.exit(0);
}
const PARTIAL = args.includes('--partial');
const bad = status.filter(s => s.qs.length !== PER_TAG || s.errs.length);
if (bad.length) { console.log('Chưa đủ/lỗi:'); bad.forEach(s => console.log(` - ${s.t.slug}: ${s.qs.length} câu, ${s.errs.length} lỗi`)); }
if (bad.length && !PARTIAL) { console.log('Dừng (dùng --partial để ghi phần đã có).'); process.exit(1); }
if (!args.includes('--write') && !PARTIAL) process.exit(0);

let seed = 20261001;
for (const f of FILES) {
  const r = rng(seed++);
  const out = [];
  const mcqCount = { A: 0, B: 0, C: 0, D: 0 };
  const msqCount = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
  if (f.keep) {
    const cur = JSON.parse(fs.readFileSync(path.join(DEST, f.file), 'utf8')).questions.filter(q => q.tagNames.includes(f.keep));
    for (const q of cur) {
      out.push(q);
      q.answers.forEach(a => { if (a.isCorrect) (q.questionType === 'MCQ' ? mcqCount : msqCount)[a.answerLabel]++; });
    }
  }
  for (const t of TAGS.filter(t => t.part === f.part)) {
    const s = status.find(x => x.t === t);
    for (const q0 of s.qs) {
      if (check(q0).length) continue;
      const n = q0.answers.length;
      const ci = q0.answers.findIndex(a => a.isCorrect);
      let perm;
      if (q0.questionType === 'MCQ') {
        const min = Math.min(...Object.values(mcqCount));
        const target = shuffle(Object.keys(mcqCount).filter(l => mcqCount[l] === min), r)[0];
        const ti = LABELS.indexOf(target);
        const wrong = shuffle(q0.answers.map((_, i) => i).filter(i => i !== ci), r);
        perm = []; for (let i = 0; i < n; i++) perm.push(i === ti ? ci : wrong.shift());
        mcqCount[target]++;
      } else {
        let bestScore = Infinity;
        for (let k = 0; k < 40; k++) {
          const p = shuffle(q0.answers.map((_, i) => i), r);
          const c = Object.assign({}, msqCount);
          p.forEach((oi, ni) => { if (q0.answers[oi].isCorrect) c[LABELS[ni]]++; });
          const score = Object.values(c).reduce((a, b) => a + b * b, 0);
          if (score < bestScore) { bestScore = score; perm = p; }
        }
        perm.forEach((oi, ni) => { if (q0.answers[oi].isCorrect) msqCount[LABELS[ni]]++; });
      }
      const q = permute(q0, perm);
      const errs = check(Object.assign({}, q, { __src: q0.__src }));
      if (errs.length) throw new Error('Sau hoán vị lỗi: ' + errs.join('; '));
      out.push({ questionNumber: 0, questionType: q.questionType, questionText: q.questionText.trim(), explanation: q.explanation.trim(), tagNames: [`${t.part} > ${t.name}`], answers: q.answers });
    }
  }
  out.forEach((q, i) => { q.questionNumber = i + 1; });
  if (!out.length) { console.log(`${f.file}: bỏ qua (chưa có câu)`); continue; }
  const json = JSON.stringify({ version: 1, usageScope: 'PRACTICE', questions: out }, null, 2) + '\n';
  fs.writeFileSync(path.join(DEST, f.file), json);
  const correct = {};
  out.forEach(q => q.answers.forEach(a => { if (a.isCorrect) correct[a.answerLabel] = (correct[a.answerLabel] || 0) + 1; }));
  console.log(`${f.file}: ${out.length} câu, MCQ ${JSON.stringify(mcqCount)}, đúng theo nhãn ${JSON.stringify(correct)}`);
}
