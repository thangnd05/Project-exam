import { useCallback, useEffect, useMemo, useState } from 'react';
import { isListeningStep, passageHasAudio } from './passageUtils';

export function useExamFlowNavigation({ visibleParts, layoutConfig }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [maxStepIndex, setMaxStepIndex] = useState(0);

  const isPaged = (layoutConfig?.questionArea?.navigationMode || 'scroll') === 'paged';

  const allQuestions = useMemo(
    () =>
      visibleParts.reduce((acc, part) => {
        const groupedQuestions = (part.questionGroups || []).reduce(
          (gAcc, group) => [...gAcc, ...(group.questions || [])],
          [],
        );
        return [...acc, ...groupedQuestions];
      }, []) || [],
    [visibleParts],
  );

  const questionIndexMap = useMemo(() => {
    const map = {};
    allQuestions.forEach((q, index) => {
      map[q.questionId] = index + 1;
    });
    return map;
  }, [allQuestions]);

  const flowSteps = useMemo(() => {
    const steps = [];
    visibleParts.forEach((part) => {
      (part.questionGroups || []).forEach((group, gi) => {
        const passage = group.passage || null;
        const pType = (passage?.passageType ?? passage?.passage_type ?? '').toUpperCase();
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
          questions: group.questions || [],
        });
      });
    });
    return steps;
  }, [visibleParts]);

  const questionStepIndex = useMemo(() => {
    const map = {};
    flowSteps.forEach((s, i) =>
      (s.questions || []).forEach((q) => {
        map[q.questionId] = i;
      }),
    );
    return map;
  }, [flowSteps]);

  useEffect(() => {
    if (flowSteps.length === 0) return;
    setCurrentStepIndex((i) => Math.max(0, Math.min(i, flowSteps.length - 1)));
  }, [flowSteps.length]);

  useEffect(() => {
    setMaxStepIndex((m) => Math.max(m, currentStepIndex));
  }, [currentStepIndex]);

  const listeningGateBefore = useMemo(() => {
    const arr = new Array(flowSteps.length).fill(-1);
    let last = -1;
    for (let i = 0; i < flowSteps.length; i += 1) {
      arr[i] = last;
      if (isListeningStep(flowSteps[i])) last = i;
    }
    return arr;
  }, [flowSteps]);

  const canGoToStep = useCallback(
    (target) => {
      if (target < 0 || target >= flowSteps.length) return false;
      if (isListeningStep(flowSteps[target])) return target === currentStepIndex;
      return maxStepIndex > listeningGateBefore[target];
    },
    [flowSteps, maxStepIndex, currentStepIndex, listeningGateBefore],
  );

  const goToStep = useCallback(
    (target) => {
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
    (questionId) => {
      const idx = questionStepIndex[questionId];
      if (idx == null) return;
      goToStep(idx);
    },
    [questionStepIndex, goToStep],
  );

  const canNavigateToQuestion = useCallback(
    (questionId) => {
      const idx = questionStepIndex[questionId];
      if (idx == null) return false;
      return canGoToStep(idx);
    },
    [questionStepIndex, canGoToStep],
  );

  const canGoPrev =
    isPaged && currentStepIndex > 0 && !isListeningStep(flowSteps[currentStepIndex - 1]);

  const restoreStepState = useCallback((savedStep, savedMax) => {
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
