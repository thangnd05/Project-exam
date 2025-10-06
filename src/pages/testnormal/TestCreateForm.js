import React, { useState, useEffect } from "react";
import axios from "axios";
import "./TestCreationForm.scss";

const TestCreationForm = ({ user }) => {
  const initialQuestion = {
    questionType: "MCQ",
    questionText: "",
    options: [
      { label: "A", content: "", isCorrect: false },
      { label: "B", content: "", isCorrect: false },
      { label: "C", content: "", isCorrect: false },
      { label: "D", content: "", isCorrect: false },
    ],
  };

  const [testData, setTestData] = useState({
    examTypeId: "",
    title: "",
    description: "",
    durationMinutes: "",
    availableFrom: "",
    availableTo: "",
    maxAttempts: 1,
    createBy: user?.userId || 1,
    parts: [],
  });

  const [bannerFile, setBannerFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  // 🟢 Khi người dùng chọn loại bài thi, tự fetch danh sách exam_part từ backend
  useEffect(() => {
    const fetchExamParts = async () => {
      if (!testData.examTypeId) return;
      try {
        const res = await axios.get(
          `http://localhost:8080/api/exam-parts/by-exam-type/${testData.examTypeId}`
        );
        const parts = res.data.map((p) => ({
          examPartId: p.examPartId,
          passage: {
            passageType:
              p.skillId === 1
                ? "LISTENING"
                : p.skillId === 2
                ? "READING"
                : p.skillId === 3
                ? "SPEAKING"
                : "WRITING",
            content: "",
            mediaFile: null,
          },
          questions: [JSON.parse(JSON.stringify(initialQuestion))],
        }));
        setTestData((prev) => ({ ...prev, parts }));
      } catch (err) {
        console.error("❌ Lỗi khi tải danh sách exam_part:", err);
        setStatusMessage("❌ Không tải được danh sách phần thi!");
      }
    };

    fetchExamParts();
  }, [testData.examTypeId]);

  // 🟢 Thêm / Xoá phần
  const addPart = () => {
    setTestData((prev) => {
      const newPart = {
        examPartId: prev.parts.length + 1000, // ID tạm
        passage: { passageType: "READING", content: "", mediaFile: null },
        questions: [JSON.parse(JSON.stringify(initialQuestion))],
      };
      return { ...prev, parts: [...prev.parts, newPart] };
    });
  };

  const removePart = (index) => {
    setTestData((prev) => ({
      ...prev,
      parts: prev.parts.filter((_, i) => i !== index),
    }));
  };

  // 🟢 Xử lý nội dung passage
  const handlePartChange = (index, field, value) => {
    const updatedParts = [...testData.parts];
    if (field === "passageType") {
      updatedParts[index].passage.passageType = value;
    } else {
      updatedParts[index][field] = value;
    }
    setTestData({ ...testData, parts: updatedParts });
  };

  const handlePassageChange = (partIndex, field, value) => {
    const updatedParts = [...testData.parts];
    updatedParts[partIndex].passage[field] = value;
    setTestData({ ...testData, parts: updatedParts });
  };

  // 🟢 Câu hỏi
  const addQuestion = (partIndex) => {
    const newQuestion = JSON.parse(JSON.stringify(initialQuestion));
    const updatedParts = [...testData.parts];
    updatedParts[partIndex].questions.push(newQuestion);
    setTestData({ ...testData, parts: updatedParts });
  };

  const removeQuestion = (partIndex, qIndex) => {
    const updatedParts = [...testData.parts];
    updatedParts[partIndex].questions.splice(qIndex, 1);
    setTestData({ ...testData, parts: updatedParts });
  };

  const handleQuestionChange = (partIndex, qIndex, field, value) => {
    const updatedParts = [...testData.parts];
    updatedParts[partIndex].questions[qIndex][field] = value;
    setTestData({ ...testData, parts: updatedParts });
  };

  const handleOptionChange = (partIndex, qIndex, oIndex, field, value) => {
    const updatedParts = [...testData.parts];
    updatedParts[partIndex].questions[qIndex].options[oIndex][field] = value;
    setTestData({ ...testData, parts: updatedParts });
  };

  // 🟢 Audio passage
  const handleFileChange = (partIndex, file) => {
    const updatedParts = [...testData.parts];
    updatedParts[partIndex].passage.mediaFile = file;
    setTestData({ ...testData, parts: updatedParts });
  };

  const removeAudioFile = (partIndex) => {
    const updatedParts = [...testData.parts];
    updatedParts[partIndex].passage.mediaFile = null;
    setTestData({ ...testData, parts: updatedParts });
  };

  // 🟢 Gửi dữ liệu lên backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage("");

    const requestPayload = {
      examTypeId: testData.examTypeId,
      title: testData.title,
      description: testData.description,
      durationMinutes: parseInt(testData.durationMinutes),
      createBy: testData.createBy || 1,
      availableFrom: testData.availableFrom || null,
      availableTo: testData.availableTo || null,
      maxAttempts: parseInt(testData.maxAttempts),
      parts: testData.parts.map((p) => ({
        examPartId: p.examPartId,
        passage: {
          passageType: p.passage.passageType,
          content: p.passage.content,
        },
        questions: p.questions.map((q) => ({
          questionType: q.questionType,
          questionText: q.questionText,
          answers: q.options.map((opt) => ({
            label: opt.label,
            answerText: opt.content,
            isCorrect: opt.isCorrect,
          })),
        })),
      })),
    };

    const formData = new FormData();
    formData.append("testData", JSON.stringify(requestPayload));
    if (bannerFile) formData.append("bannerFile", bannerFile);

    testData.parts.forEach((part) => {
      if (part.passage.passageType === "LISTENING" && part.passage.mediaFile) {
        formData.append("audioFiles", part.passage.mediaFile);
      }
    });

    try {
      await axios.post("http://localhost:8080/api/tests/create-with-questions", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      setStatusMessage("✅ Tạo bài kiểm tra thành công!");
    } catch (err) {
      console.error(err);
      setStatusMessage("❌ Lỗi khi tạo bài kiểm tra!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="test-creation-form container mt-4">
      <h2 className="form-title">Tạo bài kiểm tra mới</h2>
      <form onSubmit={handleSubmit}>
        {/* === Thông tin chung === */}
        <div className="form-section">
          <label>Loại bài thi</label>
          <select
            className="form-select"
            value={testData.examTypeId}
            onChange={(e) => setTestData({ ...testData, examTypeId: e.target.value })}
          >
            <option value="">-- Chọn loại bài thi --</option>
            <option value="1">TOEIC</option>
            <option value="2">IELTS</option>
            <option value="3">CUSTOM</option>
          </select>
        </div>

        <div className="form-section">
          <label>Tiêu đề</label>
          <input
            type="text"
            className="form-control"
            value={testData.title}
            onChange={(e) => setTestData({ ...testData, title: e.target.value })}
          />
        </div>

        <div className="form-section">
          <label>Mô tả</label>
          <textarea
            className="form-control"
            value={testData.description}
            onChange={(e) => setTestData({ ...testData, description: e.target.value })}
          ></textarea>
        </div>

        <div className="form-grid">
          <div>
            <label>Thời lượng (phút)</label>
            <input
              type="number"
              className="form-control"
              value={testData.durationMinutes}
              onChange={(e) => setTestData({ ...testData, durationMinutes: e.target.value })}
            />
          </div>
          <div>
            <label>Số lần làm tối đa</label>
            <input
              type="number"
              className="form-control"
              value={testData.maxAttempts}
              onChange={(e) => setTestData({ ...testData, maxAttempts: e.target.value })}
            />
          </div>
        </div>

        <div className="form-grid">
          <div>
            <label>Thời gian mở</label>
            <input
              type="datetime-local"
              className="form-control"
              value={testData.availableFrom}
              onChange={(e) => setTestData({ ...testData, availableFrom: e.target.value })}
            />
          </div>
          <div>
            <label>Thời gian đóng</label>
            <input
              type="datetime-local"
              className="form-control"
              value={testData.availableTo}
              onChange={(e) => setTestData({ ...testData, availableTo: e.target.value })}
            />
          </div>
        </div>

        {/* === Banner === */}
        <div className="form-section">
          <label>Ảnh banner</label>
          <input
            key={bannerFile ? bannerFile.name : `banner-${Date.now()}`}
            type="file"
            accept="image/*"
            className="form-control"
            onChange={(e) => setBannerFile(e.target.files[0])}
          />
          {bannerFile && (
            <div className="banner-preview mt-2 text-center">
              <img
                src={URL.createObjectURL(bannerFile)}
                alt="Banner Preview"
                style={{ maxWidth: "100%", borderRadius: "8px" }}
              />
              <div className="mt-2">
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => setBannerFile(null)}
                >
                  🗑️ Xóa banner
                </button>
              </div>
            </div>
          )}
        </div>

        {/* === Các phần thi === */}
        {testData.parts.map((part, partIndex) => (
          <div key={partIndex} className="part-card">
            <div className="part-header">
              <h5>Phần {part.examPartId}</h5>
              {testData.parts.length > 1 && (
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => removePart(partIndex)}
                >
                  Xóa phần
                </button>
              )}
            </div>

            <label>Loại passage</label>
            <select
              className="form-select"
              value={part.passage.passageType}
              onChange={(e) => handlePartChange(partIndex, "passageType", e.target.value)}
            >
              <option value="READING">Reading</option>
              <option value="LISTENING">Listening</option>
              <option value="SPEAKING">Speaking</option>
              <option value="WRITING">Writing</option>
            </select>

            <label>Nội dung passage</label>
            <textarea
              className="form-control"
              value={part.passage.content}
              onChange={(e) => handlePassageChange(partIndex, "content", e.target.value)}
            ></textarea>

            {part.passage.passageType === "LISTENING" && (
              <div>
                <label>Upload file audio</label>
                <input
                  type="file"
                  accept="audio/*"
                  className="form-control"
                  onChange={(e) => handleFileChange(partIndex, e.target.files[0])}
                />
                {part.passage.mediaFile && (
                  <div className="mt-2">
                    <audio
                      controls
                      src={URL.createObjectURL(part.passage.mediaFile)}
                      className="w-100"
                    />
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm mt-2"
                      onClick={() => removeAudioFile(partIndex)}
                    >
                      Xóa audio
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* === Danh sách câu hỏi === */}
            {part.questions.map((q, qIndex) => (
              <div key={qIndex} className="question-box">
                <label>Câu hỏi {qIndex + 1}</label>
                <textarea
                  className="form-control mb-2"
                  value={q.questionText}
                  onChange={(e) =>
                    handleQuestionChange(partIndex, qIndex, "questionText", e.target.value)
                  }
                />
                {q.options.map((o, oIndex) => (
                  <div key={oIndex} className="option-line">
                    <input
                      type="checkbox"
                      checked={o.isCorrect}
                      onChange={(e) =>
                        handleOptionChange(
                          partIndex,
                          qIndex,
                          oIndex,
                          "isCorrect",
                          e.target.checked
                        )
                      }
                    />
                    <span>{o.label}.</span>
                    <input
                      type="text"
                      placeholder="Đáp án"
                      className="form-control"
                      value={o.content}
                      onChange={(e) =>
                        handleOptionChange(
                          partIndex,
                          qIndex,
                          oIndex,
                          "content",
                          e.target.value
                        )
                      }
                    />
                  </div>
                ))}
                <div className="text-end mt-2">
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => removeQuestion(partIndex, qIndex)}
                  >
                    🗑️ Xóa câu hỏi
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              className="btn btn-outline-primary btn-sm mt-2"
              onClick={() => addQuestion(partIndex)}
            >
              + Thêm câu hỏi
            </button>
          </div>
        ))}

        <div className="text-center mt-3">
          <button type="button" className="btn btn-outline-success me-2" onClick={addPart}>
            + Thêm phần
          </button>
        </div>

        <button
          type="submit"
          className="btn btn-primary w-100 mt-3"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Đang gửi..." : "Tạo bài kiểm tra"}
        </button>

        {statusMessage && (
          <div className="alert alert-info text-center mt-3">{statusMessage}</div>
        )}
      </form>
    </div>
  );
};

export default TestCreationForm;
