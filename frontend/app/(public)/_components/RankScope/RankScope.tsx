'use client';

import {useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {useQueryClient} from '@tanstack/react-query';
import classNames from 'classnames/bind';
import {FiArrowRight, FiRefreshCw} from 'react-icons/fi';

import routes from '@/app/configs/Routes';
import type {QuickChallengeCardResponse} from '@/app/types/test';
import type {Vendor} from '@/app/(public)/_lib/certificationMeta';
import QuickTestConfirmModal from '@/app/(public)/_components/HeroSection/QuickTestConfirmModal';
import QuickTestPickerModal from '@/app/(public)/_components/HeroSection/QuickTestPickerModal';
import {useQuickChallengeTests} from '@/app/(public)/_components/HeroSection/hooks/useQuickChallengeTests';
import {useQuickTestLauncher} from '@/app/(public)/_components/HeroSection/hooks/useQuickTestLauncher';
import RankScopeModal from './RankScopeModal';
import {RANK_BOARD_KEY, displayName, initials, useRankBoard} from './useRankBoard';
import styles from './RankScope.module.scss';

const cx = classNames.bind(styles);

const TOP = 5;

const TABS: {id: Vendor | 'all'; label: string}[] = [
  {id: 'all', label: 'Tất cả'},
  {id: 'aws', label: 'AWS'},
  {id: 'azure', label: 'Azure'},
  {id: 'gcp', label: 'Google Cloud'},
  {id: 'other', label: 'Linux / Khác'},
];

function RankScope() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Vendor | 'all'>('all');
  const [spinKey, setSpinKey] = useState(0);
  const [fullOpen, setFullOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const {vendors, rowsFor, isLoading, isFetching} = useRankBoard(TOP);
  const {quickTests, isLoading: quickLoading} = useQuickChallengeTests();
  const {pendingTest, requestStart, closeConfirm, confirmStart, startSyllabusPlan, isGuest} =
    useQuickTestLauncher();

  const tabs = TABS.filter((t) => t.id === 'all' || vendors.includes(t.id as Vendor));
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
    router.push(routes.examTypes);
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
          <p className={cx('emptyTitle')}>Chưa có ai lên bảng xếp hạng</p>
          <p>Hoàn thành một đề Full Mock để trở thành người đầu tiên góp mặt.</p>
          <Link href={routes.examTypes} className={cx('emptyLink')}>
            Vào kho đề thi
            <FiArrowRight aria-hidden="true" />
          </Link>
        </div>
      );
    }

    return rows.map(({entry, exam}, i) => {
      const rank = i + 1;
      const tone = rank <= 3 ? `rank${rank}` : 'rankRest';
      const name = displayName(entry);

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
                TOP {TOP} kỹ sư đạt điểm cao nhất từ bài thi Full Mock chuẩn Blueprint
              </p>
            </div>
            <button type="button" className={cx('outlineBtn')} onClick={refresh} disabled={isFetching}>
              <FiRefreshCw key={spinKey} className={cx('refreshIcon', {spinning: spinKey > 0})} aria-hidden="true" />
              <span>{isFetching ? 'Đang đồng bộ...' : 'Làm mới dữ liệu'}</span>
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

          <div className={cx('row', 'headRow')}>
            <div className={cx('center')}>Hạng</div>
            <div>Kỹ sư</div>
            <div>Chứng chỉ</div>
            <div className={cx('right')}>Tổng điểm</div>
          </div>

          <div key={tab} className={cx('list')} role="tabpanel">
            {renderRows()}
          </div>

          <div className={cx('cardFoot')}>
            <button type="button" className={cx('outlineBtn')} onClick={() => setFullOpen(true)}>
              <span>Xem toàn bộ bảng xếp hạng</span>
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
