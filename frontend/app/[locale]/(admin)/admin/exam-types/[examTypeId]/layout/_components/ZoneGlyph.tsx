import { ZONES } from '@/app/features/exam-layout/layoutSchema';

// Sơ đồ thu nhỏ màn hình phòng thi, tô đậm vị trí của vùng để người chỉnh biết vùng đó nằm đâu.
const AREAS: Record<string, { x: number; y: number; w: number; h: number }> = {
  [ZONES.TOP]: { x: 1, y: 1, w: 34, h: 5 },
  [ZONES.TOOLBAR]: { x: 10, y: 7, w: 16, h: 3 },
  [ZONES.LEFT]: { x: 1, y: 7, w: 8, h: 18 },
  [ZONES.RIGHT]: { x: 27, y: 7, w: 8, h: 18 },
  [ZONES.BOTTOM]: { x: 10, y: 21, w: 16, h: 4 },
};

function ZoneGlyph({ zone }: { zone: string }) {
  const fill = (key: string) => (key === zone ? 'var(--primary)' : 'var(--slate-200)');
  return (
    <svg width="36" height="26" viewBox="0 0 36 26" aria-hidden focusable="false">
      <rect x="0.5" y="0.5" width="35" height="25" rx="2" fill="var(--bg-white)" stroke="var(--slate-300)" />
      <rect x="10" y="11" width="16" height="9" rx="1" fill="var(--slate-100)" />
      {Object.entries(AREAS).map(([key, a]) => (
        <rect key={key} x={a.x} y={a.y} width={a.w} height={a.h} rx="1" fill={fill(key)} />
      ))}
      <circle
        cx="30.5"
        cy="21"
        r="2.5"
        fill={zone === ZONES.FLOAT ? 'var(--primary)' : 'var(--slate-300)'}
        stroke="var(--bg-white)"
      />
    </svg>
  );
}

export default ZoneGlyph;
