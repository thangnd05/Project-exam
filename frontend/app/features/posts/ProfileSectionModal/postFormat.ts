export const formatDate = (value: string | null | undefined, locale: string) => {
  if (!value) return '--';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '--';
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
};

export const formatCount = (n: unknown) => {
  const v = Number(n) || 0;
  if (v >= 1000) return `${(v / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(v);
};
