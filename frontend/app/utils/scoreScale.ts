

export type ScoreScale = {

  min: number;
  max: number;

  scaled: boolean;
};

export const DEFAULT_SCORE_SCALE: ScoreScale = { min: 0, max: 990, scaled: false };
export const AWS_SCORE_SCALE: ScoreScale = { min: 100, max: 1000, scaled: true };

export function getScoreScale(scoringMethod?: string | null): ScoreScale {
  return (scoringMethod || '').toUpperCase() === 'AWS_SCALE'
    ? AWS_SCORE_SCALE
    : DEFAULT_SCORE_SCALE;
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
