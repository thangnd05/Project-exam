'use client';

import {useState} from 'react';
import {Modal} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {FiX} from 'react-icons/fi';

import type {Vendor} from '@/app/utils/certificationMeta';
import {displayName, initials, useRankBoard} from './useRankBoard';
import styles from './RankScopeModal.module.scss';

const cx = classNames.bind(styles);

// Lấy tối đa bấy nhiêu người mỗi kỳ thi (backend giới hạn 100).
const FULL_LIMIT = 50;

const TABS: {id: Vendor | 'all'; label: string}[] = [
  {id: 'all', label: 'Tất cả'},
  {id: 'aws', label: 'AWS'},
  {id: 'azure', label: 'Azure'},
  {id: 'gcp', label: 'GCP'},
  {id: 'other', label: 'LPIC / Khác'},
];

type RankScopeModalProps = {
  show: boolean;
  onClose: () => void;
  onJoin: () => void;
};

function RankScopeModal({show, onClose, onJoin}: RankScopeModalProps) {
  const [tab, setTab] = useState<Vendor | 'all'>('all');
  const {vendors, rowsFor, isLoading} = useRankBoard(FULL_LIMIT, show);

  const tabs = TABS.filter((t) => t.id === 'all' || vendors.includes(t.id as Vendor));
  const rows = rowsFor(tab, FULL_LIMIT * Math.max(vendors.length, 1));

  const renderList = () => {
    if (isLoading) {
      return Array.from({length: 5}, (_, i) => <div key={i} className={cx('row', 'skeleton')} aria-hidden="true" />);
    }

    if (rows.length === 0) {
      return (
        <div className={cx('empty')}>
          <p className={cx('emptyTitle')}>Chưa có ai lên bảng xếp hạng</p>
          <p>Hoàn thành một đề Full Mock để trở thành người đầu tiên được ghi danh.</p>
        </div>
      );
    }

    return rows.map(({entry, exam}, i) => {
      const rank = i + 1;
      const name = displayName(entry);
      const tone = rank === 1 ? 'top' : rank <= 3 ? 'podium' : 'rest';

      return (
        <div key={`${exam.examTypeId}-${entry.rank}-${name}`} className={cx('row', tone)}>
          <div className={cx('who')}>
            <span className={cx('rankNo')}>{String(rank).padStart(2, '0')}</span>
            <span className={cx('avatar')} aria-hidden="true">{initials(name)}</span>
            <div className={cx('meta')}>
              <p className={cx('name')}>{name}</p>
              <p className={cx('exam')}>{exam.name}</p>
            </div>
          </div>
          <div className={cx('score')}>
            <span className={cx('scoreVal')}>{Math.round(entry.totalScore ?? 0)}</span>
            <span className={cx('scoreMax')}> / {exam.scoreMax}</span>
          </div>
        </div>
      );
    });
  };

  return (
    <Modal
      show={show}
      onHide={onClose}
      centered
      dialogClassName={cx('dialog')}
      contentClassName={cx('content')}
      backdropClassName={cx('backdrop')}
      aria-labelledby="rankscope-modal-title"
    >
      <div className={cx('head')}>
        <div>
          <h3 id="rankscope-modal-title" className={cx('title')}>
            Bảng xếp hạng RankScope toàn hệ thống
          </h3>
          <p className={cx('subtitle')}>Vinh danh các thí sinh đạt điểm cao nhất từ đề thi Full Mock Test</p>
        </div>
        <button type="button" className={cx('closeBtn')} onClick={onClose} aria-label="Đóng">
          <FiX aria-hidden="true" />
        </button>
      </div>

      <div className={cx('tabs')} role="tablist" aria-label="Lọc theo hãng">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={cx('tab', {activeTab: tab === t.id})}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div key={tab} className={cx('list')} role="tabpanel">
        {renderList()}
      </div>

      <div className={cx('foot')}>
        <span className={cx('note')}>Cập nhật liên tục từ kết quả thi Full Mock đạt chuẩn</span>
        <div className={cx('footActions')}>
          <button type="button" className={cx('btnPrimary')} onClick={onJoin}>
            Thi ngay để ghi danh
          </button>
          <button type="button" className={cx('btnSecondary')} onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default RankScopeModal;
