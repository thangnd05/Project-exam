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
  QuestConditionType.STREAK_DAYS,
  QuestConditionType.CREATE_LEARNING_PLAN,
  QuestConditionType.COMPLETE_LEARNING_PLAN,
];

type QuestGroup = {
  type: UserQuestResponse['conditionType'];
  title?: string;
  items: UserQuestResponse[];
};

const groupTitle = (quest: UserQuestResponse) =>
  quest.conditionType === QuestConditionType.NONE ? 'Nhiệm vụ chung' : quest.conditionLabel;

function groupByCondition(quests: UserQuestResponse[]): QuestGroup[] {
  const groups = new Map<UserQuestResponse['conditionType'], QuestGroup>();
  quests.forEach((quest) => {
    const key = quest.conditionType;
    if (!groups.has(key)) {
      groups.set(key, {type: key, title: groupTitle(quest), items: []});
    }
    groups.get(key)!.items.push(quest);
  });
  return Array.from(groups.values()).sort(
    (a, b) => CONDITION_ORDER.indexOf(a.type!) - CONDITION_ORDER.indexOf(b.type!),
  );
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

  const {
    data: quests = [],
    isLoading: loading,
  } = useQuery({
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
          error?.response?.data?.message || 'Không thể nhận nhiệm vụ. Vui lòng thử lại.',
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
      return <div className={cx('placeholder')}>Hiện chưa có nhiệm vụ nào.</div>;
    }
    return (
      <div className={cx('groups')}>
        {groupByCondition(quests).map((group) => (
          <section key={group.type} className={cx('group')}>
            <h3 className={cx('groupTitle')}>{group.title}</h3>
            <div className={cx('grid')}>{group.items.map(renderQuestCard)}</div>
          </section>
        ))}
      </div>
    );
  };

  const renderQuestCard = (quest: UserQuestResponse) => {
    const hasTarget = quest.conditionType !== QuestConditionType.NONE && quest.target! > 0;
    const progressPct = hasTarget
      ? Math.min(100, Math.round((quest.currentProgress! / quest.target!) * 100))
      : 100;

    return (
      <div key={quest.questId} className={cx('card', {claimed: quest.claimed})}>
        <div className={cx('cardHead')}>
          <h4>{quest.title}</h4>
          <span className={cx('reward')}>
            <CircleDollarSign size={15} />
            {quest.rewardCoins}
          </span>
        </div>

        {quest.description && <p className={cx('desc')}>{quest.description}</p>}

        {hasTarget && (
          <div className={cx('progress')}>
            <div className={cx('progressBar')}>
              <div className={cx('progressFill')} style={{width: `${progressPct}%`}} />
            </div>
            <span className={cx('progressText')}>
              {quest.conditionLabel}: {quest.currentProgress}/{quest.target}
            </span>
          </div>
        )}

        {quest.endAt && (
          <div className={cx('deadline')}>
            <Clock size={13} />
            Kết thúc: {formatEndAt(quest.endAt)}
          </div>
        )}

        <div className={cx('cardFoot')}>
          {quest.claimed ? (
            <span className={cx('doneBadge')}>
              <CheckCircle2 size={16} />
              Đã nhận
            </span>
          ) : (
            <button
              type="button"
              className={cx('claimBtn')}
              disabled={!quest.eligible || claimingId === quest.questId}
              onClick={() => handleClaim(quest)}
            >
              {claimingId === quest.questId
                ? 'Đang nhận...'
                : quest.eligible
                  ? 'Nhận xu'
                  : 'Chưa đủ điều kiện'}
            </button>
          )}
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
