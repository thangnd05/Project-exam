import { useEffect, useState } from "react";
import axios from "axios";
import styles from "./CreateTestPage.module.scss";
import classNames from "classnames/bind";

const cx = classNames.bind(styles);

function CreateTestPage() {
  const [examTypes, setExamTypes] = useState([]);
  const [selectedExamType, setSelectedExamType] = useState("");
  const [examParts, setExamParts] = useState([]);
  const [testName, setTestName] = useState("");
  const [testDescription, setTestDescription] = useState("");
  const [bannerFile, setBannerFile] = useState(null);
  const [numQuestions, setNumQuestions] = useState({});
  const [maxQuestions, setMaxQuestions] = useState({});
  const [mode, setMode] = useState({});
  const [enabledParts, setEnabledParts] = useState({});
  const [selectedQuestions, setSelectedQuestions] = useState({});
  const [questionBank, setQuestionBank] = useState({});
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableTo, setAvailableTo] = useState("");
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [durationMinutes, setDurationMinutes] = useState("");

  // 🟢 Thêm state cho lớp học
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");

  // 🟢 Fetch danh sách lớp của giáo viên
  useEffect(() => {
    axios
      .get("/api/classes/my")
      .then((res) => {
        if (Array.isArray(res.data)) {
          setClasses(res.data);
        } else if (res.data.classes) {
          setClasses(res.data.classes);
        }
      })
      .catch((err) => console.error("❌ Lỗi khi tải danh sách lớp:", err));
  }, []);

  // 🟢 Lấy danh sách kỳ thi
  useEffect(() => {
    axios
      .get("/api/exam-types")
      .then((res) => setExamTypes(res.data))
      .catch((err) => console.error("Failed to fetch exam types:", err));
  }, []);

  // 🟢 Khi chọn loại kỳ thi -> load các Part (có lọc theo lớp)
  const handleExamTypeChange = async (examTypeId) => {
    if (!examTypeId) {
      setSelectedExamType("");
      setExamParts([]);
      setNumQuestions({});
      setMaxQuestions({});
      setMode({});
      setEnabledParts({});
      setDurationMinutes("");
      return;
    }

    setSelectedExamType(examTypeId);

    try {
      const res = await axios.get(`/api/exam-parts/by-exam-type/${examTypeId}`);
      const parts = res.data || [];

      const initNums = {};
      const initMode = {};
      const initEnabled = {};
      const counts = {};

      for (const p of parts) {
        initNums[p.examPartId] = p.defaultNumQuestions || 0;
        initMode[p.examPartId] = "random";
        initEnabled[p.examPartId] = true;

        try {
          // ✅ Gọi API count theo classId nếu có
          const countUrl = classId
            ? `/api/questions/count/by-part/${p.examPartId}?classId=${classId}`
            : `/api/questions/count/by-part/${p.examPartId}`;
          const countRes = await axios.get(countUrl);
          counts[p.examPartId] = countRes.data;
        } catch {
          counts[p.examPartId] = 0;
        }
      }

      setExamParts(parts);
      setNumQuestions(initNums);
      setMode(initMode);
      setEnabledParts(initEnabled);
      setMaxQuestions(counts);
    } catch (err) {
      console.error("Failed to fetch exam parts:", err);
    }
  };

  // 🧮 Đổi số câu hỏi
  const handleNumChange = (partId, value) => {
    const val = parseInt(value, 10) || 0;
    const max = maxQuestions[partId] || 0;
    if (val > max) {
      alert(`❌ Số câu vượt quá giới hạn (${max} câu)!`);
      return;
    }
    setNumQuestions((prev) => ({ ...prev, [partId]: val }));
  };

  // 🔁 Chuyển chế độ random/manual (có lọc theo class)
  const handleModeChange = async (partId, newMode) => {
    setMode((prev) => ({ ...prev, [partId]: newMode }));
    if (newMode === "manual" && !questionBank[partId]) {
      try {
        // ✅ Nếu đã chọn lớp → gửi classId để BE lọc câu hỏi
        const url = classId
          ? `/api/questions/by-part/${partId}?classId=${classId}`
          : `/api/questions/by-part/${partId}`;
        const res = await axios.get(url);
        setQuestionBank((prev) => ({ ...prev, [partId]: res.data || [] }));
      } catch (err) {
        console.error("Failed to load question bank:", err);
      }
    }
  };

  const handleSelectQuestion = (partId, questionId, checked) => {
    setSelectedQuestions((prev) => {
      const prevList = prev[partId] || [];
      const newList = checked
        ? [...prevList, questionId]
        : prevList.filter((id) => id !== questionId);
      return { ...prev, [partId]: newList };
    });
  };

  const handleFileChange = (e) => setBannerFile(e.target.files[0]);

  // 🚀 Gửi form tạo đề
  const handleCreateTest = async () => {
    if (!selectedExamType || !testName.trim()) {
      alert("Vui lòng chọn loại kỳ thi và nhập tên đề thi.");
      return;
    }

    const parts = examParts
      .filter((p) => enabledParts[p.examPartId])
      .map((p) => {
        const partId = p.examPartId;
        const isRandom = mode[partId] === "random";
        return isRandom
          ? {
              examPartId: partId,
              numQuestions: parseInt(numQuestions[partId] || 0, 10),
              random: true,
            }
          : {
              examPartId: partId,
              random: false,
              questionIds: selectedQuestions[partId] || [],
            };
      });

    if (parts.length === 0) {
      alert("⚠️ Vui lòng bật ít nhất một Part để tạo đề.");
      return;
    }

    const testData = {
      title: testName,
      description: testDescription,
      examTypeId: parseInt(selectedExamType, 10),
      durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : 60,
      availableFrom: availableFrom || null,
      availableTo: availableTo || null,
      maxAttempts: parseInt(maxAttempts, 10) || 1,
      parts,
      classId: classId ? parseInt(classId, 10) : null, // ✅ gửi classId lên BE
    };

    const formData = new FormData();
    formData.append("data", JSON.stringify(testData));
    if (bannerFile) formData.append("banner", bannerFile);

    try {
      const res = await axios.post("/api/tests", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      alert("✅ Tạo đề thành công!");
      console.log("Created test:", res.data);
    } catch (err) {
      console.error("❌ Error creating test:", err.response?.data || err);
      alert("Tạo đề thất bại. Kiểm tra console để biết chi tiết.");
    }
  };

  return (
    <div className={cx("container")}>
      <h2 className={cx("title")}>Tạo đề thi mới</h2>

      {/* === 🟢 CHỌN LỚP HỌC === */}
      <div className={cx("form-group")}>
        <label>Chọn lớp học</label>
        <select
          className="form-select"
          value={classId}
          onChange={(e) => {
            const newClassId = e.target.value;
            setClassId(newClassId);

            // 🧹 Reset lại dữ liệu khi đổi lớp
            setExamParts([]);
            setNumQuestions({});
            setMaxQuestions({});
            setMode({});
            setEnabledParts({});
            setQuestionBank({});
            setSelectedQuestions({});

            if (selectedExamType) handleExamTypeChange(selectedExamType);
          }}
        >
          <option value="">-- Chọn lớp --</option>
          {classes.map((cls) => (
            <option key={cls.classId} value={cls.classId}>
              {cls.className}
            </option>
          ))}
        </select>
      </div>

      {/* === THÔNG TIN CHUNG === */}
      <div className={cx("form-group")}>
        <label>Loại kỳ thi</label>
        <select
          className="form-select"
          value={selectedExamType}
          onChange={(e) => handleExamTypeChange(e.target.value)}
        >
          <option value="">-- Chọn kỳ thi --</option>
          {examTypes.map((t) => (
            <option key={t.examTypeId} value={t.examTypeId}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div className={cx("form-group")}>
        <label>Tên đề thi</label>
        <input
          type="text"
          className="form-control"
          placeholder="VD: Đề luyện TOEIC tháng 10"
          value={testName}
          onChange={(e) => setTestName(e.target.value)}
        />
      </div>

      <div className={cx("form-group")}>
        <label>Mô tả</label>
        <textarea
          className="form-control"
          rows="3"
          placeholder="Thêm mô tả ngắn cho đề thi (tùy chọn)"
          value={testDescription}
          onChange={(e) => setTestDescription(e.target.value)}
        />
      </div>

      <div className={cx("form-grid")}>
        <div>
          <label>Thời gian mở</label>
          <input
            type="datetime-local"
            className="form-control"
            value={availableFrom}
            onChange={(e) => setAvailableFrom(e.target.value)}
          />
        </div>
        <div>
          <label>Thời gian đóng</label>
          <input
            type="datetime-local"
            className="form-control"
            value={availableTo}
            onChange={(e) => setAvailableTo(e.target.value)}
          />
        </div>
      </div>

      <div className={cx("form-grid")}>
        <div>
          <label>Thời lượng (phút)</label>
          <input
            type="number"
            className="form-control"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
          />
        </div>
        <div>
          <label>Số lần làm tối đa</label>
          <input
            type="number"
            className="form-control"
            value={maxAttempts}
            onChange={(e) => setMaxAttempts(e.target.value)}
          />
        </div>
      </div>

      <div className={cx("form-group")}>
        <label>Ảnh banner (tùy chọn)</label>
        <input
          type="file"
          className="form-control"
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>

      {/* === DANH SÁCH PART === */}
      {examParts.length > 0 &&
        examParts.map((p) => (
          <div key={p.examPartId} className={cx("part-block")}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div>
                <input
                  type="checkbox"
                  className="form-check-input me-2"
                  checked={enabledParts[p.examPartId] ?? true}
                  onChange={(e) =>
                    setEnabledParts({
                      ...enabledParts,
                      [p.examPartId]: e.target.checked,
                    })
                  }
                />
                <b>{p.name}</b> – {p.description}
              </div>
              <select
                className="form-select w-auto"
                disabled={!enabledParts[p.examPartId]}
                value={mode[p.examPartId] || "random"}
                onChange={(e) => handleModeChange(p.examPartId, e.target.value)}
              >
                <option value="random">Ngẫu nhiên</option>
                <option value="manual">Thủ công</option>
              </select>
            </div>

            {mode[p.examPartId] === "random" && enabledParts[p.examPartId] && (
              <div className="mb-3">
                <input
                  type="number"
                  className="form-control"
                  min="0"
                  max={maxQuestions[p.examPartId] || 0}
                  value={numQuestions[p.examPartId] || 0}
                  onChange={(e) =>
                    handleNumChange(p.examPartId, e.target.value)
                  }
                  placeholder="Số câu muốn random"
                />
                <small className="text-muted">
                  Tối đa: {maxQuestions[p.examPartId] || 0} câu
                </small>
              </div>
            )}

            {mode[p.examPartId] === "manual" && enabledParts[p.examPartId] && (
              <div className={cx("manual-select")}>
                {questionBank[p.examPartId] ? (
                  questionBank[p.examPartId].map((q) => (
                    <label key={q.questionId} className="d-block">
                      <input
                        type="checkbox"
                        checked={
                          selectedQuestions[p.examPartId]?.includes(
                            q.questionId
                          ) || false
                        }
                        onChange={(e) =>
                          handleSelectQuestion(
                            p.examPartId,
                            q.questionId,
                            e.target.checked
                          )
                        }
                      />{" "}
                      {q.questionText}
                    </label>
                  ))
                ) : (
                  <i>Đang tải danh sách câu hỏi...</i>
                )}
              </div>
            )}
          </div>
        ))}

      <button className={cx("btn-create")} onClick={handleCreateTest}>
        🚀 Tạo đề
      </button>
    </div>
  );
}

export default CreateTestPage;
