import { useState, useEffect } from "react";
import axios from "axios";

const emptyQuestion = {
    questionText: "",
    questionType: "MCQ",
    audioFile: null,
    answers: [
        { label: "A", answerText: "", isCorrect: false },
        { label: "B", answerText: "", isCorrect: false },
        { label: "C", answerText: "", isCorrect: false },
        { label: "D", answerText: "", isCorrect: false },
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

    const updateAudio = (index, file) => {
        const newQ = [...questions];
        newQ[index].audioFile = file;
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

            // 3️⃣ CREATE QUESTIONS (multipart)
            await Promise.all(
                questions.map((q) => {

                    const formData = new FormData();

                    const payload = {
                        testPartId: Number(newPartId),
                        questionText: q.questionText,
                        questionType: q.questionType,
                        classId: mode === "class" ? Number(classId) : null,
                        answers: q.answers,
                        passage: q.audioFile ? { passageType: "LISTENING", content: "" } : null,
                    };

                    formData.append("request", JSON.stringify(payload));

                    if (q.audioFile) {
                        formData.append("audio", q.audioFile);
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
        updateAudio,
        handleSubmit,
    };
};
