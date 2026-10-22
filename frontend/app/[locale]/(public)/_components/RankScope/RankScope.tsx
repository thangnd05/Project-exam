'use client';

import {useState} from 'react';
import Link, { useLocalizeHref, useRouter } from '@/app/i18n/navigation';
import {useTranslations} from 'next-intl';
import {useQueryClient} from '@tanstack/react-query';
import classNames from 'classnames/bind';
import {FiArrowRight, FiRefreshCw} from 'react-icons/fi';

import routes from '@/app/configs/Routes';
import type {QuickChallengeCardResponse} from '@/app/types/test';
import type {Vendor} from '@/app/[locale]/(public)/_lib/certificationMeta';
import QuickTestConfirmModal from '@/app/[locale]/(public)/_components/HeroSection/QuickTestConfirmModal';
import QuickTestPickerModal from '@/app/[locale]/(public)/_components/HeroSection/QuickTestPickerModal';
import {useQuickChallengeTests} from '@/app/[locale]/(public)/_components/HeroSection/hooks/useQuickChallengeTests';
import {useQuickTestLauncher} from '@/app/[locale]/(public)/_components/HeroSection/hooks/useQuickTestLauncher';
import RankScopeModal from './RankScopeModal';
import {RANK_BOARD_KEY, displayName, initials, useRankBoard} from './useRankBoard';
import styles from './RankScope.module.scss';

const cx = classNames.bind(styles);

const TOP = 5;

// Nhãn tab lấy từ Home.rankScope.tabs theo id.
const TABS: (Vendor | 'all')[] = ['all', 'aws', 'azure', 'gcp', 'other'];

function RankScope() {
  const t = useTranslations('Home.rankScope');
  const router = useRouter();
  const localizeHref = useLocalizeHref();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Vendor | 'all'>('all');
  const [spinKey, setSpinKey] = useState(0);
  const [fullOpen, setFullOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const {vendors, rowsFor, isLoading, isFetching} = useRankBoard(TOP);
  const {quickTests, isLoading: quickLoading} = useQuickChallengeTests();
  const {pendingTest, requestStart, closeConfirm, confirmStart, startSyllabusPlan, isGuest} =
    useQuickTestLauncher();

  const tabs = TABS.filter((id) => id === 'all' || vendors.includes(id));
  const rows = rowsFor(tab);

  const refresh = () => {
    setSpinKey((k) => k + 1);
    queryClient.invalidateQueries({queryKey: [RANK_BOARD_KEY]});
  };

  // "Thi ngay để ghi danh": đóng bảng xếp hạng rồi mở hộp chọn đề nhanh; chưa có đề thì sang kho đề.
  const joinFromModal = () => {
    setFullOpen(false);
    if (quickLoading || quickTests.length > 0) {
      setPickerOpen(true);
      return;
    }
    router.push(localizeHref(routes.examTypes));
  };

  const pickTest = (test: QuickChallengeCardResponse) => {
    setPickerOpen(false);
    requestStart(test);
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
            <FiArrowRight aria-hidden="true" />
          </Link>
        </div>
      );
    }

    return rows.map(({entry, exam}, i) => {
      const rank = i + 1;
      const tone = rank <= 3 ? `rank${rank}` : 'rankRest';
      const name = displayName(entry, t('anonymous'));

      return (
        <div key={`${exam.examTypeId}-${entry.rank}-${name}`} className={cx('row', 'dataRow', tone)}>
          <div className={cx('rankNo')}>{String(rank).padStart(2, '0')}</div>
          <div className={cx('person')}>
            <span className={cx('avatar')} aria-hidden="true">{initials(name)}</span>
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
            <button type="button" className={cx('outlineBtn')} onClick={refresh} disabled={isFetching}>
              <FiRefreshCw key={spinKey} className={cx('refreshIcon', {spinning: spinKey > 0})} aria-hidden="true" />
              <span>{isFetching ? t('syncing') : t('refresh')}</span>
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
            <button type="button" className={cx('outlineBtn')} onClick={() => setFullOpen(true)}>
              <span>{t('viewAll')}</span>
              <FiArrowRight className={cx('arrow')} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <RankScopeModal show={fullOpen} onClose={() => setFullOpen(false)} onJoin={joinFromModal} />
      <QuickTestPickerModal
        show={pickerOpen}
        tests={quickTests}
        loading={quickLoading}
        onClose={() => setPickerOpen(false)}
        onSelect={pickTest}
      />
      <QuickTestConfirmModal
        show={Boolean(pendingTest)}
        test={pendingTest}
        onClose={closeConfirm}
        onConfirm={confirmStart}
        onStartSyllabusPlan={startSyllabusPlan}
        isGuest={isGuest}
      />
    </section>
  );
}

export default RankScope;
