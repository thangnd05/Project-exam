import React, {useState, useEffect} from 'react';
import axios from 'axios';
import './CreateQuestionGroupPage.scss';

const QuestionGroupCreationForm = () => {
  const initialQuestion = {
    questionType: 'MCQ',
    questionText: '',
    options: [
      {label: 'A', content: '', isCorrect: false},
      {label: 'B', content: '', isCorrect: false},
      {label: 'C', content: '', isCorrect: false},
      {label: 'D', content: '', isCorrect: false},
    ],
  };

  const [examTypes, setExamTypes] = useState([]);
  const [examParts, setExamParts] = useState([]);
  const [classes, setClasses] = useState([]);

  const [formData, setFormData] = useState({
    classId: '',
    examTypeId: '',
    examPartId: '',
    passage: {passageType: 'READING', content: '', mediaFile: null},
    questions: [JSON.parse(JSON.stringify(initialQuestion))],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // 🟢 Fetch danh sách lớp học
  // 🟢 Fetch danh sách lớp học (của giáo viên)
  useEffect(() => {
    axios
      .get('/api/classes/my')
      .then((res) => {
        // Kiểm tra dữ liệu có đúng dạng không
        if (Array.isArray(res.data)) {
          setClasses(res.data);
        } else if (res.data.classes) {
          // fallback nếu backend trả object chứa field "classes"
          setClasses(res.data.classes);
        }
      })
      .catch((err) => console.error('❌ Lỗi khi tải danh sách lớp:', err));
  }, []);

  // 🟢 Fetch danh sách exam type
  useEffect(() => {
    axios
      .get('/api/exam-types')
      .then((res) => setExamTypes(res.data))
      .catch((err) => console.error('❌ Lỗi khi tải exam types:', err));
  }, []);

  // 🟢 Fetch exam part theo examType
  useEffect(() => {
    if (!formData.examTypeId) return;
    axios
      .get(`/api/exam-parts/by-exam-type/${formData.examTypeId}`)
      .then((res) => setExamParts(res.data))
      .catch((err) => console.error('❌ Lỗi khi tải exam parts:', err));
  }, [formData.examTypeId]);

  // 🟢 Cập nhật passage
  const handlePassageChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      passage: {...prev.passage, [field]: value},
    }));
  };

  // 🟢 Upload audio
  const handleFileChange = (file) => {
    setFormData((prev) => ({
      ...prev,
      passage: {...prev.passage, mediaFile: file},
    }));
  };

  const removeAudioFile = () => {
    setFormData((prev) => ({
      ...prev,
      passage: {...prev.passage, mediaFile: null},
    }));
  };

  // 🟢 Quản lý câu hỏi
  const addQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        JSON.parse(JSON.stringify(initialQuestion)),
      ],
    }));
  };

  const removeQuestion = (index) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const handleQuestionChange = (qIndex, field, value) => {
    const updated = [...formData.questions];
    updated[qIndex][field] = value;
    setFormData({...formData, questions: updated});
  };

  const handleOptionChange = (qIndex, oIndex, field, value) => {
    const updated = [...formData.questions];
    updated[qIndex].options[oIndex][field] = value;
    setFormData({...formData, questions: updated});
  };

  // 🟢 Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage('');

    // ✅ Kiểm tra passage có thực sự trống không
    const hasPassageContent =
      formData.passage.content?.trim() !== '' ||
      (formData.passage.passageType === 'LISTENING' &&
        formData.passage.mediaFile);

    // 🧱 Tạo payload cơ bản
    const payload = {
      classId: formData.classId ? parseInt(formData.classId) : null,
      examPartId: parseInt(formData.examPartId),
      questions: formData.questions.map((q) => ({
        questionType: q.questionType,
        questionText: q.questionText,
        answers: q.options.map((opt) => ({
          label: opt.label,
          answerText: opt.content,
          isCorrect: opt.isCorrect,
        })),
      })),
    };

    // ✅ Chỉ thêm passage nếu có nội dung / audio
    if (hasPassageContent) {
      payload.passage = {
        passageType: formData.passage.passageType,
        content: formData.passage.content,
      };
    }

    const sendData = new FormData();
    sendData.append('data', JSON.stringify(payload));

    if (
      hasPassageContent &&
      formData.passage.passageType === 'LISTENING' &&
      formData.passage.mediaFile
    ) {
      sendData.append('audioFile', formData.passage.mediaFile);
    }

    try {
      await axios.post('/api/questions/create-with-passage', sendData, {
        headers: {'Content-Type': 'multipart/form-data'},
      });
      setStatusMessage('✅ Tạo nhóm câu hỏi thành công!');
      // Reset form
      setFormData({
        classId: '',
        examTypeId: '',
        examPartId: '',
        passage: {passageType: 'READING', content: '', mediaFile: null},
        questions: [JSON.parse(JSON.stringify(initialQuestion))],
      });
    } catch (err) {
      console.error(err);
      setStatusMessage('❌ Lỗi khi tạo nhóm câu hỏi!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="test-creation-form container mt-4">
      <h2 className="form-title">🧠 Tạo nhóm câu hỏi theo Passage</h2>
      <form onSubmit={handleSubmit}>
        {/* === Chọn lớp học === */}
        {/* === Chọn lớp học === */}
        <div className="form-section">
          <label>Chọn lớp học</label>
          <select
            className="form-select"
            value={formData.classId}
            onChange={(e) =>
              setFormData({...formData, classId: e.target.value})
            }
          >
            <option value="">-- Chọn lớp học --</option>
            {classes.map((cls) => (
              <option key={cls.classId} value={cls.classId}>
                {cls.className}
              </option>
            ))}
          </select>
        </div>

        {/* === Chọn loại bài thi === */}
        <div className="form-section">
          <label>Loại bài thi</label>
          <select
            className="form-select"
            value={formData.examTypeId}
            onChange={(e) =>
              setFormData({...formData, examTypeId: e.target.value})
            }
          >
            <option value="">-- Chọn loại bài thi --</option>
            {examTypes.map((et) => (
              <option key={et.examTypeId} value={et.examTypeId}>
                {et.name}
              </option>
            ))}
          </select>
        </div>

        {/* === Chọn part === */}
        <div className="form-section">
          <label>Phần thi</label>
          <select
            className="form-select"
            value={formData.examPartId}
            onChange={(e) =>
              setFormData({...formData, examPartId: e.target.value})
            }
          >
            <option value="">-- Chọn phần thi --</option>
            {examParts.map((p) => (
              <option key={p.examPartId} value={p.examPartId}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* === Passage === */}
        <div className="form-section">
          <label>Loại passage</label>
          <select
            className="form-select"
            value={formData.passage.passageType}
            onChange={(e) => handlePassageChange('passageType', e.target.value)}
          >
            <option value="READING">Reading</option>
            <option value="LISTENING">Listening</option>
          </select>

          <label>Nội dung passage</label>
          <textarea
            className="form-control"
            value={formData.passage.content}
            onChange={(e) => handlePassageChange('content', e.target.value)}
          ></textarea>

          {formData.passage.passageType === 'LISTENING' && (
            <div className="mt-2">
              <label>Upload audio</label>
              <input
                type="file"
                accept="audio/*"
                className="form-control"
                onChange={(e) => handleFileChange(e.target.files[0])}
              />
              {formData.passage.mediaFile && (
                <div className="mt-2">
                  <audio
                    controls
                    src={URL.createObjectURL(formData.passage.mediaFile)}
                    className="w-100"
                  />
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm mt-2"
                    onClick={removeAudioFile}
                  >
                    Xóa audio
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* === Danh sách câu hỏi === */}
        {formData.questions.map((q, qIndex) => (
          <div key={qIndex} className="question-box mt-3">
            <label>Câu hỏi {qIndex + 1}</label>
            <textarea
              className="form-control mb-2"
              value={q.questionText}
              onChange={(e) =>
                handleQuestionChange(qIndex, 'questionText', e.target.value)
              }
            />
            {q.options.map((o, oIndex) => (
              <div key={oIndex} className="option-line">
                <input
                  type="checkbox"
                  checked={o.isCorrect}
                  onChange={(e) =>
                    handleOptionChange(
                      qIndex,
                      oIndex,
                      'isCorrect',
                      e.target.checked,
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
                      qIndex,
                      oIndex,
                      'content',
                      e.target.value,
                    )
                  }
                />
              </div>
            ))}
            <div className="text-end mt-2">
              <button
                type="button"
                className="btn btn-outline-danger btn-sm"
                onClick={() => removeQuestion(qIndex)}
              >
                🗑️ Xóa câu hỏi
              </button>
            </div>
          </div>
        ))}

        <div className="text-center mt-3">
          <button
            type="button"
            className="btn btn-outline-primary me-2"
            onClick={addQuestion}
          >
            + Thêm câu hỏi
          </button>
        </div>

        <button
          type="submit"
          className="btn btn-primary w-100 mt-3"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Đang gửi...' : 'Tạo nhóm câu hỏi'}
        </button>

        {statusMessage && (
          <div className="alert alert-info text-center mt-3">
            {statusMessage}
          </div>
        )}
      </form>
    </div>
  );
};

export default QuestionGroupCreationForm;
