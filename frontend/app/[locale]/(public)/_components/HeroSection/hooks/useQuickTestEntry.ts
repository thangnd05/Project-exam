'use client';

import {useCallback, useMemo, useState} from 'react';
import {useLocalizeHref, useRouter} from '@/app/i18n/navigation';

import routes from '@/app/configs/Routes';
import type {QuickChallengeCardResponse} from '@/app/types/test';
import {useQuickChallengeTests} from './useQuickChallengeTests';
import {useQuickTestLauncher} from './useQuickTestLauncher';

// Nút "làm bài kiểm tra nhanh" chung (hero, orbit, bảng xếp hạng): mở thẳng hộp xác nhận
// với đề đầu tiên, trong hộp có ô đổi kỳ thi; chưa có đề nào thì sang kho kỳ thi.
export function useQuickTestEntry() {
  const router = useRouter();
  const localizeHref = useLocalizeHref();
  const {quickTests, isLoading} = useQuickChallengeTests();
  const launcher = useQuickTestLauncher();
  const [waiting, setWaiting] = useState(false);

  const tests = useMemo(
    () =>
      [...quickTests].sort((a, b) => {
        const byExam = (a.examTypeName || '').localeCompare(b.examTypeName || '', 'vi');
        if (byExam !== 0) return byExam;
        return (a.title || '').localeCompare(b.title || '', 'vi');
      }),
    [quickTests],
  );

  const {requestStart, closeConfirm, confirmStart, startSyllabusPlan} = launcher;

  const openQuick = useCallback(() => {
    if (tests.length > 0) {
      requestStart(tests[0]);
      return;
    }
    // Bấm lúc danh sách còn đang tải: hộp tự mở khi có đề đầu tiên.
    if (isLoading) {
      setWaiting(true);
      return;
    }
    router.push(localizeHref(routes.examTypes));
  }, [tests, isLoading, requestStart, router, localizeHref]);

  const pendingTest = launcher.pendingTest ?? (waiting && tests.length > 0 ? tests[0] : null);

  const close = useCallback(() => {
    setWaiting(false);
    closeConfirm();
  }, [closeConfirm]);

  const confirm = useCallback(
    (test: QuickChallengeCardResponse) => {
      setWaiting(false);
      confirmStart(test);
    },
    [confirmStart],
  );

  const startPlan = useCallback(
    (test: QuickChallengeCardResponse) => {
      setWaiting(false);
      return startSyllabusPlan(test);
    },
    [startSyllabusPlan],
  );

  return {
    openQuick,
    // Props dựng sẵn cho QuickTestConfirmModal.
    confirmProps: {
      show: Boolean(pendingTest),
      test: pendingTest,
      tests,
      onChangeTest: requestStart,
      onClose: close,
      onConfirm: confirm,
      onStartSyllabusPlan: startPlan,
      isGuest: launcher.isGuest,
    },
  };
}
