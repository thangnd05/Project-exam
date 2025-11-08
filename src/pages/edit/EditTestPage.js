import {useEffect, useState} from 'react';
import axios from 'axios';
import styles from '../test/CreateTestPage.module.scss';
import classNames from 'classnames/bind';
import {useParams, useNavigate} from 'react-router-dom';

const cx = classNames.bind(styles);

function EditTestPage() {
  const {testId} = useParams();
  const navigate = useNavigate();

  const [examTypes, setExamTypes] = useState([]);
  const [selectedExamType, setSelectedExamType] = useState('');
  const [examParts, setExamParts] = useState([]);

  const [testName, setTestName] = useState('');
  const [testDescription, setTestDescription] = useState('');
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerUrl, setBannerUrl] = useState('');
  const [numQuestions, setNumQuestions] = useState({});
  const [maxQuestions, setMaxQuestions] = useState({});
  const [mode, setMode] = useState({});
  const [enabledParts, setEnabledParts] = useState({});
  const [selectedQuestions, setSelectedQuestions] = useState({});
  const [questionBank, setQuestionBank] = useState({});
  const [availableFrom, setAvailableFrom] = useState('');
  const [availableTo, setAvailableTo] = useState('');
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [durationMinutes, setDurationMinutes] = useState('');
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');

  // 🟢 Load danh sách lớp
  useEffect(() => {
    axios
      .get('/api/classes/my')
      .then((res) => {
        if (Array.isArray(res.data)) setClasses(res.data);
        else if (res.data.classes) setClasses(res.data.classes);
      })
      .catch((err) => console.error('❌ Lỗi tải lớp:', err));
  }, []);

  // 🟢 Load danh sách loại kỳ thi
  useEffect(() => {
    axios
      .get('/api/exam-types')
      .then((res) => setExamTypes(res.data))
      .catch((err) => console.error('❌ Lỗi tải exam types:', err));
  }, []);

  // 🟢 Khi chọn loại kỳ thi → load các Part
  const handleExamTypeChange = async (examTypeId, overrideClassId) => {
    if (!examTypeId) {
      setSelectedExamType('');
      setExamParts([]);
      setNumQuestions({});
      setMaxQuestions({});
      setMode({});
      setEnabledParts({});
      setQuestionBank({});
      return;
    }

    const usedClassId = overrideClassId ?? classId;
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
        initMode[p.examPartId] = 'random';
        initEnabled[p.examPartId] = true;

        try {
          const countUrl = usedClassId
            ? `/api/questions/count/by-part/${p.examPartId}?classId=${usedClassId}`
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

      return parts;
    } catch (err) {
      console.error('❌ Lỗi tải parts:', err);
    }
  };

  // 🟢 Load dữ liệu bài thi hiện tại
  useEffect(() => {
    if (!testId) return;
    axios
      .get(`/api/tests/${testId}`)
      .then(async (res) => {
        const test = res.data;
        setTestName(test.title || '');
        setTestDescription(test.description || '');
        setAvailableFrom(test.availableFrom || '');
        setAvailableTo(test.availableTo || '');
        setDurationMinutes(test.durationMinutes || 60);
        setMaxAttempts(test.maxAttempts || 1);
        setSelectedExamType(test.examTypeId || '');
        setClassId(test.classId || '');
        setBannerUrl(test.bannerUrl || '');

        // 🟢 Load parts
        const parts = await handleExamTypeChange(test.examTypeId, test.classId);

        // 🟢 Nếu backend trả về parts với questions
        if (test.parts && test.parts.length > 0) {
          const initNums = {};
          const initMode = {};
          const initEnabled = {};
          const selectedQs = {};

          for (const part of test.parts) {
            initEnabled[part.examPartId] = true;
            initNums[part.examPartId] = part.numQuestions || 0;

            if (part.questions && part.questions.length > 0) {
              initMode[part.examPartId] = 'manual';
              selectedQs[part.examPartId] = part.questions.map(
                (q) => q.questionId,
              );
            } else {
              initMode[part.examPartId] = 'random';
              selectedQs[part.examPartId] = [];
            }
          }

          setMode(initMode);
          setEnabledParts(initEnabled);
          setNumQuestions(initNums);
          setSelectedQuestions(selectedQs);
        }
      })
      .catch((err) => {
        console.error('❌ Lỗi tải test:', err);
        alert('Không tải được dữ liệu đề thi!');
      });
  }, [testId]);

  // 🧮 Thay đổi số câu
  const handleNumChange = (partId, value) => {
    const val = parseInt(value, 10) || 0;
    const max = maxQuestions[partId] || 0;
    if (val > max) {
      alert(`❌ Số câu vượt quá (${max})`);
      return;
    }
    setNumQuestions((prev) => ({...prev, [partId]: val}));
  };

  // 🔁 Đổi chế độ random/manual
  const handleModeChange = async (partId, newMode) => {
    setMode((prev) => ({...prev, [partId]: newMode}));
    if (newMode === 'manual' && !questionBank[partId]) {
      try {
        const url = classId
          ? `/api/questions/by-part/${partId}?classId=${classId}`
          : `/api/questions/by-part/${partId}`;
        const res = await axios.get(url);
        setQuestionBank((prev) => ({...prev, [partId]: res.data || []}));
      } catch (err) {
        console.error('❌ Lỗi tải câu hỏi:', err);
      }
    }
  };

  const handleSelectQuestion = (partId, questionId, checked) => {
    setSelectedQuestions((prev) => {
      const prevList = prev[partId] || [];
      const newList = checked
        ? [...prevList, questionId]
        : prevList.filter((id) => id !== questionId);
      return {...prev, [partId]: newList};
    });
  };

  const handleFileChange = (e) => setBannerFile(e.target.files[0]);

  // 🟢 Gửi cập nhật test
  const handleUpdateTest = async () => {
    if (!selectedExamType || !testName.trim()) {
      alert('Vui lòng chọn loại kỳ thi và nhập tên đề thi!');
      return;
    }

    const parts = examParts
      .filter((p) => enabledParts[p.examPartId])
      .map((p) => {
        const partId = p.examPartId;
        const isRandom = mode[partId] === 'random';
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

    const payload = {
      title: testName,
      description: testDescription,
      examTypeId: parseInt(selectedExamType, 10),
      durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : 60,
      availableFrom: availableFrom || null,
      availableTo: availableTo || null,
      maxAttempts: parseInt(maxAttempts, 10) || 1,
      classId: classId ? parseInt(classId, 10) : null,
      parts,
    };

    const formData = new FormData();
    formData.append('data', JSON.stringify(payload));
    if (bannerFile) formData.append('banner', bannerFile);

    try {
      await axios.put(`/api/tests/${testId}`, formData, {
        headers: {'Content-Type': 'multipart/form-data'},
        withCredentials: true,
      });

      alert('✅ Cập nhật đề thi thành công!');
      navigate(`/tests/${testId}`);
    } catch (err) {
      console.error('❌ Lỗi cập nhật:', err.response?.data || err);
      alert('Cập nhật thất bại!');
    }
  };

  return (
    <div className={cx('container')}>
      <h2 className={cx('title')}>✏️ Cập nhật đề thi</h2>

      {/* === CHỌN LỚP === */}
      <div className={cx('form-group')}>
        <label>Chọn lớp học</label>
        <select
          className="form-select"
          value={classId}
          onChange={(e) => {
            const newClassId = e.target.value;
            setClassId(newClassId);
            setExamParts([]);
            setNumQuestions({});
            setMaxQuestions({});
            setMode({});
            setEnabledParts({});
            setQuestionBank({});
            setSelectedQuestions({});
            if (selectedExamType)
              handleExamTypeChange(selectedExamType, newClassId);
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

      {/* === CHỌN LOẠI KỲ THI === */}
      <div className={cx('form-group')}>
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

      {/* === THÔNG TIN CHUNG === */}
      <div className={cx('form-group')}>
        <label>Tên đề thi</label>
        <input
          type="text"
          className="form-control"
          value={testName}
          onChange={(e) => setTestName(e.target.value)}
        />
      </div>

      <div className={cx('form-group')}>
        <label>Mô tả</label>
        <textarea
          className="form-control"
          value={testDescription}
          onChange={(e) => setTestDescription(e.target.value)}
        />
      </div>

      <div className={cx('form-grid')}>
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

      <div className={cx('form-grid')}>
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

      <div className={cx('form-group')}>
        <label>Ảnh banner</label>
        <input
          type="file"
          className="form-control"
          accept="image/*"
          onChange={handleFileChange}
        />
        {bannerUrl && (
          <div className="mt-2">
            <img
              src={bannerUrl}
              alt="banner"
              width="250"
              className="rounded shadow"
            />
          </div>
        )}
      </div>

      {/* === DANH SÁCH PART === */}
      {examParts.length > 0 &&
        examParts.map((p) => (
          <div key={p.examPartId} className={cx('part-block')}>
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
                value={mode[p.examPartId] || 'random'}
                onChange={(e) => handleModeChange(p.examPartId, e.target.value)}
              >
                <option value="random">Ngẫu nhiên</option>
                <option value="manual">Thủ công</option>
              </select>
            </div>

            {mode[p.examPartId] === 'random' && (
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
                />
                <small className="text-muted">
                  Tối đa: {maxQuestions[p.examPartId] || 0} câu
                </small>
              </div>
            )}

            {mode[p.examPartId] === 'manual' && (
              <div className={cx('manual-select')}>
                {questionBank[p.examPartId] ? (
                  questionBank[p.examPartId].map((q) => (
                    <label key={q.questionId} className="d-block">
                      <input
                        type="checkbox"
                        checked={
                          selectedQuestions[p.examPartId]?.includes(
                            q.questionId,
                          ) || false
                        }
                        onChange={(e) =>
                          handleSelectQuestion(
                            p.examPartId,
                            q.questionId,
                            e.target.checked,
                          )
                        }
                      />{' '}
                      {q.questionText}
                    </label>
                  ))
                ) : (
                  <i>Đang tải câu hỏi...</i>
                )}
              </div>
            )}
          </div>
        ))}

      <button className={cx('btn-create')} onClick={handleUpdateTest}>
        💾 Lưu thay đổi
      </button>
    </div>
  );
}

export default EditTestPage;
