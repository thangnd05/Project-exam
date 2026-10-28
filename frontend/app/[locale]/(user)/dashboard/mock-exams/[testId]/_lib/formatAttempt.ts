// Thời gian làm bài dạng đồng hồ: 5:07, 1:02:09.
export const formatDuration = (seconds: number | null | undefined) => {
  if (seconds == null) return '—';
  const sec = Math.max(0, Math.floor(Number(seconds)));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
};

export const formatScore = (score: number | null | undefined) => {
  if (score == null) return '—';
  return Number.isInteger(score) ? String(score) : score.toFixed(1);
};
