'use client';

import {useState} from 'react';
import {Modal} from 'react-bootstrap';
import {useTranslations} from 'next-intl';
import classNames from 'classnames/bind';
import { X } from 'lucide-react';

import type {Vendor} from '@/app/[locale]/(public)/_lib/certificationMeta';
import {displayName, initials, useRankBoard} from './useRankBoard';
import styles from './RankScopeModal.module.scss';

const cx = classNames.bind(styles);

// Lấy tối đa bấy nhiêu người mỗi kỳ thi (backend giới hạn 100).
const FULL_LIMIT = 50;

// Nhãn tab lấy từ Home.rankScope.modal.tabs theo id.
const TABS: (Vendor | 'all')[] = ['all', 'aws', 'azure', 'gcp', 'other'];

type RankScopeModalProps = {
  show: boolean;
  onClose: () => void;
  onJoin: () => void;
};

function RankScopeModal({show, onClose, onJoin}: RankScopeModalProps) {
  const t = useTranslations('Home.rankScope');
  const [tab, setTab] = useState<Vendor | 'all'>('all');
  const {vendors, rowsFor, isLoading} = useRankBoard(FULL_LIMIT, show);

  const tabs = TABS.filter((id) => id === 'all' || vendors.includes(id));
  const rows = rowsFor(tab, FULL_LIMIT * Math.max(vendors.length, 1));

  const renderList = () => {
    if (isLoading) {
      return Array.from({length: 5}, (_, i) => <div key={i} className={cx('row', 'skeleton')} aria-hidden="true" />);
    }

    if (rows.length === 0) {
      return (
        <div className={cx('empty')}>
          <p className={cx('emptyTitle')}>{t('emptyTitle')}</p>
          <p>{t('modal.emptyText')}</p>
        </div>
      );
    }

    return rows.map(({entry, exam}, i) => {
      const rank = i + 1;
      const name = displayName(entry, t('anonymous'));
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
            {t('modal.title')}
          </h3>
          <p className={cx('subtitle')}>{t('modal.subtitle')}</p>
        </div>
        <button type="button" className={cx('closeBtn')} onClick={onClose} aria-label={t('modal.close')}>
          <X size="1em" aria-hidden="true" />
        </button>
      </div>

      <div className={cx('tabs')} role="tablist" aria-label={t('tabsAria')}>
        {tabs.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={cx('tab', {activeTab: tab === id})}
            onClick={() => setTab(id)}
          >
            {t(`modal.tabs.${id}`)}
          </button>
        ))}
      </div>

      <div key={tab} className={cx('list')} role="tabpanel">
        {renderList()}
      </div>

      <div className={cx('foot')}>
        <span className={cx('note')}>{t('modal.note')}</span>
        <div className={cx('footActions')}>
          <button type="button" className={cx('btnPrimary')} onClick={onJoin}>
            {t('modal.join')}
          </button>
          <button type="button" className={cx('btnSecondary')} onClick={onClose}>
            {t('modal.close')}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default RankScopeModal;
