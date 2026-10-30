'use client';

import {useState} from 'react';
import Link from '@/app/i18n/navigation';
import {useTranslations} from 'next-intl';
import {useQueryClient} from '@tanstack/react-query';
import classNames from 'classnames/bind';
import { ArrowRight, RefreshCw, UserRound } from 'lucide-react';

import ButtonPrime from '@/app/components/Button/ButtonPrime';
import routes from '@/app/configs/Routes';
import type {Vendor} from '@/app/[locale]/(public)/_lib/certificationMeta';
import QuickTestConfirmModal from '@/app/[locale]/(public)/_components/HeroSection/QuickTestConfirmModal';
import {useQuickTestEntry} from '@/app/[locale]/(public)/_components/HeroSection/hooks/useQuickTestEntry';
import RankScopeModal from './RankScopeModal';
import RankAvatar from './RankAvatar';
import {RANK_BOARD_KEY, displayName, useRankBoard} from './useRankBoard';
import styles from './RankScope.module.scss';

const cx = classNames.bind(styles);

const TOP = 5;

// Nhãn tab lấy từ Home.rankScope.tabs theo id.
const TABS: (Vendor | 'all')[] = ['all', 'aws', 'azure', 'gcp', 'other'];

function RankScope() {
  const t = useTranslations('Home.rankScope');
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Vendor | 'all'>('all');
  const [spinKey, setSpinKey] = useState(0);
  const [fullOpen, setFullOpen] = useState(false);

  const {vendors, rowsFor, isLoading, isFetching} = useRankBoard(TOP);
  const {openQuick, confirmProps} = useQuickTestEntry();

  const tabs = TABS.filter((id) => id === 'all' || vendors.includes(id));
  const rows = rowsFor(tab);

  const refresh = () => {
    setSpinKey((k) => k + 1);
    queryClient.invalidateQueries({queryKey: [RANK_BOARD_KEY]});
  };

  // "Thi ngay để ghi danh": đóng bảng xếp hạng rồi mở hộp đề nhanh; chưa có đề thì sang kho đề.
  const joinFromModal = () => {
    setFullOpen(false);
    openQuick();
  };

  const renderRows = () => {
    if (isLoading) {
      return Array.from({length: TOP}, (_, i) => (
        <div key={i} className={cx('row', 'skeletonRow')} aria-hidden="true">
          <span className={cx('skeleton')} />
          <span className={cx('skeleton')} />
          <span className={cx('skeleton')} />
          <span className={cx('skeleton')} />
        </div>
      ));
    }

    if (rows.length === 0) {
      return (
        <div className={cx('empty')}>
          <p className={cx('emptyTitle')}>{t('emptyTitle')}</p>
          <p>{t('emptyText')}</p>
          <Link href={routes.examTypes} className={cx('emptyLink')}>
            {t('emptyLink')}
            <ArrowRight size="1em" aria-hidden="true" />
          </Link>
        </div>
      );
    }

    // Luôn đủ TOP hạng: hạng chưa có người hiện dòng giữ chỗ để bảng không bị cụt.
    const vacant = Array.from({length: TOP - rows.length}, (_, i) => {
      const rank = rows.length + i + 1;
      return (
        <div key={`vacant-${rank}`} className={cx('row', 'dataRow', 'vacantRow')} aria-hidden="true">
          <div className={cx('rankNo')}>{String(rank).padStart(2, '0')}</div>
          <div className={cx('person')}>
            <span className={cx('avatar')}>
              <UserRound size="1.25em" />
            </span>
            <span className={cx('ghost', 'ghostName')} />
          </div>
          <div className={cx('cert')}>
            <span className={cx('ghost', 'ghostCert')} />
          </div>
          <div className={cx('score')}>
            <span className={cx('ghost', 'ghostScore')} />
          </div>
        </div>
      );
    });

    const filled = rows.map(({entry, exam}, i) => {
      const rank = i + 1;
      const tone = rank <= 3 ? `rank${rank}` : 'rankRest';
      const name = displayName(entry, t('anonymous'));

      return (
        <div key={`${exam.examTypeId}-${entry.rank}-${name}`} className={cx('row', 'dataRow', tone)}>
          <div className={cx('rankNo')}>{String(rank).padStart(2, '0')}</div>
          <div className={cx('person')}>
            <RankAvatar className={cx('avatar')} name={name} src={entry.avatarUrl} />
            <p className={cx('personName')}>{name}</p>
          </div>
          <div className={cx('cert')}>
            {exam.badge && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={exam.badge} alt="" className={cx('certBadge')} />
            )}
            <span className={cx('certName')}>{exam.name}</span>
          </div>
          <div className={cx('score')}>
            <span className={cx('scoreVal')}>{Math.round(entry.totalScore ?? 0)}</span>
            <span className={cx('scoreMax')}> / {exam.scoreMax}</span>
          </div>
        </div>
      );
    });

    return [...filled, ...vacant];
  };

  return (
    <section id="rankscope" className={cx('section')}>
      <div className={cx('inner')}>
        <div className={cx('card')}>
          <div className={cx('cardHead')}>
            <div>
              <h2 className={cx('title')}>RankScope</h2>
              <p className={cx('subtitle')}>
                {t('subtitle', {count: TOP})}
              </p>
            </div>
            <ButtonPrime variant="outline" size="md" className={cx('cardBtn')} onClick={refresh} disabled={isFetching}>
              <RefreshCw size="1em" key={spinKey} className={cx('refreshIcon', {spinning: spinKey > 0})} aria-hidden="true" />
              <span>{isFetching ? t('syncing') : t('refresh')}</span>
            </ButtonPrime>
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
                {t(`tabs.${id}`)}
              </button>
            ))}
          </div>

          <div className={cx('row', 'headRow')}>
            <div className={cx('center')}>{t('columns.rank')}</div>
            <div>{t('columns.engineer')}</div>
            <div>{t('columns.certification')}</div>
            <div className={cx('right')}>{t('columns.totalScore')}</div>
          </div>

          <div key={tab} className={cx('list')} role="tabpanel">
            {renderRows()}
          </div>

          <div className={cx('cardFoot')}>
            <ButtonPrime variant="outline" size="md" className={cx('cardBtn')} onClick={() => setFullOpen(true)}>
              <span>{t('viewAll')}</span>
              <ArrowRight size="1em" className={cx('arrow')} aria-hidden="true" />
            </ButtonPrime>
          </div>
        </div>
      </div>

      <RankScopeModal show={fullOpen} onClose={() => setFullOpen(false)} onJoin={joinFromModal} />
      <QuickTestConfirmModal {...confirmProps} />
    </section>
  );
}

export default RankScope;
