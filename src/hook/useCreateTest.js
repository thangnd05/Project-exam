import { useState, useEffect } from "react";
import axios from "axios";

const emptyQuestion = {
    questionText: "",
    questionType: "MCQ",
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
        availableFrom: "", // Format: YYYY-MM-DDTHH:mm
        availableTo: "",   // Format: YYYY-MM-DDTHH:mm
    });

    const [questions, setQuestions] = useState([
        JSON.parse(JSON.stringify(emptyQuestion)),
    ]);

    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState({});

    useEffect(() => {
        const fetchExamTypes = async () => {
            try {
                const res = await axios.get("/api/exam-types");
                setExamTypes(res.data);
            } catch (err) {
                console.error("Lỗi tải loại đề:", err);
            }
        };
        fetchExamTypes();
    }, []);

    const handleExamTypeChange = async (value) => {
        setTestInfo({ ...testInfo, examTypeId: value, examPartId: "" });
        if (!value) return;
        try {
            const res = await axios.get(`/api/exam-parts/by-exam-type/${value}`);
            setExamParts(res.data);
        } catch (err) {
            console.error("Lỗi tải phần thi:", err);
        }
    };

    const addQuestion = () => setQuestions([...questions, JSON.parse(JSON.stringify(emptyQuestion))]);
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
        if (field === "isCorrect") newQ[qIndex].answers.forEach((a) => (a.isCorrect = false));
        newQ[qIndex].answers[aIndex][field] = value;
        setQuestions(newQ);
    };

    const handleSubmit = async () => {
        if (!testInfo.title || !testInfo.examTypeId || !testInfo.examPartId) {
            setNotification({ type: "warning", message: "Vui lòng điền đủ Tên, Loại và Phần thi!" });
            return false;
        }

        setLoading(true);
        setNotification({});

        try {
            // 1. CHUẨN BỊ PAYLOAD CHO TEST (Khớp CreateTestRequest DTO)
            const payload = {
                title: testInfo.title,
                description: testInfo.description,
                examTypeId: Number(testInfo.examTypeId),
                durationMinutes: Number(testInfo.durationMinutes),
                maxAttempts: Number(testInfo.maxAttempts),
                bannerUrl: testInfo.bannerUrl || null,
                // Backend dùng LocalDateTime nên gửi chuỗi ISO hoặc format chuẩn
                availableFrom: testInfo.availableFrom ? testInfo.availableFrom + ":00" : null,
                availableTo: testInfo.availableTo ? testInfo.availableTo + ":00" : null,
                classId: mode === "class" ? Number(classId) : null,
                chapterId: mode === "class" ? Number(chapterId) : null,
            };

            // BƯỚC 1: TẠO TEST
            const testRes = await axios.post("/api/tests", payload);
            const newTestId = testRes.data.testId || testRes.data.id;

            // BƯỚC 2: TẠO TEST PART
            const partRes = await axios.post("/api/test-parts", {
                testId: Number(newTestId),
                examPartId: Number(testInfo.examPartId),
                numQuestions: questions.length,
            });
            const newPartId = partRes.data.testPartId || partRes.data.id;

            // BƯỚC 3: TẠO CÂU HỎI & GẮN VÀO TEST PART
            await Promise.all(
                questions.map((q) =>
                    axios.post("/api/questions/create-and-attach", {
                        testPartId: Number(newPartId),
                        questionText: q.questionText,
                        questionType: "MCQ",
                        classId: mode === "class" ? Number(classId) : null,
                        answers: q.answers,
                        passage: null,
                    })
                )
            );

            setNotification({ type: "success", message: "🎉 Đã tạo đề thi và danh sách câu hỏi thành công!" });
            // Reset Form
            setQuestions([JSON.parse(JSON.stringify(emptyQuestion))]);
            setTestInfo({
                ...testInfo,
                title: "",
                description: "",
                bannerUrl: "",
                availableFrom: "",
                availableTo: ""
            });

            return true; // Success

        } catch (error) {
            console.error(error);
            const errorMsg = error.response?.data?.message || error.message || "Lỗi không xác định";
            setNotification({ type: "danger", message: "❌ Lỗi: " + errorMsg });
            return false; // Failure
        } finally {
            setLoading(false);
        }
    };

    return {
        examTypes, examParts, testInfo, setTestInfo, questions, loading, notification,
        handleExamTypeChange, addQuestion, removeQuestion, updateQuestionText, updateAnswer, handleSubmit,
    };
};