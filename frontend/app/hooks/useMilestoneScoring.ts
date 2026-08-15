'use client';

import { useCallback, useMemo } from 'react';

const SCALE_MIN = 100;
const SCALE_SPAN = 900;
const SCALE_MAX = SCALE_MIN + SCALE_SPAN;
const DEFAULT_MAX_SCORE = 990;

type ExamTypeLike = { examTypeId: string | number; scoringMethod?: string | null; [key: string]: any };
type ExamPartLike = {
  examPartId: string;
  name?: string | null;
  defaultNumQuestions?: number | null;
  skillId?: string;
  [key: string]: any;
};
type SkillLike = { skillId: string; name?: string | null; [key: string]: any };
type ConversionLike = {
  examTypeId: string | number;
  skillId: string;
  numCorrect: number;
  convertedScore: number;
  [key: string]: any;
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

export default function useMilestoneScoring({
  examTypes = [],
  examParts = [],
  skills = [],
  scoringConversions = [],
  selectedExamTypeId = '',
}: {
  examTypes?: ExamTypeLike[];
  examParts?: ExamPartLike[];
  skills?: SkillLike[];
  scoringConversions?: ConversionLike[];
  selectedExamTypeId?: string | number;
}) {

  const selectedExamType = useMemo(
    () => examTypes.find((t) => String(t.examTypeId) === String(selectedExamTypeId)),
    [examTypes, selectedExamTypeId],
  );
  const scoringMethod = (selectedExamType?.scoringMethod || 'DEFAULT').toUpperCase();
  const isScaled = scoringMethod === 'AWS_SCALE';
  const maxScore = isScaled ? SCALE_MAX : DEFAULT_MAX_SCORE;

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
    (score: number | string) =>
      isScaled
        ? Math.max(0, Math.min(100, Math.round(((Number(score) - SCALE_MIN) / SCALE_SPAN) * 100)))
        : Math.min(100, Math.round((Number(score) / DEFAULT_MAX_SCORE) * 100)),
    [isScaled],
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
          .sort((a, b) => a.numCorrect - b.numCorrect);
        if (skillConversions.length === 0) continue;

        let matched = skillConversions[0];
        for (const c of skillConversions) {
          if (c.numCorrect <= numCorrect) matched = c;
          else break;
        }

        const skillName = skills.find((s) => s.skillId === skillId)?.name || skillId;
        totalScore += matched.convertedScore;
        skillDetails.push({ skillName, numCorrect, convertedScore: matched.convertedScore });
      }

      return { totalScore, skillDetails };
    },
    [isScaled, examParts, scoringConversions, skills, selectedExamTypeId],
  );

  const formatEstimateDetail = useCallback(
    (est: ScoreEstimate | null | undefined): string => {
      if (!est) return '';
      return est.scaled
        ? `Tổng ${est.totalCorrect}/${est.totalQuestions} câu đúng → ${est.totalScore} điểm (thang ${SCALE_MIN}–${SCALE_MAX})`
        : (est.skillDetails || [])
            .map((s) => `${s.skillName}: ${s.numCorrect} câu → ${s.convertedScore} điểm`)
            .join(' | ');
    },
    [],
  );

  return {
    selectedExamType,
    scoringMethod,
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
