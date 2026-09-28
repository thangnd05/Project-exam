'use client';

import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Spinner} from 'react-bootstrap';
import {toast} from 'react-toastify';
import classNames from 'classnames/bind';
import {CircleDollarSign, Clock, CheckCircle2} from 'lucide-react';

import {getMyQuests, QUESTS_QUERY_KEY} from '@/app/apis/questApi';
import {useCoins} from '@/app/hooks/useCoins';
import {useClaimQuest} from '@/app/components/gamification/coin/hooks/useClaimQuest';
import BaseModal from '@/app/components/modal/BaseModal';
import CosmeticShop from '@/app/components/gamification/cosmetic/CosmeticShop';
import {QuestConditionType} from '@/app/enums';
import type {UserQuestResponse} from '@/app/types';
import styles from './QuestModal.module.scss';

const cx = classNames.bind(styles);

const CONDITION_ORDER: QuestConditionType[] = [
  QuestConditionType.NONE,
  QuestConditionType.COMPLETE_TEST,
  QuestConditionType.SET_TARGET,
  QuestConditionType.STREAK_DAYS,
  QuestConditionType.CREATE_LEARNING_PLAN,
  QuestConditionType.COMPLETE_PLAN_TASK,
  QuestConditionType.COMPLETE_LEARNING_PLAN,
];

const byCondition = (a: UserQuestResponse, b: UserQuestResponse) =>
  CONDITION_ORDER.indexOf(a.conditionType!) - CONDITION_ORDER.indexOf(b.conditionType!);

// Chia theo trạng thái thay vì loại điều kiện: việc cần làm ngay nằm trên, đã nhận thu gọn cuối cùng.
function groupByStatus(quests: UserQuestResponse[]) {
  const sorted = [...quests].sort(byCondition);
  return {
    claimable: sorted.filter((q) => !q.claimed && q.eligible),
    inProgress: sorted.filter((q) => !q.claimed && !q.eligible),
    claimed: sorted.filter((q) => q.claimed),
  };
}

type QuestModalProps = {
  show: boolean;
  onClose: () => void;
};

function QuestModal({show, onClose}: QuestModalProps) {
  const {balance} = useCoins();
  const [tab, setTab] = useState<'quests' | 'shop'>('quests');
  const claimMutation = useClaimQuest();
  const claimingId = claimMutation.isPending ? claimMutation.variables : null;

  const {data: quests = [], isLoading: loading} = useQuery({
    queryKey: QUESTS_QUERY_KEY,
    queryFn: getMyQuests,
    enabled: show,
    select: (data) => (Array.isArray(data) ? data : []),
  });

  const handleClaim = (quest: UserQuestResponse) => {
    claimMutation.mutate(quest.questId, {
      onSuccess: (result) => {
        toast.success(`Đã nhận ${result.rewardCoins} xu!`);
      },
      onError: (error) => {
        toast.error(
          error?.response?.data?.message ||
            'Không thể nhận nhiệm vụ. Vui lòng thử lại.',
        );
      },
    });
  };

  const formatEndAt = (value?: string) =>
    value ? new Date(value).toLocaleString('vi-VN') : null;

  const balanceBadge = (
    <span className={cx('balanceBadge')}>
      <CircleDollarSign size={15} />
      {Number(balance).toLocaleString('vi-VN')} xu
    </span>
  );

  const renderQuests = () => {
    if (loading) {
      return (
        <div className={cx('placeholder')}>
          <Spinner size="sm" className="me-2" />
          Đang tải nhiệm vụ...
        </div>
      );
    }
    if (quests.length === 0) {
      return (
        <div className={cx('placeholder')}>Hiện chưa có nhiệm vụ nào.</div>
      );
    }
    const {claimable, inProgress, claimed} = groupByStatus(quests);
    return (
      <div className={cx('groups')}>
        {claimable.length > 0 && (
          <section>
            <h3 className={cx('groupTitle', 'groupTitleHot')}>
              Có thể nhận ({claimable.length})
            </h3>
            <div className={cx('list')}>{claimable.map(renderQuestRow)}</div>
          </section>
        )}
        {inProgress.length > 0 && (
          <section>
            <h3 className={cx('groupTitle')}>Đang làm ({inProgress.length})</h3>
            <div className={cx('list')}>{inProgress.map(renderQuestRow)}</div>
          </section>
        )}
        {claimed.length > 0 && (
          <details className={cx('claimedGroup')}>
            <summary className={cx('groupTitle')}>Đã nhận ({claimed.length})</summary>
            <div className={cx('list')}>{claimed.map(renderQuestRow)}</div>
          </details>
        )}
      </div>
    );
  };

  const renderQuestRow = (quest: UserQuestResponse) => {
    const hasTarget =
      quest.conditionType !== QuestConditionType.NONE && quest.target! > 0;
    const progressPct = hasTarget
      ? Math.min(
          100,
          Math.round((quest.currentProgress! / quest.target!) * 100),
        )
      : 100;

    return (
      <div key={quest.questId} className={cx('row', {claimed: quest.claimed})}>
        <div className={cx('rowMain')}>
          <h4 className={cx('rowTitle')}>{quest.title}</h4>
          {quest.description && (
            <p className={cx('desc')} title={quest.description}>
              {quest.description}
            </p>
          )}
          {hasTarget && !quest.claimed && (
            <div className={cx('progress')}>
              <div className={cx('progressBar')}>
                <div
                  className={cx('progressFill')}
                  style={{width: `${progressPct}%`}}
                />
              </div>
              <span className={cx('progressText')}>
                {quest.conditionLabel}: {quest.currentProgress}/{quest.target}
              </span>
            </div>
          )}
          {quest.endAt && !quest.claimed && (
            <div className={cx('deadline')}>
              <Clock size={13} />
              Kết thúc: {formatEndAt(quest.endAt)}
            </div>
          )}
        </div>

        <div className={cx('rowSide')}>
          <span className={cx('reward')}>
            <CircleDollarSign size={14} />
            {quest.rewardCoins}
          </span>
          {quest.claimed ? (
            <span className={cx('doneBadge')}>
              <CheckCircle2 size={15} />
              Đã nhận
            </span>
          ) : quest.eligible ? (
            <button
              type="button"
              className={cx('claimBtn')}
              disabled={claimingId === quest.questId}
              onClick={() => handleClaim(quest)}
            >
              {claimingId === quest.questId ? 'Đang nhận...' : 'Nhận xu'}
            </button>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <BaseModal
      show={show}
      onClose={onClose}
      title="Phần thưởng"
      headerExtra={balanceBadge}
      maxWidth={880}
    >
      <div className={cx('tabs')}>
        <button
          type="button"
          className={cx('tab', {active: tab === 'quests'})}
          onClick={() => setTab('quests')}
        >
          Nhiệm vụ
        </button>
        <button
          type="button"
          className={cx('tab', {active: tab === 'shop'})}
          onClick={() => setTab('shop')}
        >
          Cửa hàng
        </button>
      </div>

      {tab === 'quests' ? renderQuests() : <CosmeticShop />}
    </BaseModal>
  );
}

export default QuestModal;
