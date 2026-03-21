import React, { useEffect, useState } from 'react';
import { Alert, Button, Spinner } from 'react-bootstrap';
import axios from 'axios';
import classNames from 'classnames/bind';
import {
  IoBookOutline,
  IoChevronDownOutline,
  IoChevronUpOutline,
  IoCreateOutline,
  IoLibraryOutline,
  IoSchoolOutline,
} from 'react-icons/io5';
import { useBaseMetaData } from '~/hook/useBaseMetaData';
import EditQuestionModal from '~/components/modals/EditQuestionModal';
import styles from '~/pages/create-test-from-bank/CreateTestFromBankPage.module.scss';

const cx = classNames.bind(styles);

const PersonalQuestionBankPage = () => {
  const [examTypeId, setExamTypeId] = useState('');
  const [partConfigs, setPartConfigs] = useState({});
  const [notification, setNotification] = useState({});
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [editingPartId, setEditingPartId] = useState(null);

  const { examTypes, examParts } = useBaseMetaData(examTypeId);

  const loadQuestionsForPart = async (partId) => {
    setPartConfigs((prev) => ({
      ...prev,
      [partId]: { ...(prev[partId] || {}), loading: true },
    }));
    try {
      const res = await axios.get(`/api/questions/by-part/${partId}`);
      const list = Array.isArray(res.data) ? res.data : res.data?.data ?? res.data?.questions ?? [];
      setPartConfigs((prev) => ({
        ...prev,
        [partId]: {
          ...(prev[partId] || {}),
          loading: false,
          questions: list,
        },
      }));
    } catch (error) {
      setPartConfigs((prev) => ({
        ...prev,
        [partId]: {
          ...(prev[partId] || {}),
          loading: false,
          questions: [],
        },
      }));
      setNotification({ type: 'danger', message: 'Không tải được danh sách câu hỏi.' });
    }
  };

  useEffect(() => {
    if (!examTypeId || !examParts?.length) {
      setPartConfigs({});
      return;
    }
    const initial = {};
    examParts.forEach((p) => {
      initial[p.examPartId] = { expanded: false, loading: true, questions: [] };
    });
    setPartConfigs(initial);
    examParts.forEach((p) => {
      loadQuestionsForPart(p.examPartId);
    });
  }, [examTypeId, examParts]);

  const toggleExpanded = (partId) => {
    setPartConfigs((prev) => ({
      ...prev,
      [partId]: { ...(prev[partId] || {}), expanded: !prev[partId]?.expanded },
    }));
  };

  const handleEditSuccess = async () => {
    setEditingQuestionId(null);
    if (editingPartId) {
      await loadQuestionsForPart(editingPartId);
    }
  };

  return (
    <div className={cx('wrapper')}>
      <div className={cx('container')}>
        <header className={cx('header')}>
          <h1 className={cx('title')}>
            <IoLibraryOutline /> Kho câu hỏi cá nhân
          </h1>
          <p className={cx('subtitle')}>
            Quản lý câu hỏi đã lưu theo từng Part. Bấm bút chì để sửa nhanh câu hỏi/đáp án.
          </p>
        </header>

        {notification.message && (
          <Alert variant={notification.type} className="mb-3" dismissible onClose={() => setNotification({})}>
            {notification.message}
          </Alert>
        )}

        <div className={cx('configCard')}>
          <div className={cx('sectionTitle')}>
            <IoSchoolOutline /> Chọn loại kỳ thi
          </div>
          <select
            className={cx('input')}
            value={examTypeId}
            onChange={(e) => setExamTypeId(e.target.value)}
            aria-label="Loại kỳ thi"
          >
            <option value="">-- Chọn loại kỳ thi --</option>
            {(examTypes || []).map((t) => (
              <option key={t.examTypeId} value={t.examTypeId}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {examTypeId && examParts?.length > 0 && (
          <div className={cx('configCard')}>
            <div className={cx('sectionTitle')}>
              <IoBookOutline /> Danh sách câu hỏi theo Part
            </div>

            {examParts.map((part) => {
              const cfg = partConfigs[part.examPartId] || { expanded: false, loading: false, questions: [] };
              const total = cfg.questions?.length || 0;
              return (
                <div key={part.examPartId} className={cx('partCard')}>
                  <button
                    type="button"
                    className={cx('partCardHeader')}
                    onClick={() => toggleExpanded(part.examPartId)}
                    aria-expanded={cfg.expanded}
                  >
                    <span className={cx('partName')}>
                      <IoBookOutline size={20} /> {part.name}
                    </span>
                    <span className={cx('partBadge')}>{total} câu</span>
                    {cfg.expanded ? <IoChevronUpOutline size={22} /> : <IoChevronDownOutline size={22} />}
                  </button>

                  {cfg.expanded && (
                    <div className={cx('partCardBody')}>
                      {cfg.loading ? (
                        <div className={cx('loadingWrap')}>
                          <Spinner animation="border" size="sm" /> <span>Đang tải câu hỏi...</span>
                        </div>
                      ) : total === 0 ? (
                        <Alert variant="info" className="mb-0">
                          Part này chưa có câu hỏi.
                        </Alert>
                      ) : (
                        <ul className={cx('questionList')} role="list">
                          {cfg.questions.map((q, idx) => {
                            const id = q.questionId ?? q.id;
                            if (!id) return null;
                            return (
                              <li key={id} className={cx('questionItem')}>
                                <span className={cx('questionIndex')}>{idx + 1}.</span>
                                <span className={cx('questionText')}>
                                  {q.questionText || '(Không có nội dung)'}
                                </span>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline-primary"
                                  onClick={() => {
                                    setEditingPartId(part.examPartId);
                                    setEditingQuestionId(id);
                                  }}
                                  aria-label={`Sửa câu ${idx + 1}`}
                                >
                                  <IoCreateOutline />
                                </Button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <EditQuestionModal
        show={!!editingQuestionId}
        onHide={() => setEditingQuestionId(null)}
        questionId={editingQuestionId}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
};

export default PersonalQuestionBankPage;

