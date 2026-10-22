'use client';

import { useCallback, useMemo, useState } from 'react';
import type {
  ExamFlowStep,
  ExamPart,
  ExamQuestion,
  QuestionIndexMap,
} from '@/app/features/exam-layout/examLayoutTypes';
import type { LayoutConfig } from '@/app/features/exam-layout/layoutSchema';
import { isListeningStep, passageHasAudio } from '@/app/(guest-exam)/tests/[testId]/start/_lib/passageUtils';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';

type UseExamFlowNavigationParams = {
  visibleParts: ExamPart[];
  layoutConfig?: LayoutConfig;
};

export function useExamFlowNavigation({
  visibleParts,
  layoutConfig,
}: UseExamFlowNavigationParams) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [maxStepIndex, setMaxStepIndex] = useState(0);

  const isPaged = (layoutConfig?.questionArea?.navigationMode || 'scroll') === 'paged';

  const allQuestions = useMemo<ExamQuestion[]>(
    () =>
      visibleParts.reduce<ExamQuestion[]>((acc, part) => {
        const groupedQuestions = (part.questionGroups || []).reduce<ExamQuestion[]>(
          (gAcc, group) => [...gAcc, ...(group.questions || [])],
          [],
        );
        return [...acc, ...groupedQuestions];
      }, []) || [],
    [visibleParts],
  );

  const questionIndexMap = useMemo<QuestionIndexMap>(() => {
    const map: QuestionIndexMap = {};
    allQuestions.forEach((q, index) => {
      map[q.questionId] = index + 1;
    });
    return map;
  }, [allQuestions]);

  const flowSteps = useMemo<ExamFlowStep[]>(() => {
    const steps: ExamFlowStep[] = [];
    visibleParts.forEach((part) => {
      (part.questionGroups || []).forEach((group, gi) => {
        const passage = group.passage || null;
        // API cũ có thể trả passage_type (snake_case).
        const loosePassage = passage as { passageType?: string; passage_type?: string } | null;
        const pType = (loosePassage?.passageType ?? loosePassage?.passage_type ?? '').toUpperCase();
        const sectionType =
          pType === 'LISTENING' ? 'LISTENING' : pType === 'READING' ? 'READING' : null;

        const audioGated = sectionType === 'LISTENING' && passageHasAudio(passage);
        steps.push({
          key:
            passage?.passageId ||
            group.questions?.[0]?.questionId ||
            `${part.testPartId}-${gi}`,
          partId: part.testPartId,
          partName: part.partName || '',
          sectionType,
          audioGated,
          passage,
          questions: group.questions || EMPTY_LIST,
        });
      });
    });
    return steps;
  }, [visibleParts]);

  const questionStepIndex = useMemo(() => {
    const map: Record<string, number> = {};
    flowSteps.forEach((s, i) =>
      (s.questions || []).forEach((q) => {
        map[q.questionId] = i;
      }),
    );
    return map;
  }, [flowSteps]);

  // Số bước đổi (vd. vừa tải xong đề): kẹp bước hiện tại về khoảng hợp lệ.
  const [prevStepCount, setPrevStepCount] = useState(flowSteps.length);
  if (flowSteps.length !== prevStepCount) {
    setPrevStepCount(flowSteps.length);
    if (flowSteps.length > 0) {
      setCurrentStepIndex((i) => Math.max(0, Math.min(i, flowSteps.length - 1)));
    }
  }

  if (currentStepIndex > maxStepIndex) setMaxStepIndex(currentStepIndex);

  const listeningGateBefore = useMemo(() => {
    const arr: number[] = new Array(flowSteps.length).fill(-1);
    let last = -1;
    for (let i = 0; i < flowSteps.length; i += 1) {
      arr[i] = last;
      if (isListeningStep(flowSteps[i])) last = i;
    }
    return arr;
  }, [flowSteps]);

  const canGoToStep = useCallback(
    (target: number) => {
      if (target < 0 || target >= flowSteps.length) return false;
      if (isListeningStep(flowSteps[target])) return target === currentStepIndex;
      return maxStepIndex > listeningGateBefore[target];
    },
    [flowSteps, maxStepIndex, currentStepIndex, listeningGateBefore],
  );

  const goToStep = useCallback(
    (target: number) => {
      const t = Math.max(0, Math.min(target, flowSteps.length - 1));
      if (!canGoToStep(t)) return;
      setCurrentStepIndex(t);
    },
    [canGoToStep, flowSteps.length],
  );

  const goNext = useCallback(() => {
    setCurrentStepIndex((prev) => Math.min(prev + 1, flowSteps.length - 1));
  }, [flowSteps.length]);

  const goPrev = useCallback(() => {
    setCurrentStepIndex((prev) => {
      const target = prev - 1;
      if (target < 0) return prev;
      if (isListeningStep(flowSteps[target])) return prev;
      return target;
    });
  }, [flowSteps]);

  const goToQuestion = useCallback(
    (questionId: string) => {
      const idx = questionStepIndex[questionId];
      if (idx == null) return;
      goToStep(idx);
    },
    [questionStepIndex, goToStep],
  );

  const canNavigateToQuestion = useCallback(
    (questionId: string) => {
      const idx = questionStepIndex[questionId];
      if (idx == null) return false;
      return canGoToStep(idx);
    },
    [questionStepIndex, canGoToStep],
  );

  const canGoPrev =
    isPaged && currentStepIndex > 0 && !isListeningStep(flowSteps[currentStepIndex - 1]);

  const restoreStepState = useCallback((savedStep: number, savedMax: number) => {
    setCurrentStepIndex(savedStep);
    setMaxStepIndex(Math.max(savedStep, savedMax));
  }, []);

  return {
    isPaged,
    allQuestions,
    questionIndexMap,
    flowSteps,
    currentStepIndex,
    maxStepIndex,
    canGoPrev,
    goNext,
    goPrev,
    goToStep,
    goToQuestion,
    canNavigateToQuestion,
    restoreStepState,
  };
}
