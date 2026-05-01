import axios from 'axios';
import { toast } from 'react-toastify';
import { CREATOR_TYPES } from './useCreateTest';

const TOAST_VALIDATION_MS = 8000;

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
    setLoading,
    setNotification,
    emptyQuestion,
    createInitialGroup,
}) => {
    const hasQuestionContent = (question) => {
        const hasQuestionText = Boolean(question?.questionText?.trim());
        const hasUploadedMedia = Array.isArray(question?.mediaFiles) && question.mediaFiles.length > 0;
        const hasMediaUrl = Boolean(question?.mediaUrl?.trim());
        return hasQuestionText || hasUploadedMedia || hasMediaUrl;
    };

    const hasAtLeastOneCorrectAnswer = (question) =>
        Array.isArray(question?.answers) && question.answers.some((answer) => Boolean(answer?.isCorrect));

    const hasValidManualQuestion = (question) => {
        if (!hasQuestionContent(question)) {
            return false;
        }
        return hasAtLeastOneCorrectAnswer(question);
    };

    const validateCorrectAnswerSelection = (creatorType) => {
        if (creatorType === CREATOR_TYPES.PASSAGE) {
            const invalidRefs = [];
            groups.forEach((group, gIndex) => {
                (group.questions || []).forEach((q, qIndex) => {
                    if (hasQuestionContent(q) && !hasAtLeastOneCorrectAnswer(q)) {
                        invalidRefs.push(`Nhóm ${gIndex + 1} - Câu ${qIndex + 1}`);
                    }
                });
            });
            return invalidRefs;
        }

        const invalidRefs = [];
        questions.forEach((q, index) => {
            if (hasQuestionContent(q) && !hasAtLeastOneCorrectAnswer(q)) {
                invalidRefs.push(`Câu ${index + 1}`);
            }
        });
        return invalidRefs;
    };

    const handleSubmit = async (creatorType) => {
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

        setLoading(true);
        setNotification({});

        try {
            if (creatorType === CREATOR_TYPES.TEST) {
                const manualQuestions = questions.filter(hasValidManualQuestion);
                const testRes = await axios.post('/api/tests', {
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
                    availableFrom: testInfo.availableFrom
                        ? testInfo.availableFrom + ':00'
                        : null,
                    availableTo: testInfo.availableTo
                        ? testInfo.availableTo + ':00'
                        : null,
                    classId: mode === 'class' ? String(classId) : null,
                    chapterId: mode === 'class' ? String(chapterId) : null,
                });
                const newTestId = testRes.data.testId || testRes.data.id;
                const partRes = await axios.post('/api/test-parts', {
                    testId: String(newTestId),
                    examPartId: String(testInfo.examPartId),
                    numQuestions: manualQuestions.length,
                });
                const newPartId = partRes.data.testPartId || partRes.data.id;

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
                    await axios.post('/api/questions/create-and-attach/document', documentFormData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                    });
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
                        return axios.post('/api/questions/create-and-attach', formData, {
                            headers: { 'Content-Type': 'multipart/form-data' },
                        });
                    }),
                );
                setNotification({
                    type: 'success',
                    message: '🎉 Tạo đề thi thành công!',
                });
                setQuestions([JSON.parse(JSON.stringify(emptyQuestion))]);
                setDocumentFile(null);
            } else if (creatorType === CREATOR_TYPES.BULK) {
                const formData = new FormData();
                const payload = {
                    examPartId: String(testInfo.examPartId),
                    classId: mode === 'class' && classId ? String(classId) : null,
                    chapterId: mode === 'class' && chapterId ? String(chapterId) : null,
                    questions: questions.map((q) => ({
                        questionType: q.questionType,
                        questionText: q.questionText,
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

                await axios.post('/api/questions/bulk', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                setNotification({
                    type: 'success',
                    message: '🎉 Đã lưu câu hỏi vào kho!',
                });
                setQuestions([JSON.parse(JSON.stringify(emptyQuestion))]);
            } else if (creatorType === CREATOR_TYPES.PASSAGE) {
                const formData = new FormData();
                const requestData = {
                    examPartId: String(testInfo.examPartId),
                    classId: mode === 'class' && classId ? String(classId) : null,
                    chapterId: mode === 'class' && chapterId ? String(chapterId) : null,
                    groups: groups.map((group) => ({
                        passage: {
                            passageType: group.passage.passageType,
                            content: group.passage.inputMode === 'UPLOAD' ? '' : group.passage.content,
                        },
                        questions: group.questions.map((q) => ({
                            questionText: q.questionText,
                            questionType: q.questionType,
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
                    if (group.passage.inputMode === 'UPLOAD' && group.passage.mediaFiles?.length > 0) {
                        group.passage.mediaFiles.forEach((file, fIndex) => {
                            formData.append(`media_${gIndex}_${fIndex}`, file);
                        });
                    }
                });
                await axios.post('/api/questions/bulk-groups', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                setNotification({ type: 'success', message: '🎉 Đã lưu thành công!' });
                setGroups([createInitialGroup()]);
            }
            return true;
        } catch (error) {
            const msg =
                error.response?.data?.detail ||
                error.response?.data?.message ||
                error.message;
            toast.error(msg, { autoClose: TOAST_VALIDATION_MS });
            setNotification({});
            return false;
        } finally {
            setLoading(false);
        }
    };

    return { handleSubmit };
};
