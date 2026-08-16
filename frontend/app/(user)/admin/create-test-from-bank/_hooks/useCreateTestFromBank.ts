'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { createTest, addRandomQuestionsToPart, addQuestionsToPart } from '@/app/apis/testApi';
import { createTestPart } from '@/app/apis/testPartApi';
import { fromDateTimeLocalInput } from '@/app/utils/format-date-time';
import { SELECTION_MODES } from '@/app/hooks/useBankTestBuilder';
import type { PartConfigMap } from '@/app/hooks/useBankTestBuilder';
import type { CreateTestRequest } from '@/app/types';

export type BankTestInfo = {
  title: string;
  description: string;
  durationMinutes: string;
  maxAttempts: string;
  examTypeId: string;
  examCategoryId: string;
  bannerUrl: string;
  availableFrom: string;
  availableTo: string;
  costCoins: string;
};

const emptyTestInfo = (): BankTestInfo => ({
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

type NotificationState = { type?: string; message?: string };

type UseCreateTestFromBankParams = {
  testInfo: BankTestInfo;
  setTestInfo: React.Dispatch<React.SetStateAction<BankTestInfo>>;
  partConfigs: PartConfigMap;
  getPartEffectiveCount: (examPartId: string) => number;
  setNotification: (notification: NotificationState) => void;
};

type PartToAdd = { examPartId: string; name?: string };

export function useCreateTestFromBank({
  testInfo,
  setTestInfo,
  partConfigs,
  getPartEffectiveCount,
  setNotification,
}: UseCreateTestFromBankParams) {
  return useMutation({
    mutationFn: async (partsToAdd: PartToAdd[]) => {
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
      } as unknown as CreateTestRequest);

      const newTestId = testData.testId ?? (testData as any).id;
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
        const newPartId = partData.testPartId ?? (partData as any).id;
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
    onError: (error: any) => {
      const msg = error.response?.data?.message ?? error.response?.data ?? error.message;
      setNotification({
        type: 'danger',
        message: 'Lỗi: ' + (typeof msg === 'string' ? msg : JSON.stringify(msg)),
      });
    },
  });
}

export { emptyTestInfo };
