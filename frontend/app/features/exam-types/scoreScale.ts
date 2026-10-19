export type ScoreScale = {

  min: number;
  max: number;

  // true: chấm tuyến tính theo tỉ lệ câu đúng; false: quy đổi theo bảng (TOEIC_SCALE).
  scaled: boolean;
};

// Thang điểm lấy từ exam type (scoreMin/scoreMax do admin cấu hình).
export type ScoreScaleSource = {
  scoringMethod?: string | null;
  scoreMin?: number | null;
  scoreMax?: number | null;
};

export function getScoreScale(source?: ScoreScaleSource | null): ScoreScale {
  return {
    min: source?.scoreMin ?? 0,
    max: source?.scoreMax ?? 100,
    scaled: (source?.scoringMethod || '').toUpperCase() !== 'TOEIC_SCALE',
  };
}

export function scoreToPercent(score: number | string, scale: ScoreScale): number {
  const span = scale.max - scale.min;
  if (span <= 0) return 0;
  const pct = ((Number(score) - scale.min) / span) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

export function clampScore(score: number, scale: ScoreScale): number {
  return Math.max(scale.min, Math.min(scale.max, Math.round(score)));
}
