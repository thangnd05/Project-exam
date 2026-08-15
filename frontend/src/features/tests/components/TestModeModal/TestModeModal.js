import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import classNames from 'classnames/bind';
import {
  IoBookOutline,
  IoDocumentTextOutline,
  IoPlayOutline,
  IoTimeOutline,
  IoRadioButtonOnOutline,
  IoTrophyOutline,
  IoStatsChartOutline,
} from 'react-icons/io5';
import { toast } from 'react-toastify';

import BaseModal from '~/shared/ui/modal/BaseModal';
import RecoveryResourceLink from '~/shared/resources/RecoveryResourceLink';
import { getTestPartsSummary } from '~/shared/api/testApi';
import { getResourcesByParts } from '~/shared/api/recoveryResourceApi';
import styles from './TestModeModal.module.scss';

const cx = classNames.bind(styles);

export const testModeKeys = {
  parts: (testId) => ['test-parts-summary', testId],
  partResources: (testId) => ['test-part-resources', testId],
};

const normalizeParts = (data) => (Array.isArray(data) ? data : []);

function TestModeModal({ show, test, onClose, onStart }) {
  const [tab, setTab] = useState('exam');
  const [selected, setSelected] = useState(() => new Set());

  const partsQuery = useQuery({
    queryKey: testModeKeys.parts(test?.testId),
    queryFn: () => getTestPartsSummary(test.testId),
    enabled: !!show && !!test?.testId,
    select: normalizeParts,
  });

  const parts = partsQuery.data ?? [];
  const loading = partsQuery.isLoading;

  const partResourcesQuery = useQuery({
    queryKey: testModeKeys.partResources(test?.testId),
    queryFn: () => getResourcesByParts(parts.map((p) => p.examPartId)),
    enabled: !!show && tab === 'practice' && parts.length > 0,
    select: normalizeParts,
  });
  const partResources = partResourcesQuery.data ?? [];

  useEffect(() => {
    if (!show || !test?.testId) return;
    setTab('exam');
    setSelected(new Set());
  }, [show, test?.testId]);

  useEffect(() => {
    if (partsQuery.isError) {
      toast.error('Không tải được danh sách phần thi.');
    }
  }, [partsQuery.isError]);

  const totalQuestions = useMemo(
    () => parts.reduce((sum, p) => sum + (p.questionCount || 0), 0),
    [parts],
  );

  const grouped = useMemo(() => {
    const map = new Map();
    parts.forEach((p) => {
      const key = p.skillName || 'Khác';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(p);
    });
    return [...map.entries()];
  }, [parts]);

  const selectedCount = useMemo(
    () =>
      parts
        .filter((p) => selected.has(p.examPartId))
        .reduce((sum, p) => sum + (p.questionCount || 0), 0),
    [parts, selected],
  );

  const allSelected = parts.length > 0 && selected.size === parts.length;

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(parts.map((p) => p.examPartId)));
  };

  const togglePart = (examPartId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(examPartId)) next.delete(examPartId);
      else next.add(examPartId);
      return next;
    });
  };

  const durationLabel =
    test?.durationMinutes != null ? `${test.durationMinutes} phút` : 'Không giới hạn';

  const handleStartFull = () => {
    onStart?.({ mode: 'full' });
  };

  const handleStartPractice = () => {
    if (selected.size === 0) return;

    const examPartIds = parts
      .filter((p) => selected.has(p.examPartId))
      .map((p) => p.examPartId);
    onStart?.({ mode: 'practice', examPartIds });
  };

  return (
    <BaseModal
      show={show}
      onClose={onClose}
      title="Chọn chế độ"
      maxWidth={640}
    >
      <div className={cx('tabs')}>
        <button
          type="button"
          className={cx('tab', { active: tab === 'exam' })}
          onClick={() => setTab('exam')}
        >
          <IoDocumentTextOutline />
          Luyện thi
        </button>
        <button
          type="button"
          className={cx('tab', { active: tab === 'practice' })}
          onClick={() => setTab('practice')}
        >
          <IoRadioButtonOnOutline />
          Luyện tập
        </button>
      </div>

      <div className={cx('panel')}>
      {tab === 'exam' ? (
        <div className={cx('exam-card')}>
          <div className={cx('exam-head')}>
            <span className={cx('exam-icon')}>
              <IoDocumentTextOutline />
            </span>
            <div className={cx('exam-info')}>
              <h4> {test?.title}</h4>
              <p>Làm đầy đủ đề như thi thật, có tính giờ.</p>
            </div>
          </div>

          <div className={cx('pills')}>
            <span className={cx('pill')}>
              <IoTimeOutline /> {durationLabel}
            </span>
            {totalQuestions > 0 && (
              <span className={cx('pill')}>
                <IoDocumentTextOutline /> {totalQuestions} câu
              </span>
            )}
          </div>

          <ul className={cx('features')}>
            <li>
              <IoTimeOutline />
              <span>Tính giờ như phòng thi thật</span>
            </li>
            <li>
              <IoStatsChartOutline />
              <span>Chấm điểm chi tiết &amp; lưu lịch sử</span>
            </li>
            <li>
              <IoTrophyOutline />
              <span>Ghi nhận thành tích lên bảng xếp hạng</span>
            </li>
          </ul>

          <button
            type="button"
            className={cx('exam-start')}
            onClick={handleStartFull}
          >
            Bắt đầu thi
          </button>
        </div>
      ) : (
        <div className={cx('practice')}>
          <p className={cx('practice-hint')}>
            Chọn Part để luyện  <strong>không giới hạn thời gian</strong>.
          </p>

          {partResources.length > 0 && (
            <div className={cx('guide-box')}>
              <div className={cx('guide-title')}>
                <IoBookOutline /> Giới thiệu &amp; cách làm
              </div>
              <ul className={cx('guide-list')}>
                {partResources.map((r) => (
                  <li key={r.resourceId}>
                    <RecoveryResourceLink resource={r} className={cx('guide-link')}>
                      {r.examPartName ? `${r.examPartName}: ` : ''}{r.title}
                    </RecoveryResourceLink>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {loading ? (
            <div className={cx('loading')}>Đang tải danh sách phần thi...</div>
          ) : parts.length === 0 ? (
            <div className={cx('loading')}>Đề này chưa có phần thi nào.</div>
          ) : (
            <>
              <button
                type="button"
                className={cx('part-row', 'select-all', { checked: allSelected })}
                onClick={toggleAll}
              >
                <span className={cx('checkbox', { checked: allSelected })} />
                <span className={cx('part-name')}>
                  Chọn tất cả {parts.length} Part
                </span>
                <span className={cx('part-count')}>{totalQuestions} câu</span>
              </button>

              <div className={cx('part-scroll')}>
                {grouped.map(([section, list]) => (
                  <div key={section} className={cx('section')}>

                    {grouped.length > 1 && (
                      <div className={cx('section-title')}>{section}</div>
                    )}
                    <div className={cx('part-grid')}>
                      {list.map((p) => {
                        const checked = selected.has(p.examPartId);
                        return (
                          <button
                            key={p.examPartId}
                            type="button"
                            className={cx('part-row', { checked })}
                            onClick={() => togglePart(p.examPartId)}
                          >
                            <span className={cx('checkbox', { checked })} />
                            <span className={cx('part-name')}>{p.partName}</span>
                            <span className={cx('part-count')}>
                              {p.questionCount || 0} câu
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className={cx('practice-footer')}>
                <span className={cx('summary')}>
                  Đã chọn <strong>{selectedCount}</strong> câu
                </span>
                <button
                  type="button"
                  className={cx('start-btn')}
                  onClick={handleStartPractice}
                  disabled={selected.size === 0}
                >
                  <IoPlayOutline />
                  Bắt đầu
                </button>
              </div>
            </>
          )}
        </div>
      )}
      </div>
    </BaseModal>
  );
}

export default TestModeModal;
