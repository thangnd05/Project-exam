/**
 * Thang điểm theo scoringMethod của loại đề. Nguồn DUY NHẤT cho mọi chỗ FE cần
 * biết min/max điểm (ô nhập mục tiêu, trục biểu đồ, gợi ý mục tiêu kế tiếp).
 * Trước đây mỗi nơi hardcode 990 nên loại đề AWS (100-1000) bị cắt ngọn.
 */

export type ScoreScale = {
  /** Điểm thấp nhất có thể đạt (AWS: sai hết vẫn được 100). */
  min: number;
  max: number;
  /** true = thang quy đổi có điểm sàn > 0 (AWS_SCALE). */
  scaled: boolean;
};

export const DEFAULT_SCORE_SCALE: ScoreScale = { min: 0, max: 990, scaled: false };
export const AWS_SCORE_SCALE: ScoreScale = { min: 100, max: 1000, scaled: true };

export function getScoreScale(scoringMethod?: string | null): ScoreScale {
  return (scoringMethod || '').toUpperCase() === 'AWS_SCALE'
    ? AWS_SCORE_SCALE
    : DEFAULT_SCORE_SCALE;
}

/** Quy điểm về % để so với các ngưỡng tính theo % (yêu cầu từng Part, độ sẵn sàng). */
export function scoreToPercent(score: number | string, scale: ScoreScale): number {
  const span = scale.max - scale.min;
  if (span <= 0) return 0;
  const pct = ((Number(score) - scale.min) / span) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

export function clampScore(score: number, scale: ScoreScale): number {
  return Math.max(scale.min, Math.min(scale.max, Math.round(score)));
}
