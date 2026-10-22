'use client';

import { useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';

import {
  getScoreScale,
  scoreToPercent,
  type ScoreScaleSource,
} from '@/app/features/exam-types/scoreScale';

type ExamTypeLike = ScoreScaleSource & { examTypeId: string | number };
type ExamPartLike = {
  examPartId: string;
  name?: string | null;
  defaultNumQuestions?: number | null;
  skillId?: string;
};
type SkillLike = { skillId: string; name?: string | null };
// Khớp ScoringConversionResponse (các trường đều optional) — thiếu số liệu thì coi như 0.
type ConversionLike = {
  examTypeId?: string | number;
  skillId?: string;
  numCorrect?: number;
  convertedScore?: number;
};

export type ScoreEstimate = {
  totalScore: number;
  scaled?: boolean;
  totalCorrect?: number;
  totalQuestions?: number;
  skillDetails: Array<{ skillName: string; numCorrect: number; convertedScore: number }>;
};

export const percentToNum = (percent: number | string, total: number): number =>
  total > 0 ? Math.round((Number(percent) * total) / 100) : 0;
export const numToPercent = (num: number | string, total: number): number =>
  total > 0 ? Math.round((Number(num) / total) * 100) : 0;

export default function useMilestoneScoring<TExamType extends ExamTypeLike = ExamTypeLike>({
  examTypes = [],
  examParts = [],
  skills = [],
  scoringConversions = [],
  selectedExamTypeId = '',
}: {
  examTypes?: TExamType[];
  examParts?: ExamPartLike[];
  skills?: SkillLike[];
  scoringConversions?: ConversionLike[];
  selectedExamTypeId?: string | number;
}) {
  const t = useTranslations('MyTarget');

  const selectedExamType = useMemo(
    () => examTypes.find((t) => String(t.examTypeId) === String(selectedExamTypeId)),
    [examTypes, selectedExamTypeId],
  );
  const scoringMethod = (selectedExamType?.scoringMethod || 'DEFAULT').toUpperCase();
  const scale = useMemo(() => getScoreScale(selectedExamType), [selectedExamType]);
  const isScaled = scale.scaled;
  const maxScore = scale.max;
  const SCALE_MIN = scale.min;
  const SCALE_MAX = scale.max;
  const SCALE_SPAN = SCALE_MAX - SCALE_MIN;

  const getPartTotal = useCallback(
    (examPartId: string) =>
      examParts.find((p) => p.examPartId === examPartId)?.defaultNumQuestions || 0,
    [examParts],
  );
  const getPartName = useCallback(
    (examPartId: string) => examParts.find((p) => p.examPartId === examPartId)?.name || examPartId,
    [examParts],
  );

  const evenPctForScore = useCallback(
    (score: number | string) => scoreToPercent(score, scale),
    [scale],
  );

  const estimateScore = useCallback(
    (
      partsConfig: Record<string, number | string> | null | undefined,
      examTypeId: string | number = selectedExamTypeId,
    ): ScoreEstimate | null => {
      if (!examTypeId || !partsConfig || Object.keys(partsConfig).length === 0) return null;

      if (isScaled) {
        let totalCorrect = 0;
        let totalQuestions = 0;
        for (const [examPartId, pct] of Object.entries(partsConfig)) {
          const part = examParts.find((p) => p.examPartId === examPartId);
          const tot = part?.defaultNumQuestions || 0;
          totalCorrect += percentToNum(pct, tot);
          totalQuestions += tot;
        }
        const totalScore = totalQuestions > 0
          ? Math.max(SCALE_MIN, Math.min(SCALE_MAX, SCALE_MIN + Math.round((totalCorrect / totalQuestions) * SCALE_SPAN)))
          : SCALE_MIN;
        return { totalScore, scaled: true, totalCorrect, totalQuestions, skillDetails: [] };
      }

      const correctBySkill: Record<string, number> = {};
      for (const [examPartId, pct] of Object.entries(partsConfig)) {
        const part = examParts.find((p) => p.examPartId === examPartId);
        if (!part) continue;
        const numCorrect = percentToNum(pct, part.defaultNumQuestions || 0);
        const skillKey = String(part.skillId);
        correctBySkill[skillKey] = (correctBySkill[skillKey] || 0) + numCorrect;
      }

      const relevantConversions = scoringConversions.filter((c) => c.examTypeId === examTypeId);
      if (relevantConversions.length === 0) return null;

      let totalScore = 0;
      const skillDetails: ScoreEstimate['skillDetails'] = [];
      for (const [skillId, numCorrect] of Object.entries(correctBySkill)) {
        const skillConversions = relevantConversions
          .filter((c) => c.skillId === skillId)
          .sort((a, b) => (a.numCorrect ?? 0) - (b.numCorrect ?? 0));
        if (skillConversions.length === 0) continue;

        let matched = skillConversions[0];
        for (const c of skillConversions) {
          if ((c.numCorrect ?? 0) <= numCorrect) matched = c;
          else break;
        }

        const skillName = skills.find((s) => s.skillId === skillId)?.name || skillId;
        const convertedScore = matched.convertedScore ?? 0;
        totalScore += convertedScore;
        skillDetails.push({ skillName, numCorrect, convertedScore });
      }

      return { totalScore, skillDetails };
    },
    [isScaled, SCALE_MIN, SCALE_MAX, SCALE_SPAN, examParts, scoringConversions, skills, selectedExamTypeId],
  );

  const formatEstimateDetail = useCallback(
    (est: ScoreEstimate | null | undefined): string => {
      if (!est) return '';
      return est.scaled
        ? t('scoring.scaledDetail', {
            correct: est.totalCorrect ?? 0,
            total: est.totalQuestions ?? 0,
            score: est.totalScore,
            min: SCALE_MIN,
            max: SCALE_MAX,
          })
        : (est.skillDetails || [])
            .map((s) => t('scoring.skillDetail', {
              skill: s.skillName,
              count: s.numCorrect,
              score: s.convertedScore,
            }))
            .join(' | ');
    },
    [SCALE_MIN, SCALE_MAX, t],
  );

  return {
    selectedExamType,
    scoringMethod,
    scale,
    isScaled,
    maxScore,
    SCALE_MIN,
    SCALE_SPAN,
    SCALE_MAX,
    getPartTotal,
    getPartName,
    percentToNum,
    numToPercent,
    evenPctForScore,
    estimateScore,
    formatEstimateDetail,
  };
}
