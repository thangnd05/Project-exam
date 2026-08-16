export function formatCompactNumber(value: number | string | null | undefined): string {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) {
    return '0';
  }

  if (n < 10_000) {
    return Math.round(n).toLocaleString('vi-VN');
  }

  if (n < 1_000_000) {
    const k = n / 1_000;
    if (k >= 100) {
      return `${Math.round(k)}K`;
    }
    const oneDec = Math.floor(k * 10) / 10;
    return `${String(oneDec).replace('.', ',')}K`;
  }

  const m = n / 1_000_000;
  if (m >= 100) {
    return `${Math.round(m)}M`;
  }
  const oneDec = Math.floor(m * 10) / 10;
  return `${String(oneDec).replace('.', ',')}M`;
}

export function formatFullNumber(value: number | string | null | undefined): string {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return '0';
  }
  return Math.round(n).toLocaleString('vi-VN');
}
