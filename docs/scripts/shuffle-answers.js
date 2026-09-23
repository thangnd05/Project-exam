#!/usr/bin/env node
/**
 * Xáo thứ tự đáp án trong file JSON import câu hỏi để đáp án đúng rải đều A/B/C/D...
 * Đồng thời đổi nhãn trong explanation: các dòng "(X) ĐÚNG/SAI: ..." và dòng "Đáp án đúng: ...".
 *
 * Cách dùng:
 *   node docs/scripts/shuffle-answers.js <file-or-dir> [...]          # ghi đè file
 *   node docs/scripts/shuffle-answers.js --check <file-or-dir> [...]  # chỉ thống kê + kiểm tra
 */
const fs = require('fs');
const path = require('path');

const LABELS = 'ABCDEFGHIJ';
const OPTION_LINE = /^\(([A-J])\) /;
const ANSWER_LINE = /^Đáp án đúng: /;

function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(str) {
  let h = 2166136261;
  for (const ch of str) h = Math.imul(h ^ ch.codePointAt(0), 16777619);
  return h >>> 0;
}

function shuffle(arr, rand) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Túi vị trí theo số lượng đáp án: rút hết một lượt mới trộn lại, nên mỗi vị trí xuất hiện đều nhau. */
function createPositionBag(rand) {
  const bags = new Map();
  return (size, exclude) => {
    let bag = bags.get(size);
    for (let tries = 0; tries < size * 4; tries++) {
      if (!bag || bag.length === 0) {
        bag = shuffle([...Array(size).keys()], rand);
        bags.set(size, bag);
      }
      const idx = bag.findIndex((p) => !exclude.has(p));
      if (idx !== -1) return bag.splice(idx, 1)[0];
      bag = null;
    }
    throw new Error('Không chọn được vị trí');
  };
}

function formatAnswerLine(original, labels) {
  const body = original.replace(ANSWER_LINE, '');
  if (labels.length === 1) return `Đáp án đúng: ${labels[0]}`;
  if (body.includes(' và ') && labels.length === 2) return `Đáp án đúng: ${labels.join(' và ')}`;
  return `Đáp án đúng: ${labels.join(', ')}`;
}

function validate(q, where) {
  const errors = [];
  const labels = q.answers.map((a) => a.answerLabel);
  if (labels.join('') !== LABELS.slice(0, labels.length)) errors.push(`nhãn không liên tục: ${labels.join('')}`);
  const lines = q.explanation.split('\n');
  const optLabels = lines.filter((l) => OPTION_LINE.test(l)).map((l) => l[1]);
  if (optLabels.join('') !== labels.join('')) errors.push(`dòng (X) trong explanation: ${optLabels.join('')}`);
  for (const a of q.answers) {
    const line = lines.find((l) => l.startsWith(`(${a.answerLabel}) `));
    if (line && line.startsWith(`(${a.answerLabel}) ĐÚNG`) !== a.isCorrect) {
      errors.push(`(${a.answerLabel}) ĐÚNG/SAI lệch isCorrect`);
    }
  }
  const correct = q.answers.filter((a) => a.isCorrect).map((a) => a.answerLabel).join('');
  const ansLine = lines.find((l) => ANSWER_LINE.test(l));
  if (!ansLine || ansLine.replace(ANSWER_LINE, '').replace(/[^A-J]/g, '') !== correct) {
    errors.push(`"${ansLine}" lệch đáp án đúng ${correct}`);
  }
  return errors.map((e) => `${where}: ${e}`);
}

function shuffleQuestion(q, rand, pickPosition) {
  const n = q.answers.length;
  const correct = q.answers.filter((a) => a.isCorrect);
  const wrong = shuffle(q.answers.filter((a) => !a.isCorrect), rand);

  const slots = new Array(n);
  const used = new Set();
  for (const a of shuffle([...correct], rand)) {
    const pos = pickPosition(n, used);
    used.add(pos);
    slots[pos] = a;
  }
  for (let i = 0; i < n; i++) if (!slots[i]) slots[i] = wrong.shift();

  const labelMap = new Map(slots.map((a, i) => [a.answerLabel, LABELS[i]]));
  const answers = slots.map((a, i) => ({ ...a, answerLabel: LABELS[i] }));

  const lines = q.explanation.split('\n');
  const optIdx = [];
  const optLines = [];
  lines.forEach((l, i) => {
    const m = l.match(OPTION_LINE);
    if (m) {
      optIdx.push(i);
      optLines.push(`(${labelMap.get(m[1])}) ${l.slice(m[0].length)}`);
    }
  });
  optLines.sort((a, b) => a[1].localeCompare(b[1]));
  optIdx.forEach((lineIdx, k) => (lines[lineIdx] = optLines[k]));

  const correctLabels = answers.filter((a) => a.isCorrect).map((a) => a.answerLabel);
  const ansIdx = lines.findIndex((l) => ANSWER_LINE.test(l));
  lines[ansIdx] = formatAnswerLine(lines[ansIdx], correctLabels);

  return { ...q, answers, explanation: lines.join('\n') };
}

