'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fromDateTimeLocalInput } from '@/app/utils/format-date-time';
import { createTest } from '@/app/apis/testApi';
import { createTestPart } from '@/app/apis/testPartApi';
import {
  createAndAttachDocument,
  createAndAttach,
  bulkCreateQuestions,
  bulkCreateQuestionGroups,
} from '@/app/apis/questionApi';
import { toast } from 'react-toastify';
import { CREATOR_TYPES } from '@/app/hooks/useCreateTest';
import type {
  CreatorNotification,
  CreatorType,
  DraftGroup,
  DraftQuestion,
  TestInfoForm,
} from '@/app/hooks/useCreateTest';
import type { CreateTestRequest } from '@/app/types';

const TOAST_VALIDATION_MS = 8000;

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_REQUEST_SIZE_BYTES = 50 * 1024 * 1024;

const formatMB = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)}MB`;

export interface UseTestSubmissionOptions {
  mode?: string;
  classId?: string | null;
  chapterId?: string | null;
  testInfo: TestInfoForm;
  questions: DraftQuestion[];
  groups: DraftGroup[];
  documentFile: File | null;
  setQuestions: (questions: DraftQuestion[]) => void;
  setGroups: (groups: DraftGroup[]) => void;
  setDocumentFile: (file: File | null) => void;
  setNotification: (notification: CreatorNotification) => void;
  emptyQuestion: DraftQuestion;
  createInitialGroup: () => DraftGroup;
}

export const useTestSubmission = ({
    mode,
    classId,
    chapterId,
    testInfo,
    questions,
    groups,
    documentFile,
    setQuestions,
    setGroups,
    setDocumentFile,
    setNotification,
    emptyQuestion,
    createInitialGroup,
}: UseTestSubmissionOptions) => {
    const queryClient = useQueryClient();

    const invalidateQuestionBank = () => {
      queryClient.invalidateQueries({ queryKey: ['question-bank'] });
    };

    const hasQuestionContent = (question: DraftQuestion) => {
        const hasQuestionText = Boolean(question?.questionText?.trim());
        const hasUploadedMedia = Array.isArray(question?.mediaFiles) && question.mediaFiles.length > 0;
        const hasMediaUrl = Boolean(question?.mediaUrl?.trim());
        return hasQuestionText || hasUploadedMedia || hasMediaUrl;
    };

    const hasAtLeastOneCorrectAnswer = (question: DraftQuestion) =>
        Array.isArray(question?.answers) && question.answers.some((answer) => Boolean(answer?.isCorrect));

    const hasValidManualQuestion = (question: DraftQuestion) => {
        if (!hasQuestionContent(question)) {
            return false;
        }
        return hasAtLeastOneCorrectAnswer(question);
    };

    const validateCorrectAnswerSelection = (creatorType: CreatorType) => {
        if (creatorType === CREATOR_TYPES.PASSAGE) {
            const invalidRefs: string[] = [];
            groups.forEach((group, gIndex) => {
                (group.questions || []).forEach((q, qIndex) => {
                    if (hasQuestionContent(q) && !hasAtLeastOneCorrectAnswer(q)) {
                        invalidRefs.push(`Nhóm ${gIndex + 1} - Câu ${qIndex + 1}`);
                    }
                });
            });
            return invalidRefs;
        }

        const invalidRefs: string[] = [];
        questions.forEach((q, index) => {
            if (hasQuestionContent(q) && !hasAtLeastOneCorrectAnswer(q)) {
                invalidRefs.push(`Câu ${index + 1}`);
            }
        });
        return invalidRefs;
    };

    const collectMediaFiles = (creatorType: CreatorType) => {
        const files: File[] = [];
        if (creatorType === CREATOR_TYPES.PASSAGE) {
            groups.forEach((group) => {
                (group.passage?.mediaFiles || []).forEach((f) => files.push(f));
            });
        } else {
            questions.forEach((q) => {
                (q.mediaFiles || []).forEach((f) => files.push(f));
            });
            if (creatorType === CREATOR_TYPES.TEST && documentFile) {
                files.push(documentFile);
            }
        }
        return files;
    };

    const validateUploadSize = (creatorType: CreatorType) => {
        const files = collectMediaFiles(creatorType);
        const oversized = files.find((f) => f.size > MAX_FILE_SIZE_BYTES);
        if (oversized) {
            return `File "${oversized.name}" (${formatMB(oversized.size)}) vượt giới hạn ${formatMB(
                MAX_FILE_SIZE_BYTES,
            )} mỗi file.`;
        }
        const total = files.reduce((sum, f) => sum + f.size, 0);
        if (total > MAX_REQUEST_SIZE_BYTES) {
            return `Tổng dung lượng file (${formatMB(total)}) vượt giới hạn ${formatMB(
                MAX_REQUEST_SIZE_BYTES,
            )}. Vui lòng chia nhỏ thành nhiều lần lưu.`;
        }
        return null;
    };

    const mutation = useMutation({
        mutationFn: async (creatorType: CreatorType) => {
            if (creatorType === CREATOR_TYPES.TEST) {
                const manualQuestions = questions.filter(hasValidManualQuestion);
                const testData = await createTest({
                    title: testInfo.title,
                    description: testInfo.description,
                    examTypeId: String(testInfo.examTypeId),
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
                    classId: mode === 'class' ? String(classId) : null,
                    chapterId: mode === 'class' ? String(chapterId) : null,

                    collectionId: testInfo.collectionId ? String(testInfo.collectionId) : null,

                    costCoins:
                        testInfo.costCoins && Number(testInfo.costCoins) > 0
                            ? Number(testInfo.costCoins)
                            : null,
                } as unknown as CreateTestRequest);
                const newTestId = testData.testId || (testData as any).id;
                const partData = await createTestPart({
                    testId: String(newTestId),
                    examPartId: String(testInfo.examPartId),
                    numQuestions: manualQuestions.length,
                });
                const newPartId = partData.testPartId || (partData as any).id;

                if (documentFile) {
                    const documentFormData = new FormData();
                    documentFormData.append('file', documentFile);
                    documentFormData.append('testPartId', String(newPartId));
                    if (mode === 'class' && classId) {
                        documentFormData.append('classId', String(classId));
                    }
                    if (mode === 'class' && chapterId) {
                        documentFormData.append('chapterId', String(chapterId));
                    }
                    await createAndAttachDocument(documentFormData);
                }

                await Promise.all(
                    manualQuestions.map((q) => {
                        const formData = new FormData();
                        const hasMedia = q.mediaFiles && q.mediaFiles.length > 0;
                        const hasMediaUrl = !!q.mediaUrl?.trim();
                        const passageType = q.passageType || 'LISTENING';
                        const payload = {
                            testPartId: String(newPartId),
                            questionText: q.questionText,
                            questionType: q.questionType,
                            classId: mode === 'class' ? String(classId) : null,
                            chapterId: mode === 'class' ? String(chapterId) : null,
                            answers: q.answers,
                            collectionId: testInfo.collectionId ? String(testInfo.collectionId) : null,
                            explanation: q.explanation?.trim() || null,
                            tagIds: q.tagIds?.length > 0 ? q.tagIds : null,
                            tagNames: q.tagNames?.length > 0 ? q.tagNames : null,
                            passage: (hasMedia || hasMediaUrl)
                                ? { passageType, content: '', mediaUrl: q.mediaUrl?.trim() || null }
                                : null,
                        };
                        formData.append('request', JSON.stringify(payload));
                        if (hasMedia) {
                            q.mediaFiles.forEach((file, i) =>
                                formData.append(`file${i}`, file),
                            );
                        }
                        return createAndAttach(formData);
                    }),
                );
            } else if (creatorType === CREATOR_TYPES.BULK) {
                const formData = new FormData();
                const payload = {
                    examPartId: String(testInfo.examPartId),
                    classId: mode === 'class' && classId ? String(classId) : null,
                    chapterId: mode === 'class' && chapterId ? String(chapterId) : null,
                    collectionId: testInfo.collectionId ? String(testInfo.collectionId) : null,
                    questions: questions.map((q, index) => ({
                        questionNumber: index + 1,
                        questionType: q.questionType,
                        questionText: q.questionText,
                        collectionId: testInfo.collectionId ? String(testInfo.collectionId) : null,
                        explanation: q.explanation?.trim() || null,
                        tagIds: q.tagIds?.length > 0 ? q.tagIds : null,
                        tagNames: q.tagNames?.length > 0 ? q.tagNames : null,
                        answers: q.answers.map((a) => ({
                            answerLabel: a.answerLabel,
                            answerText: a.answerText,
                            isCorrect: a.isCorrect,
                        })),
                    })),
                };
                formData.append('request', JSON.stringify(payload));

                questions.forEach((q, index) => {
                    if (q.mediaFiles && q.mediaFiles.length > 0) {
                        q.mediaFiles.forEach((file, fileIndex) => {
                            formData.append(`media_${index}_${fileIndex}`, file);
                        });
                    }
                });

                await bulkCreateQuestions(formData);
            } else if (creatorType === CREATOR_TYPES.PASSAGE) {
                const formData = new FormData();
                let passageQuestionOrder = 0;
                const requestData = {
                    examPartId: String(testInfo.examPartId),
                    classId: mode === 'class' && classId ? String(classId) : null,
                    chapterId: mode === 'class' && chapterId ? String(chapterId) : null,
                    collectionId: testInfo.collectionId ? String(testInfo.collectionId) : null,
                    groups: groups.map((group) => ({
                        passage: {
                            passageType: group.passage.passageType,
                            content: group.passage.content || '',
                            contentTranslation: group.passage.contentTranslation?.trim() || null,
                            extraContents: (group.passage.extraContents || [])
                                .map((t) => t?.trim())
                                .filter(Boolean),
                        },
                        questions: group.questions.map((q) => ({
                            questionNumber: ++passageQuestionOrder,
                            questionText: q.questionText,
                            questionType: q.questionType,
                            collectionId: testInfo.collectionId ? String(testInfo.collectionId) : null,
                            explanation: q.explanation?.trim() || null,
                            tagIds: q.tagIds?.length > 0 ? q.tagIds : null,
                            tagNames: q.tagNames?.length > 0 ? q.tagNames : null,
                            answers: q.answers.map((a) => ({
                                answerLabel: a.answerLabel,
                                answerText: a.answerText,
                                isCorrect: a.isCorrect,
                            })),
                        })),
                    })),
                };
                formData.append('request', JSON.stringify(requestData));
                groups.forEach((group, gIndex) => {
                    if (group.passage.mediaFiles?.length > 0) {
                        group.passage.mediaFiles.forEach((file, fIndex) => {
                            formData.append(`media_${gIndex}_${fIndex}`, file);
                        });
                    }
                });
                await bulkCreateQuestionGroups(formData);
            }
        },
        onMutate: () => {
            setNotification({});
        },
        onSuccess: (_data, creatorType) => {
            invalidateQuestionBank();
            if (creatorType === CREATOR_TYPES.TEST) {
                setNotification({
                    type: 'success',
                    message: 'Tạo đề thi thành công!',
                });
                setQuestions([JSON.parse(JSON.stringify(emptyQuestion))]);
                setDocumentFile(null);
            } else if (creatorType === CREATOR_TYPES.BULK) {
                setNotification({
                    type: 'success',
                    message: 'Đã lưu câu hỏi vào kho!',
                });
                setQuestions([JSON.parse(JSON.stringify(emptyQuestion))]);
            } else if (creatorType === CREATOR_TYPES.PASSAGE) {
                setNotification({ type: 'success', message: 'Đã lưu thành công!' });
                setGroups([createInitialGroup()]);
            }
        },
        onError: (error: any) => {
            const msg =
                error.response?.data?.detail ||
                error.response?.data?.message ||
                error.message;
            toast.error(msg, { autoClose: TOAST_VALIDATION_MS });
            setNotification({});
        },
    });

    const handleSubmit = async (creatorType: CreatorType) => {
        if (creatorType === CREATOR_TYPES.TEST) {
            if (!testInfo.title || !testInfo.examTypeId || !testInfo.examPartId) {
                toast.warning('Vui lòng điền đủ thông tin!', { autoClose: TOAST_VALIDATION_MS });
                return false;
            }
        } else {
            if (!testInfo.examPartId) {
                toast.warning('Vui lòng chọn Phần thi (Part)!', { autoClose: TOAST_VALIDATION_MS });
                return false;
            }
        }

        const invalidQuestionRefs = validateCorrectAnswerSelection(creatorType);
        if (invalidQuestionRefs.length > 0) {
            toast.warning(
                `Được để trống nội dung đáp án, nhưng mỗi câu phải chọn ít nhất 1 đáp án đúng. Vui lòng kiểm tra: ${invalidQuestionRefs.join(', ')}`,
                { autoClose: TOAST_VALIDATION_MS },
            );
            return false;
        }

        const uploadSizeError = validateUploadSize(creatorType);
        if (uploadSizeError) {
            toast.warning(uploadSizeError, { autoClose: TOAST_VALIDATION_MS });
            return false;
        }

        try {
            await mutation.mutateAsync(creatorType);
            return true;
        } catch {
            return false;
        }
    };

    return { handleSubmit, isSubmitting: mutation.isPending };
};
