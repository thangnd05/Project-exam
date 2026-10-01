// node validate.js <slug>  -> kiểm tra các file out/<slug>-N.json
const { loadTag, check } = require('./lib');
const slug = process.argv[2];
if (!slug) { console.error('usage: node validate.js <slug>'); process.exit(2); }
const qs = loadTag(slug);
const errs = qs.flatMap(check);
const ok = qs.filter(q => !q.__error);
const stat = (f) => ok.reduce((m, q) => (m[f(q)] = (m[f(q)] || 0) + 1, m), {});
let longest = 0;
for (const q of ok) {
  if (q.questionType !== 'MCQ' || !Array.isArray(q.answers)) continue;
  const lens = q.answers.map(a => (a.answerText || '').length);
  const max = Math.max(...lens);
  const c = q.answers.findIndex(a => a.isCorrect);
  if (lens[c] === max && lens.filter(x => x === max).length === 1) longest++;
}
const mcq = ok.filter(q => q.questionType === 'MCQ').length;
console.log(`${slug}: ${ok.length} câu | type ${JSON.stringify(stat(q => q.questionType))} | level ${JSON.stringify(stat(q => q.level))}`);
console.log(`MCQ có đáp án đúng dài nhất (duy nhất): ${longest}/${mcq}${mcq && longest / mcq > 0.4 ? '  <-- QUÁ NHIỀU, cân lại độ dài đáp án' : ''}`);
if (errs.length) { console.log(`${errs.length} lỗi:`); errs.slice(0, 60).forEach(x => console.log(' - ' + x)); process.exit(1); }
console.log('OK, không có lỗi định dạng.');
