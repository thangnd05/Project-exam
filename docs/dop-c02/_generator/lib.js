// Kiểm tra định dạng + hoán vị đáp án để cân bằng nhãn đúng. Dùng chung cho validate.js và merge.js.
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, 'out');
const LABELS = 'ABCDEFGHIJ'.split('');
const OPT_LINE = /^\(([A-J])\) (ĐÚNG|SAI): /;
const STRAY = [
  /\((?:[A-J])\)/,
  /\b(?:phương án|đáp án|lựa chọn|option|choice|câu)\s+[A-J]\b/i,
  /\b[A-J] (?:và|and|,) [A-J]\b/,
];

function loadTag(slug) {
  if (!fs.existsSync(OUT)) return [];
  const files = fs.readdirSync(OUT).filter(f => f.startsWith(slug + '-') && /-\d+\.json$/.test(f) && f.slice(slug.length + 1).match(/^\d+\.json$/)).sort((a, b) => parseInt(a.slice(slug.length + 1)) - parseInt(b.slice(slug.length + 1)));
  const qs = [];
  for (const f of files) {
    let arr;
    try { arr = JSON.parse(fs.readFileSync(path.join(OUT, f), 'utf8')); } catch (e) { qs.push({ __error: `${f}: JSON lỗi: ${e.message}` }); continue; }
    if (!Array.isArray(arr)) { qs.push({ __error: `${f}: phải là JSON array` }); continue; }
    arr.forEach((q, i) => qs.push(Object.assign({}, q, { __src: `${f}[${i}]` })));
  }
  return qs;
}

function check(q) {
  const errs = [];
  if (q.__error) return [q.__error];
  const where = q.__src || '?';
  const e = m => errs.push(`${where}: ${m}`);
  const allowed = ['questionType', 'questionText', 'explanation', 'answers', 'level', '__src'];
  for (const k of Object.keys(q)) if (!allowed.includes(k)) e(`trường thừa '${k}'`);
  if (!['MCQ', 'MSQ'].includes(q.questionType)) e('questionType phải là MCQ hoặc MSQ');
  if (q.level !== undefined && !['basic', 'intermediate', 'advanced'].includes(q.level)) e('level phải là basic|intermediate|advanced');
  if (typeof q.questionText !== 'string' || q.questionText.trim().length < 40) e('questionText quá ngắn/thiếu');
  if (!Array.isArray(q.answers)) { e('thiếu answers'); return errs; }
  const n = q.answers.length;
  const correct = q.answers.filter(a => a.isCorrect === true).length;
  q.answers.forEach((a, i) => {
    if (a.answerLabel !== LABELS[i]) e(`answers[${i}].answerLabel phải là ${LABELS[i]}`);
    if (typeof a.answerText !== 'string' || !a.answerText.trim()) e(`answers[${i}].answerText trống`);
    if (typeof a.isCorrect !== 'boolean') e(`answers[${i}].isCorrect phải là boolean`);
    const ks = Object.keys(a).filter(k => !['answerLabel', 'answerText', 'isCorrect'].includes(k));
    if (ks.length) e(`answers[${i}] trường thừa ${ks}`);
  });
  if (q.questionType === 'MCQ' && (n !== 4 || correct !== 1)) e(`MCQ cần 4 đáp án, 1 đúng (đang ${n}/${correct})`);
  if (q.questionType === 'MSQ') {
    if (!((n === 5 && correct === 2) || (n === 6 && correct === 3))) e(`MSQ cần 5 đáp án/2 đúng hoặc 6 đáp án/3 đúng (đang ${n}/${correct})`);
    const want = correct === 2 ? 'TWO' : 'THREE';
    if (!new RegExp(`\\b${want}\\b`).test(q.questionText || '')) e(`MSQ phải ghi rõ "Which ${want}..." trong questionText`);
  }
  const text = q.questionText || '';
  for (const r of STRAY) if (r.test(text)) e(`questionText nhắc tới nhãn đáp án (${r})`);
  const ex = typeof q.explanation === 'string' ? q.explanation : '';
  const lines = ex.split('\n');
  if (!lines[0].startsWith('Phân tích đề: ')) e('explanation dòng đầu phải bắt đầu "Phân tích đề: "');
  const optIdx = [];
  lines.forEach((l, i) => { if (OPT_LINE.test(l)) optIdx.push(i); });
  if (optIdx.length !== n) e(`explanation cần đúng ${n} dòng "(X) ĐÚNG|SAI: ", đang có ${optIdx.length}`);
  else {
    if (optIdx[optIdx.length - 1] - optIdx[0] !== n - 1) e('các dòng "(X) ĐÚNG|SAI:" phải liền nhau');
    optIdx.forEach((li, k) => {
      const m = lines[li].match(OPT_LINE);
      if (m[1] !== LABELS[k]) e(`dòng giải thích thứ ${k + 1} phải là (${LABELS[k]})`);
      else if ((m[2] === 'ĐÚNG') !== q.answers[k].isCorrect) e(`(${m[1]}) ghi ${m[2]} nhưng isCorrect=${q.answers[k].isCorrect}`);
    });
  }
  const keyLine = lines.findIndex(l => l.startsWith('Đáp án đúng: '));
  if (keyLine < 0) e('thiếu dòng "Đáp án đúng: "');
  else if (lines[keyLine].trim() !== 'Đáp án đúng: ' + keyText(q.answers)) e(`dòng đáp án phải là "Đáp án đúng: ${keyText(q.answers)}"`);
  if (!lines.some(l => l.startsWith('Điểm cần nhớ: '))) e('thiếu dòng "Điểm cần nhớ: "');
  lines.forEach((l, i) => {
    let body = l;
    if (optIdx.includes(i)) body = l.replace(OPT_LINE, '');
    else if (i === keyLine) return;
    for (const r of STRAY) if (r.test(body)) e(`explanation dòng ${i + 1} nhắc nhãn đáp án ngoài vị trí cho phép: "${body.match(r)[0]}"`);
  });
  return errs;
}

function keyText(answers) {
  const ls = answers.filter(a => a.isCorrect).map(a => a.answerLabel);
  if (ls.length <= 1) return ls.join('');
  return ls.slice(0, -1).join(', ') + ' và ' + ls[ls.length - 1];
}

// Sắp lại đáp án theo perm (perm[newIdx] = oldIdx) và viết lại explanation.
function permute(q, perm) {
  const answers = perm.map((oi, ni) => ({ answerLabel: LABELS[ni], answerText: q.answers[oi].answerText, isCorrect: q.answers[oi].isCorrect }));
  const lines = q.explanation.split('\n');
  const optIdx = [];
  lines.forEach((l, i) => { if (OPT_LINE.test(l)) optIdx.push(i); });
  const oldOpt = optIdx.map(i => lines[i]);
  perm.forEach((oi, ni) => { lines[optIdx[ni]] = oldOpt[oi].replace(/^\([A-J]\)/, `(${LABELS[ni]})`); });
  const k = lines.findIndex(l => l.startsWith('Đáp án đúng: '));
  lines[k] = 'Đáp án đúng: ' + keyText(answers);
  return Object.assign({}, q, { answers, explanation: lines.join('\n') });
}

module.exports = { OUT, LABELS, loadTag, check, permute, keyText };
