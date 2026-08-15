'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { createTest, addRandomQuestionsToPart, addQuestionsToPart } from '~/shared/api/testApi';
import { createTestPart } from '~/shared/api/testPartApi';
import { getExamCategories } from '~/shared/api/examCategoryApi';
import { useAuth } from '~/shared/hooks/useAuth';
import { PERMISSIONS } from '~/shared/config/permissions';
import { fromDateTimeLocalInput } from '~/shared/utils/format-date-time';
import { SELECTION_MODES } from '~/features/tests/hooks/useBankTestBuilder';

const emptyTestInfo = () => ({
  title: '',
  description: '',
  durationMinutes: '',
  maxAttempts: '',
  examTypeId: '',
  examCategoryId: '',
  bannerUrl: '',
  availableFrom: '',
  availableTo: '',
  costCoins: '',
});

export function useExamCategories() {
  const { permissions } = useAuth();
  const [examCategories, setExamCategories] = useState([]);

  useEffect(() => {
    getExamCategories()
      .then((list) => setExamCategories(Array.isArray(list) ? list : []))
      .catch(() => setExamCategories([]));
  }, []);

  /*
    Nhóm đề có cấp chứng chỉ chỉ dành cho người quản trị đề. Backend cũng bỏ qua nếu người
    dùng thường gửi lên, ẩn luôn ở đây để không ai chọn rồi thắc mắc sao lưu xong lại mất.
  */
  const canPickCertificateCategory =
    Array.isArray(permissions) && permissions.includes(PERMISSIONS.TEST_MANAGE);

  return useMemo(
    () =>
      examCategories.filter(
        (category) => canPickCertificateCategory || !category.certificateEligible,
      ),
    [examCategories, canPickCertificateCategory],
  );
}

export function useCreateTestFromBank({
  testInfo,
  setTestInfo,
  partConfigs,
  getPartEffectiveCount,
  setNotification,
}) {
  return useMutation({
    mutationFn: async (partsToAdd) => {
      const testData = await createTest({
        title: testInfo.title.trim(),
        description: testInfo.description || null,
        examTypeId: testInfo.examTypeId,
        examCategoryId: testInfo.examCategoryId || null,
        durationMinutes:
          testInfo.durationMinutes && Number(testInfo.durationMinutes) > 0
            ? Number(testInfo.durationMinutes)
            : null,
        maxAttempts:
          testInfo.maxAttempts && Number(testInfo.maxAttempts) > 0
            ? Number(testInfo.maxAttempts)
            : null,
        bannerUrl: testInfo.bannerUrl || null,
        availableFrom: fromDateTimeLocalInput(testInfo.availableFrom),
        availableTo: fromDateTimeLocalInput(testInfo.availableTo),
        classId: null,
        chapterId: null,
        costCoins:
          testInfo.costCoins && Number(testInfo.costCoins) > 0
            ? Number(testInfo.costCoins)
            : null,
      });

      const newTestId = testData.testId ?? testData.id;
      if (!newTestId) throw new Error('Không nhận được testId từ server.');

      for (const part of partsToAdd) {
        const cfg = partConfigs[part.examPartId];
        const numQuestions = getPartEffectiveCount(part.examPartId);
        if (numQuestions <= 0) continue;

        const partData = await createTestPart({
          testId: String(newTestId),
          examPartId: String(part.examPartId),
          numQuestions,
        });
        const newPartId = partData.testPartId ?? partData.id;
        if (!newPartId) throw new Error(`Không nhận được testPartId cho part ${part.name}.`);

        if (cfg.mode === SELECTION_MODES.RANDOM || cfg.mode === SELECTION_MODES.SEQUENTIAL) {
          await addRandomQuestionsToPart({
            testPartId: String(newPartId),
            count: numQuestions,
            isSequential: cfg.mode === SELECTION_MODES.SEQUENTIAL,
            fromIndex:
              cfg.mode === SELECTION_MODES.SEQUENTIAL ? parseInt(cfg.fromIndex, 10) : undefined,
            toIndex:
              cfg.mode === SELECTION_MODES.SEQUENTIAL ? parseInt(cfg.toIndex, 10) : undefined,
          });
        } else {
          await addQuestionsToPart({
            testPartId: String(newPartId),
            questionIds: (cfg.selectedIds || []).map(String),
          });
        }
      }
    },
    onSuccess: () => {
      setTestInfo((prev) => ({ ...prev, title: '', description: '' }));
      toast.success('Đã tạo đề thi từ kho câu hỏi!');
    },
    onError: (error) => {
      const msg = error.response?.data?.message ?? error.response?.data ?? error.message;
      setNotification({
        type: 'danger',
        message: 'Lỗi: ' + (typeof msg === 'string' ? msg : JSON.stringify(msg)),
      });
    },
  });
}

export { emptyTestInfo };