function stats(questions) {
  const pos = {};
  let longest = 0;
  for (const q of questions) {
    const correct = q.answers.filter((a) => a.isCorrect);
    correct.forEach((a) => (pos[a.answerLabel] = (pos[a.answerLabel] || 0) + 1));
    const len = (a) => a.answerText.length;
    const max = Math.max(...q.answers.map(len));
    if (correct.length === 1 && len(correct[0]) === max) longest++;
  }
  const sorted = Object.fromEntries(Object.entries(pos).sort());
  return `vị trí đúng ${JSON.stringify(sorted)} | đáp án đúng dài nhất ${Math.round((100 * longest) / questions.length)}%`;
}

const isPrimitive = (v) => v === null || typeof v !== 'object';

/** Kiểu gọn của các file đề: mảng/object chỉ chứa giá trị nguyên thủy được viết trên một dòng. */
function stringifyCompact(value, indent = '') {
  const inner = indent + '  ';
  if (Array.isArray(value)) {
    if (value.every(isPrimitive)) return `[${value.map((v) => JSON.stringify(v)).join(', ')}]`;
    return `[\n${value.map((v) => inner + stringifyCompact(v, inner)).join(',\n')}\n${indent}]`;
  }
  if (!isPrimitive(value)) {
    const entries = Object.entries(value);
    if (indent && entries.every(([, v]) => isPrimitive(v))) {
      return `{ ${entries.map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(', ')} }`;
    }
    return `{\n${entries.map(([k, v]) => `${inner}${JSON.stringify(k)}: ${stringifyCompact(v, inner)}`).join(',\n')}\n${indent}}`;
  }
  return JSON.stringify(value);
}

/** Chọn cách ghi giống hệt file gốc để diff chỉ chứa thay đổi thật. */
function detectFormatter(raw, data) {
  const candidates = [(d) => JSON.stringify(d, null, 2), (d) => stringifyCompact(d)];
  for (const fmt of candidates) {
    const out = fmt(data);
    if (raw === out + '\n') return (d) => fmt(d) + '\n';
    if (raw === out) return fmt;
  }
  return (d) => JSON.stringify(d, null, 2) + '\n';
}

function collectFiles(target) {
  const stat = fs.statSync(target);
  if (stat.isFile()) return [target];
  return fs
    .readdirSync(target)
    .flatMap((name) => collectFiles(path.join(target, name)))
    .filter((f) => f.endsWith('.json'));
}

function main() {
  const args = process.argv.slice(2);
  const checkOnly = args.includes('--check');
  const targets = args.filter((a) => a !== '--check');
  if (targets.length === 0) {
    console.error('Cách dùng: node shuffle-answers.js [--check] <file-or-dir> [...]');
    process.exit(1);
  }

  let failed = false;
  for (const file of targets.flatMap(collectFiles)) {
    const raw = fs.readFileSync(file, 'utf8');
    const data = JSON.parse(raw);
    if (!Array.isArray(data.questions)) continue;

    const before = data.questions.flatMap((q) => validate(q, `${file}#${q.questionNumber}`));
    if (before.length) {
      console.error(`BỎ QUA ${file}, dữ liệu gốc không nhất quán:\n  ${before.join('\n  ')}`);
      failed = true;
      continue;
    }
    if (checkOnly) {
      console.log(`${file}: ${stats(data.questions)}`);
      continue;
    }

    const rand = mulberry32(hash(path.basename(file) + data.questions.length));
    const pickPosition = createPositionBag(rand);
    const questions = data.questions.map((q) => shuffleQuestion(q, rand, pickPosition));

    const after = questions.flatMap((q) => validate(q, `${file}#${q.questionNumber}`));
    if (after.length) {
      console.error(`LỖI ${file}, không ghi file:\n  ${after.join('\n  ')}`);
      failed = true;
      continue;
    }

    fs.writeFileSync(file, detectFormatter(raw, data)({ ...data, questions }), 'utf8');
    console.log(`${file}: ${stats(questions)}`);
  }
  process.exit(failed ? 1 : 0);
}

main();
