import axios from 'axios';
import { CREATOR_TYPES } from './useCreateTest';

export const useTestSubmission = ({
    mode,
    classId,
    chapterId,
    testInfo,
    questions,
    groups,
    setQuestions,
    setGroups,
    setLoading,
    setNotification,
    emptyQuestion,
    createInitialGroup,
}) => {
    const handleSubmit = async (creatorType) => {
        if (creatorType === CREATOR_TYPES.TEST) {
            if (!testInfo.title || !testInfo.examTypeId || !testInfo.examPartId) {
                setNotification({
                    type: 'warning',
                    message: 'Vui lòng điền đủ thông tin!',
                });
                return false;
            }
        } else {
            if (!testInfo.examPartId) {
                setNotification({
                    type: 'warning',
                    message: 'Vui lòng chọn Phần thi (Part)!',
                });
                return false;
            }
        }

        setLoading(true);
        setNotification({});

        try {
            if (creatorType === CREATOR_TYPES.TEST) {
                const testRes = await axios.post('/api/tests', {
                    title: testInfo.title,
                    description: testInfo.description,
                    examTypeId: Number(testInfo.examTypeId),
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
                    classId: mode === 'class' ? Number(classId) : null,
                    chapterId: mode === 'class' ? Number(chapterId) : null,
                });
                const newTestId = testRes.data.testId || testRes.data.id;
                const partRes = await axios.post('/api/test-parts', {
                    testId: Number(newTestId),
                    examPartId: Number(testInfo.examPartId),
                    numQuestions: questions.length,
                });
                const newPartId = partRes.data.testPartId || partRes.data.id;
                await Promise.all(
                    questions.map((q) => {
                        const formData = new FormData();
                        const hasMedia = q.mediaFiles && q.mediaFiles.length > 0;
                        const hasMediaUrl = !!q.mediaUrl?.trim();
                        const passageType = q.passageType || 'LISTENING';
                        const payload = {
                            testPartId: Number(newPartId),
                            questionText: q.questionText,
                            questionType: q.questionType,
                            classId: mode === 'class' ? Number(classId) : null,
                            chapterId: mode === 'class' ? Number(chapterId) : null,
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
            } else if (creatorType === CREATOR_TYPES.BULK) {
                const formData = new FormData();
                const payload = {
                    examPartId: Number(testInfo.examPartId),
                    classId: mode === 'class' && classId ? Number(classId) : null,
                    chapterId: mode === 'class' && chapterId ? Number(chapterId) : null,
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
                        formData.append(`media_${index}_audio`, q.mediaFiles[0]);
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
                    examPartId: Number(testInfo.examPartId),
                    classId: mode === 'class' && classId ? Number(classId) : null,
                    chapterId: mode === 'class' && chapterId ? Number(chapterId) : null,
                    groups: groups.map((group) => ({
                        passage: {
                            passageType: group.passage.passageType,
                            content: group.passage.content,
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
                    if (group.passage.mediaFiles?.length > 0) {
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
            const msg = error.response?.data?.message || error.message;
            setNotification({ type: 'danger', message: '❌ ' + msg });
            return false;
        } finally {
            setLoading(false);
        }
    };

    return { handleSubmit };
};
