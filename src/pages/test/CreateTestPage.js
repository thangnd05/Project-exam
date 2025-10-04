import { useEffect, useState } from "react";
import axios from "axios";
import styles from "./CreateTestPage.module.scss";
import classNames from "classnames/bind";
import { useAuth } from '../../hook/useAuth'; 

const cx = classNames.bind(styles);

function CreateTestPage() {
    const [examTypes, setExamTypes] = useState([]);
    const [selectedExamType, setSelectedExamType] = useState('');
    const [examParts, setExamParts] = useState([]);
    const [testName, setTestName] = useState("");
    const [testDescription, setTestDescription] = useState("");
    const [bannerFile, setBannerFile] = useState(null);
    const [numQuestions, setNumQuestions] = useState({});
    const { user } = useAuth();
    const [durationMinutes, setDurationMinutes] = useState('');

    useEffect(() => {
        axios.get("/api/exam-types")
            .then((res) => {
                setExamTypes(res.data);
            })
            .catch(err => console.error("Failed to fetch exam types:", err));
    }, []);

    const handleExamTypeChange = async (examTypeId) => {
        if (!examTypeId) {
            setSelectedExamType('');
            setExamParts([]);
            setNumQuestions({});
            setDurationMinutes('');
            return;
        }
        
        setSelectedExamType(examTypeId);

        // --- THAY ĐỔI: TỰ ĐỘNG ĐIỀN THỜI GIAN MẶC ĐỊNH ---
        // 1. Tìm examType đầy đủ thông tin trong danh sách đã có.
        const selectedType = examTypes.find(
            (type) => type.examTypeId.toString() === examTypeId
        );

        // 2. Nếu tìm thấy và có thời gian, gán vào state `durationMinutes`.
        //    Ngược lại thì reset thành chuỗi rỗng.
        if (selectedType && selectedType.durationMinutes) {
            setDurationMinutes(selectedType.durationMinutes.toString());
        } else {
            setDurationMinutes('');
        }
        // --- KẾT THÚC THAY ĐỔI ---

        try {
            const res = await axios.get(`/api/exam-parts/by-exam-type/${examTypeId}`);
            setExamParts(res.data);

            const initialNumQuestions = {};
            res.data.forEach((part) => {
                initialNumQuestions[part.examPartId] = part.defaultNumQuestions || 0;
            });
            setNumQuestions(initialNumQuestions);
        } catch (err) {
            console.error("Failed to fetch exam parts:", err);
        }
    };

    const handleNumChange = (partId, value) => {
        const numValue = Math.max(0, parseInt(value, 10) || 0);
        setNumQuestions({ ...numQuestions, [partId]: numValue });
    };
    
    const handleFileChange = (event) => {
        setBannerFile(event.target.files[0]);
    };

    const handleCreateTest = async () => {
        if (!selectedExamType || !testName.trim()) {
            alert("Vui lòng chọn loại kỳ thi và nhập tên đề thi.");
            return;
        }

        const testData = {
            title: testName,
            description: testDescription,
            examTypeId: parseInt(selectedExamType),
            createBy: user?.userId,
            durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : null,
            availableFrom: null,
            availableTo: null,
            maxAttempts: null,
            parts: Object.entries(numQuestions)
                .filter(([, num]) => parseInt(num, 10) > 0)
                .map(([partId, num]) => ({
                    examPartId: parseInt(partId),
                    numQuestions: parseInt(num),
                })),
        };

        const formData = new FormData();
        formData.append('data', JSON.stringify(testData));

        if (bannerFile) {
            formData.append('banner', bannerFile);
        }
        
        try {
            const response = await axios.post("/api/tests", formData);
            console.log("Test created successfully:", response.data);
            alert("Tạo đề thành công!");

        } catch (err) {
            console.error("Error creating test:", err.response?.data || err.message);
            alert("Tạo đề thất bại! Vui lòng kiểm tra console để biết chi tiết.");
        }
    };

    return (
        <div className={cx("container")}>
            <h2 className={cx("title")}>Tạo đề thi mới</h2>

            <div className={cx("form-group")}>
                <label className="form-label">Loại kỳ thi</label>
                <select
                    className="form-select"
                    value={selectedExamType}
                    onChange={(e) => handleExamTypeChange(e.target.value)}
                >
                    <option value="">-- Chọn kỳ thi --</option>
                    {examTypes.map((t) => (
                        <option key={t.examTypeId} value={t.examTypeId}>{t.name}</option>
                    ))}
                </select>
            </div>

            <div className={cx("form-group")}>
                <label className="form-label">Tên đề thi</label>
                <input
                    type="text"
                    className="form-control"
                    placeholder="Ví dụ: Đề thi thử TOEIC tháng 9"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                />
            </div>

            <div className={cx("form-group")}>
                <label className="form-label">Thời gian làm bài (phút)</label>
                <input
                    type="number"
                    className="form-control"
                    placeholder="Để trống để dùng thời gian mặc định của kỳ thi"
                    min="0"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                />
            </div>
            
            <div className={cx("form-group")}>
                <label className="form-label">Mô tả (Không bắt buộc)</label>
                <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Mô tả ngắn về đề thi này"
                    value={testDescription}
                    onChange={(e) => setTestDescription(e.target.value)}
                />
            </div>
            
            <div className={cx("form-group")}>
                <label className="form-label">Ảnh đại diện (Banner)</label>
                <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={handleFileChange}
                />
            </div>

            {examParts.length > 0 && (
                <div className={cx("form-group")}>
                    <h5>Chọn số câu hỏi cho từng Part</h5>
                    <table className={cx("table")}>
                        <thead>
                            <tr>
                                <th>Part</th>
                                <th>Mô tả</th>
                                <th>Số câu</th>
                            </tr>
                        </thead>
                        <tbody>
                            {examParts.map((p) => (
                                <tr key={p.examPartId}>
                                    <td>{p.name}</td>
                                    <td>{p.description}</td>
                                    <td>
                                        <input
                                            type="number"
                                            className={cx("input-number")}
                                            min="0"
                                            value={numQuestions[p.examPartId] || 0}
                                            onChange={(e) =>
                                                handleNumChange(p.examPartId, e.target.value)
                                            }
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <button className={cx("btn-create")} onClick={handleCreateTest}>
                Tạo đề
            </button>
        </div>
    );
}

export default CreateTestPage;