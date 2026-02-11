import { useState, useEffect } from "react";
import axios from "axios";

const emptyQuestion = {
    questionText: "",
    questionType: "MCQ",
    mediaFiles: [],
    passageType: "LISTENING",
    answers: [
        { answerLabel: "A", answerText: "", isCorrect: false },
        { answerLabel: "B", answerText: "", isCorrect: false },
        { answerLabel: "C", answerText: "", isCorrect: false },
        { answerLabel: "D", answerText: "", isCorrect: false },
    ],
};

export const useCreateTest = ({ mode, classId, chapterId }) => {
    const [examTypes, setExamTypes] = useState([]);
    const [examParts, setExamParts] = useState([]);

    const [testInfo, setTestInfo] = useState({
        title: "",
        description: "",
        durationMinutes: "",
        maxAttempts: "",
        examTypeId: "",
        examPartId: "",
        bannerUrl: "",
        availableFrom: "",
        availableTo: "",
    });

    const [questions, setQuestions] = useState([
        JSON.parse(JSON.stringify(emptyQuestion)),
    ]);

    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState({});

    useEffect(() => {
        axios.get("/api/exam-types")
            .then(res => setExamTypes(res.data))
            .catch(err => console.error(err));
    }, []);

    const handleExamTypeChange = async (value) => {
        setTestInfo({ ...testInfo, examTypeId: value, examPartId: "" });
        if (!value) return;

        try {
            const res = await axios.get(`/api/exam-parts/by-exam-type/${value}`);
            setExamParts(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const addQuestion = () =>
        setQuestions([...questions, JSON.parse(JSON.stringify(emptyQuestion))]);

    const removeQuestion = (index) => {
        if (questions.length === 1) return;
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const updateQuestionText = (index, value) => {
        const newQ = [...questions];
        newQ[index].questionText = value;
        setQuestions(newQ);
    };

    const updateAnswer = (qIndex, aIndex, field, value) => {
        const newQ = [...questions];
        if (field === "isCorrect")
            newQ[qIndex].answers.forEach(a => (a.isCorrect = false));
        newQ[qIndex].answers[aIndex][field] = value;
        setQuestions(newQ);
    };

    const addMediaFile = (index, file) => {
        if (!file) return;
        const newQ = [...questions];
        newQ[index].mediaFiles = [...(newQ[index].mediaFiles || []), file];
        setQuestions(newQ);
    };

    const addMediaFiles = (index, fileList) => {
        const files = fileList ? Array.from(fileList) : [];
        if (files.length === 0) return;
        const newQ = [...questions];
        newQ[index].mediaFiles = [...(newQ[index].mediaFiles || []), ...files];
        setQuestions(newQ);
    };

    const removeMediaFile = (qIndex, fileIndex) => {
        const newQ = [...questions];
        newQ[qIndex].mediaFiles = newQ[qIndex].mediaFiles.filter((_, i) => i !== fileIndex);
        setQuestions(newQ);
    };

    const setPassageType = (index, passageType) => {
        const newQ = [...questions];
        newQ[index].passageType = passageType;
        setQuestions(newQ);
    };

    const handleSubmit = async () => {
        if (!testInfo.title || !testInfo.examTypeId || !testInfo.examPartId) {
            setNotification({ type: "warning", message: "Vui lòng điền đủ thông tin!" });
            return false;
        }

        setLoading(true);
        setNotification({});

        try {
            // 1️⃣ CREATE TEST
            const testRes = await axios.post("/api/tests", {
                title: testInfo.title,
                description: testInfo.description,
                examTypeId: Number(testInfo.examTypeId),
                durationMinutes: (testInfo.durationMinutes && Number(testInfo.durationMinutes) > 0) ? Number(testInfo.durationMinutes) : null,
                maxAttempts: (testInfo.maxAttempts && Number(testInfo.maxAttempts) > 0) ? Number(testInfo.maxAttempts) : null,
                bannerUrl: testInfo.bannerUrl || null,
                availableFrom: testInfo.availableFrom ? testInfo.availableFrom + ":00" : null,
                availableTo: testInfo.availableTo ? testInfo.availableTo + ":00" : null,
                classId: mode === "class" ? Number(classId) : null,
                chapterId: mode === "class" ? Number(chapterId) : null,
            });

            const newTestId = testRes.data.testId || testRes.data.id;

            // 2️⃣ CREATE TEST PART
            const partRes = await axios.post("/api/test-parts", {
                testId: Number(newTestId),
                examPartId: Number(testInfo.examPartId),
                numQuestions: questions.length,
            });

            const newPartId = partRes.data.testPartId || partRes.data.id;

            // 3️⃣ CREATE QUESTIONS (multipart, đa file)
            await Promise.all(
                questions.map((q) => {
                    const formData = new FormData();
                    const hasMedia = q.mediaFiles && q.mediaFiles.length > 0;
                    const passageType = q.passageType || "LISTENING";

                    const payload = {
                        testPartId: Number(newPartId),
                        questionText: q.questionText,
                        questionType: q.questionType,
                        classId: mode === "class" ? Number(classId) : null,
                        chapterId: mode === "class" ? Number(chapterId) : null,
                        answers: q.answers,
                        passage: hasMedia ? { passageType, content: "" } : null,
                    };

                    formData.append("request", JSON.stringify(payload));

                    if (hasMedia) {
                        q.mediaFiles.forEach((file, i) => {
                            formData.append(`file${i}`, file);
                        });
                    }

                    return axios.post(
                        "/api/questions/create-and-attach",
                        formData,
                        { headers: { "Content-Type": "multipart/form-data" } }
                    );
                })
            );

            setNotification({ type: "success", message: "🎉 Tạo đề thi thành công!" });
            setQuestions([JSON.parse(JSON.stringify(emptyQuestion))]);

            return true;

        } catch (error) {
            const msg = error.response?.data?.message || error.message;
            setNotification({ type: "danger", message: "❌ " + msg });
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        examTypes,
        examParts,
        testInfo,
        setTestInfo,
        questions,
        loading,
        notification,
        handleExamTypeChange,
        addQuestion,
        removeQuestion,
        updateQuestionText,
        updateAnswer,
        addMediaFile,
        addMediaFiles,
        removeMediaFile,
        setPassageType,
        handleSubmit,
    };
};
