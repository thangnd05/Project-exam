import React, {useState, useEffect} from 'react';
import axios from 'axios';
import './QuestionUpdatePage.scss';
import {useParams} from 'react-router-dom'; // ✅ thêm dòng này

const QuestionUpdatePage = () => {
  const {id} = useParams(); // ✅ lấy id từ URL
  const questionId = id; // hoặc Number(id)
  const [examTypes, setExamTypes] = useState([]);
  const [examParts, setExamParts] = useState([]);
  const [classes, setClasses] = useState([]);

  const [formData, setFormData] = useState({
    examTypeId: '',
    examPartId: '',
    classId: '',
    questionText: '',
    questionType: 'MCQ',
    passage: {
      passageType: 'READING',
      content: '',
      mediaUrl: null,
      mediaFile: null,
    },
    answers: [
      {label: 'A', answerText: '', isCorrect: false},
      {label: 'B', answerText: '', isCorrect: false},
      {label: 'C', answerText: '', isCorrect: false},
      {label: 'D', answerText: '', isCorrect: false},
    ],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // 🟢 Fetch exam types
  useEffect(() => {
    axios
      .get('/api/exam-types')
      .then((res) => setExamTypes(res.data))
      .catch((err) => console.error('❌ Lỗi khi tải ExamType:', err));
  }, []);

  // 🟢 Fetch exam parts theo examType
  useEffect(() => {
    if (!formData.examTypeId) return;
    axios
      .get(`/api/exam-parts/by-exam-type/${formData.examTypeId}`)
      .then((res) => setExamParts(res.data))
      .catch((err) => console.error('❌ Lỗi khi tải ExamPart:', err));
  }, [formData.examTypeId]);

  // 🟢 Fetch danh sách lớp học
  useEffect(() => {
    axios
      .get('/api/classes/my')
      .then((res) => {
        if (Array.isArray(res.data)) setClasses(res.data);
        else if (res.data.classes) setClasses(res.data.classes);
      })
      .catch((err) => console.error('❌ Lỗi khi tải danh sách lớp:', err));
  }, []);

  // 🟢 Fetch dữ liệu câu hỏi hiện tại
  useEffect(() => {
    if (!questionId) return;

    axios
      .get(`/api/questions/${questionId}`)
      .then((res) => {
        const q = res.data || {};

        setFormData({
          // ⚠️ Ép kiểu sang string để React select hiển thị đúng option
          examTypeId: q.examTypeId ? String(q.examTypeId) : '',
          examPartId: q.examPartId ? String(q.examPartId) : '',
          classId: q.classId ? String(q.classId) : '',
          questionText: q.questionText || '',
          questionType: q.questionType || 'MCQ',
          passage: {
            passageType: q.passage?.passageType || 'READING',
            content: q.passage?.content || '',
            mediaUrl: q.passage?.mediaUrl || null,
            mediaFile: null,
          },
          answers: q.answers?.map((a) => ({
            label: a.answerLabel || a.label || '',
            answerText: a.answerText || '',
            isCorrect: a.isCorrect || false,
          })) || [
            {label: 'A', answerText: '', isCorrect: false},
            {label: 'B', answerText: '', isCorrect: false},
            {label: 'C', answerText: '', isCorrect: false},
            {label: 'D', answerText: '', isCorrect: false},
          ],
        });
      })
      .catch((err) => console.error('❌ Lỗi khi tải câu hỏi:', err));
  }, [questionId]);

  // 🟢 Handlers
  const handleChange = (field, value) => {
    setFormData({...formData, [field]: value});
  };

  const handlePassageChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      passage: {...prev.passage, [field]: value},
    }));
  };

  const handleAnswerChange = (index, field, value) => {
    const updated = [...formData.answers];
    updated[index][field] = value;
    setFormData({...formData, answers: updated});
  };

  const handleFileChange = (file) => {
    setFormData((prev) => ({
      ...prev,
      passage: {...prev.passage, mediaFile: file},
    }));
  };

  // 🟢 Submit update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage('');

    const payload = {
      examPartId: parseInt(formData.examPartId),
      classId: formData.classId ? parseInt(formData.classId) : null,
      questionText: formData.questionText,
      questionType: formData.questionType,
      passage: {
        passageType: formData.passage.passageType,
        content: formData.passage.content,
        mediaUrl: formData.passage.mediaUrl || null,
      },
      answers: formData.answers.map((a) => ({
        label: a.label,
        answerText: a.answerText,
        isCorrect: a.isCorrect,
      })),
    };

    const sendData = new FormData();
    sendData.append('data', JSON.stringify(payload));

    if (
      formData.passage.passageType === 'LISTENING' &&
      formData.passage.mediaFile
    ) {
      sendData.append('audioFile', formData.passage.mediaFile);
    }

    try {
      await axios.put(`/api/questions/${questionId}`, sendData, {
        headers: {'Content-Type': 'multipart/form-data'},
      });
      setStatusMessage('✅ Cập nhật câu hỏi thành công!');
    } catch (err) {
      console.error('❌ Lỗi khi cập nhật câu hỏi:', err);
      setStatusMessage('❌ Lỗi khi cập nhật câu hỏi!');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==================== UI ====================
  return (
    <div className="question-update-form container mt-4">
      <h2 className="form-title">✏️ Cập nhật câu hỏi</h2>
      <form onSubmit={handleSubmit}>
        {/* === Chọn kỳ thi === */}
        <div className="form-section">
          <label>Kỳ thi</label>
          <select
            className="form-select"
            value={formData.examTypeId}
            onChange={(e) => handleChange('examTypeId', e.target.value)}
          >
            <option value="">-- Chọn kỳ thi --</option>
            {examTypes.map((et) => (
              <option key={et.examTypeId} value={String(et.examTypeId)}>
                {et.name}
              </option>
            ))}
          </select>
        </div>

        {/* === Chọn phần thi === */}
        <div className="form-section">
          <label>Phần thi</label>
          <select
            className="form-select"
            value={formData.examPartId}
            onChange={(e) => handleChange('examPartId', e.target.value)}
          >
            <option value="">-- Chọn phần thi --</option>
            {examParts.map((p) => (
              <option key={p.examPartId} value={String(p.examPartId)}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* === Chọn lớp === */}
        <div className="form-section">
          <label>Lớp học</label>
          <select
            className="form-select"
            value={formData.classId}
            onChange={(e) => handleChange('classId', e.target.value)}
          >
            <option value="">-- Chọn lớp học --</option>
            {classes.map((cls) => (
              <option key={cls.classId} value={String(cls.classId)}>
                {cls.className}
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
          />

          {formData.passage.passageType === 'LISTENING' && (
            <div className="mt-2">
              <label>Upload audio mới (nếu muốn thay)</label>
              <input
                type="file"
                accept="audio/*"
                className="form-control"
                onChange={(e) => handleFileChange(e.target.files[0])}
              />
              {formData.passage.mediaUrl && !formData.passage.mediaFile && (
                <audio
                  controls
                  src={formData.passage.mediaUrl}
                  className="mt-2"
                />
              )}
            </div>
          )}
        </div>

        {/* === Câu hỏi & đáp án === */}
        <div className="form-section">
          <label>Câu hỏi</label>
          <textarea
            className="form-control"
            value={formData.questionText}
            onChange={(e) => handleChange('questionText', e.target.value)}
          />
        </div>

        <div className="form-section">
          <h5>Đáp án</h5>
          {formData.answers.map((a, i) => (
            <div key={i} className="option-line mb-2 d-flex align-items-center">
              <input
                type="checkbox"
                checked={a.isCorrect}
                onChange={(e) =>
                  handleAnswerChange(i, 'isCorrect', e.target.checked)
                }
              />
              <span className="ms-2 fw-bold">{a.label}.</span>
              <input
                type="text"
                className="form-control ms-2"
                placeholder="Nội dung đáp án"
                value={a.answerText}
                onChange={(e) =>
                  handleAnswerChange(i, 'answerText', e.target.value)
                }
              />
            </div>
          ))}
        </div>

        <button
          type="submit"
          className="btn btn-primary w-100 mt-3"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Đang cập nhật...' : 'Lưu thay đổi'}
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

export default QuestionUpdatePage;
