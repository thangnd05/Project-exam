'use client';

import {useState} from 'react';
import {Modal} from 'react-bootstrap';
import {useTranslations} from 'next-intl';
import classNames from 'classnames/bind';
import { X } from 'lucide-react';

import ButtonPrime from '@/app/components/Button/ButtonPrime';
import type {Vendor} from '@/app/[locale]/(public)/_lib/certificationMeta';
import RankAvatar from './RankAvatar';
import {displayName, useRankBoard} from './useRankBoard';
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
            <RankAvatar className={cx('avatar')} name={name} src={entry.avatarUrl} />
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
        <ButtonPrime
          variant="onDark"
          size="icon"
          className={cx('closeBtn')}
          onClick={onClose}
          aria-label={t('modal.close')}
        >
          <X size="1em" aria-hidden="true" />
        </ButtonPrime>
      </div>

      <div className={cx('tabs')} role="tablist" aria-label={t('tabsAria')}>
        {tabs.map((id) => (
          <ButtonPrime
            key={id}
            variant={tab === id ? 'primary' : 'onDark'}
            size="sm"
            role="tab"
            aria-selected={tab === id}
            className={cx('tab')}
            onClick={() => setTab(id)}
          >
            {t(`modal.tabs.${id}`)}
          </ButtonPrime>
        ))}
      </div>

      <div key={tab} className={cx('list')} role="tabpanel">
        {renderList()}
      </div>

      <div className={cx('foot')}>
        <span className={cx('note')}>{t('modal.note')}</span>
        <div className={cx('footActions')}>
          <ButtonPrime className={cx('joinBtn')} onClick={onJoin}>
            {t('modal.join')}
          </ButtonPrime>
          <ButtonPrime variant="onDark" onClick={onClose}>
            {t('modal.close')}
          </ButtonPrime>
        </div>
      </div>
    </Modal>
  );
}

export default RankScopeModal;
