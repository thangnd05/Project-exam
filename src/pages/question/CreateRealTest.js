import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    Container,
    Row,
    Col,
    Button,
    Card,
    Form,
    Spinner,
    Alert,
    InputGroup,
} from "react-bootstrap";
import { Trash, PlusCircle, Save } from "lucide-react";

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

const CreateRealTest = ({ classId = 56665354 }) => {
    const [examTypes, setExamTypes] = useState([]);
    const [examParts, setExamParts] = useState([]);

    const [testInfo, setTestInfo] = useState({
        title: "",
        description: "",
        durationMinutes: 15,
        maxAttempts: 1,
        examTypeId: "",
        examPartId: "",
    });

    const [questions, setQuestions] = useState([
        JSON.parse(JSON.stringify(emptyQuestion)),
    ]);

    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState({});

    // =========================
    // 1. LOAD EXAM TYPES
    // =========================
    useEffect(() => {
        const fetchExamTypes = async () => {
            try {
                const res = await axios.get("/api/exam-types");
                setExamTypes(res.data);
            } catch (error) {
                console.error("Lỗi tải Exam Types:", error);
                setNotification({
                    type: "danger",
                    message: "Lỗi kết nối Server khi tải Exam Types",
                });
            }
        };
        fetchExamTypes();
    }, []);

    // =========================
    // 2. LOAD EXAM PARTS
    // =========================
    const handleExamTypeChange = async (e) => {
        const selectedTypeId = e.target.value;
        setTestInfo({ ...testInfo, examTypeId: selectedTypeId, examPartId: "" });
        setExamParts([]);
        if (!selectedTypeId) return;

        try {
            const res = await axios.get(`/api/exam-parts/by-exam-type/${selectedTypeId}`);
            setExamParts(res.data);
        } catch (error) {
            console.error("Lỗi tải Exam Parts:", error);
        }
    };

    // =========================
    // 3. QUẢN LÝ CÂU HỎI
    // =========================
    const addQuestion = () => {
        setQuestions([...questions, JSON.parse(JSON.stringify(emptyQuestion))]);
    };

    const removeQuestion = (index) => {
        if (questions.length === 1) return;
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const updateQuestionText = (index, value) => {
        const newQuestions = [...questions];
        newQuestions[index].questionText = value;
        setQuestions(newQuestions);
    };

    const updateAnswer = (qIndex, aIndex, field, value) => {
        const newQuestions = [...questions];
        if (field === "isCorrect") {
            newQuestions[qIndex].answers.forEach((a) => (a.isCorrect = false));
        }
        newQuestions[qIndex].answers[aIndex][field] = value;
        setQuestions(newQuestions);
    };

    // =========================
    // 4. SUBMIT (DUNG HỢP LOGIC)
    // =========================
    const handleSubmit = async () => {
        // Validate
        if (!testInfo.title || !testInfo.examTypeId || !testInfo.examPartId) {
            setNotification({ type: "warning", message: "Vui lòng nhập tên đề, chọn Loại đề và Phần thi!" });
            return;
        }

        setLoading(true);
        setNotification({});

        try {
            // ----- BƯỚC 1: TẠO TEST -----
            const testPayload = {
                title: testInfo.title,
                description: testInfo.description,
                durationMinutes: Number(testInfo.durationMinutes),
                maxAttempts: Number(testInfo.maxAttempts),
                examTypeId: Number(testInfo.examTypeId),
                classId: Number(classId),
            };

            const testRes = await axios.post("/api/tests", testPayload);

            // Fix: Lấy testId linh hoạt (thử cả id và testId)
            const newTestId = testRes.data.testId || testRes.data.id;

            if (!newTestId) {
                throw new Error("Backend không trả về ID bài Test!");
            }

            // ----- BƯỚC 2: TẠO TEST PART -----
            const partPayload = {
                testId: Number(newTestId),
                examPartId: Number(testInfo.examPartId),
                numQuestions: questions.length,
            };

            const partRes = await axios.post("/api/test-parts", partPayload);
            const newTestPartId = partRes.data.testPartId || partRes.data.id;

            if (!newTestPartId) {
                throw new Error("Không lấy được ID của Phần thi vừa tạo!");
            }

            // ----- BƯỚC 3: TẠO CÂU HỎI -----
            const questionPromises = questions.map((q) =>
                axios.post("/api/questions/create-and-attach", {
                    testPartId: Number(newTestPartId),
                    questionText: q.questionText,
                    questionType: "MCQ", // Đồng bộ với Enum MCQ trong DB
                    classId: Number(classId),
                    answers: q.answers,
                    passage: null,
                })
            );

            await Promise.all(questionPromises);

            setNotification({
                type: "success",
                message: "🎉 Đã tạo bài thi và toàn bộ câu hỏi thành công!",
            });

            // Reset form
            setTestInfo({ ...testInfo, title: "", description: "" });
            setQuestions([JSON.parse(JSON.stringify(emptyQuestion))]);

        } catch (error) {
            console.error("Lỗi quy trình:", error);
            // Hiển thị lỗi chi tiết từ Backend (Ví dụ: "Test ID không được để trống!")
            const errorMsg = error.response?.data?.message || error.response?.data || error.message;
            setNotification({
                type: "danger",
                message: "❌ Thất bại: " + errorMsg,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="py-4">
            <Card className="shadow-sm border-0">
                <Card.Header className="bg-primary text-white py-3 px-4">
                    <h4 className="mb-0">📝 Tạo Đề Thi Nhanh (Dung Hợp)</h4>
                </Card.Header>

                <Card.Body className="p-4">
                    {notification.message && (
                        <Alert variant={notification.type} onClose={() => setNotification({})} dismissible>
                            {notification.message}
                        </Alert>
                    )}

                    <div className="bg-light p-4 rounded mb-4 border">
                        <h6 className="fw-bold text-uppercase text-primary mb-3">1. Cấu hình bài thi</h6>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Tên bài thi <span className="text-danger">*</span></Form.Label>
                                    <Form.Control type="text" placeholder="Nhập tên đề..." value={testInfo.title} onChange={(e) => setTestInfo({ ...testInfo, title: e.target.value })} />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Loại đề <span className="text-danger">*</span></Form.Label>
                                    <Form.Select value={testInfo.examTypeId} onChange={handleExamTypeChange}>
                                        <option value="">-- Chọn --</option>
                                        {examTypes.map((t) => (<option key={t.examTypeId} value={t.examTypeId}>{t.name}</option>))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Phần thi <span className="text-danger">*</span></Form.Label>
                                    <Form.Select value={testInfo.examPartId} onChange={(e) => setTestInfo({ ...testInfo, examPartId: e.target.value })} disabled={!testInfo.examTypeId}>
                                        <option value="">-- Chọn phần --</option>
                                        {examParts.map((p) => (<option key={p.examPartId} value={p.examPartId}>{p.name}</option>))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                    </div>

                    <h6 className="fw-bold text-uppercase text-primary mb-3">2. Danh sách câu hỏi ({questions.length})</h6>

                    {questions.map((q, qIndex) => (
                        <Card key={qIndex} className="mb-4 border shadow-none">
                            <Card.Body>
                                <div className="d-flex justify-content-between mb-3">
                                    <span className="badge bg-primary fs-6">Câu {qIndex + 1}</span>
                                    <Button variant="outline-danger" size="sm" onClick={() => removeQuestion(qIndex)} disabled={questions.length === 1}><Trash size={16} /></Button>
                                </div>

                                <Form.Control as="textarea" rows={2} className="mb-3" placeholder="Nhập nội dung câu hỏi..." value={q.questionText} onChange={(e) => updateQuestionText(qIndex, e.target.value)} />

                                <Row className="g-3">
                                    {q.answers.map((ans, aIndex) => (
                                        <Col md={6} key={aIndex}>
                                            <InputGroup>
                                                <InputGroup.Checkbox checked={ans.isCorrect} onChange={(e) => updateAnswer(qIndex, aIndex, "isCorrect", e.target.checked)} />
                                                <InputGroup.Text className="fw-bold">{ans.label}</InputGroup.Text>
                                                <Form.Control type="text" placeholder={`Đáp án ${ans.label}`} value={ans.answerText} onChange={(e) => updateAnswer(qIndex, aIndex, "answerText", e.target.value)} className={ans.isCorrect ? "border-success bg-success-subtle" : ""} />
                                            </InputGroup>
                                        </Col>
                                    ))}
                                </Row>
                            </Card.Body>
                        </Card>
                    ))}

                    <div className="d-flex justify-content-between mt-4">
                        <Button variant="outline-primary" onClick={addQuestion}><PlusCircle size={20} className="me-2" /> Thêm câu hỏi</Button>
                        <Button variant="success" size="lg" onClick={handleSubmit} disabled={loading} className="px-5">
                            {loading ? <Spinner size="sm" /> : <><Save size={20} className="me-2" /> Lưu & Tạo Đề</>}
                        </Button>
                    </div>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default CreateRealTest;