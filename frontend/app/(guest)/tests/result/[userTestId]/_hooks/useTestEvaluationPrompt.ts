'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createEvaluation, getEvaluationStatus } from '@/app/apis/evaluationApi';
import type { EvaluationRequest } from '@/app/types';

// Chờ một chút để người học thấy điểm trước khi bật popup.
const PROMPT_DELAY_MS = 1500;
const DISMISS_KEY_PREFIX = 'evaluation-dismissed:';

export const evaluationStatusKeys = {
  status: (testId?: string | null) => ['evaluation-status', testId] as const,
};

const isDismissed = (userTestId: string) => {
  try {
    return localStorage.getItem(DISMISS_KEY_PREFIX + userTestId) === '1';
  } catch {
    return false;
  }
};

const markDismissed = (userTestId: string) => {
  try {
    localStorage.setItem(DISMISS_KEY_PREFIX + userTestId, '1');
  } catch {
    // Không lưu được thì lần mở lại trang kết quả sẽ hỏi lại, chấp nhận được.
  }
};

/**
 * Popup đánh giá đề sau khi làm full: chỉ cho user đã đăng nhập, chưa đánh giá đề này,
 * và chưa bấm "Để sau" ở lượt làm hiện tại.
 */
export function useTestEvaluationPrompt({
  userTestId,
  testId,
  enabled,
}: {
  userTestId: string;
  testId: string | null;
  enabled: boolean;
}) {
  const qc = useQueryClient();
  const [show, setShow] = useState(false);

  const statusQuery = useQuery({
    queryKey: evaluationStatusKeys.status(testId),
    queryFn: () => getEvaluationStatus(testId as string),
    enabled: enabled && !!testId,
    staleTime: Infinity,
  });

  const shouldPrompt =
    enabled && !!testId && statusQuery.data?.evaluated === false && !isDismissed(userTestId);

  useEffect(() => {
    if (!shouldPrompt) return;
    const timer = setTimeout(() => setShow(true), PROMPT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [shouldPrompt]);

  const submitMutation = useMutation({
    mutationFn: (payload: Omit<EvaluationRequest, 'testId'>) =>
      createEvaluation({ ...payload, testId: testId as string }),
    onSuccess: () => {
      qc.setQueryData(evaluationStatusKeys.status(testId), { evaluated: true });
      setShow(false);
    },
  });

  const dismiss = () => {
    markDismissed(userTestId);
    setShow(false);
  };

  // Server báo đã đánh giá (409, ví dụ gửi từ tab khác): đóng và không hỏi lại.
  const markEvaluated = () => {
    qc.setQueryData(evaluationStatusKeys.status(testId), { evaluated: true });
    setShow(false);
  };

  return { show, dismiss, markEvaluated, submitMutation };
}
