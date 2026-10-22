'use client';

import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Spinner} from 'react-bootstrap';
import {toast} from 'react-toastify';
import classNames from 'classnames/bind';
import {useLocale, useTranslations} from 'next-intl';
import {CircleDollarSign, Clock, CheckCircle2} from 'lucide-react';

import {getMyQuests, QUESTS_QUERY_KEY} from '@/app/apis/questApi';
import {formatFullNumber} from '@/app/utils/formatNumber';
import {useCoins} from '@/app/features/gamification/coin/hooks/useCoins';
import {useClaimQuest} from '@/app/features/gamification/coin/hooks/useClaimQuest';
import BaseModal from '@/app/components/modal/BaseModal';
import CosmeticShop from '@/app/features/gamification/cosmetic/CosmeticShop';
import {QuestConditionType} from '@/app/enums';
import type {UserQuestResponse} from '@/app/types';
import styles from '@/app/features/gamification/coin/QuestModal.module.scss';

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
  const t = useTranslations('Gamification');
  const locale = useLocale();
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
        toast.success(t('quests.claimSuccess', {coins: result.rewardCoins ?? 0}));
      },
      onError: (error) => {
        toast.error(
          error?.response?.data?.message || t('quests.claimError'),
        );
      },
    });
  };

  const formatEndAt = (value?: string) =>
    value ? new Date(value).toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN') : null;

  const balanceBadge = (
    <span className={cx('balanceBadge')}>
      <CircleDollarSign size={15} />
      {t('coins.amount', {amount: formatFullNumber(balance, locale)})}
    </span>
  );

  const renderQuests = () => {
    if (loading) {
      return (
        <div className={cx('placeholder')}>
          <Spinner size="sm" className="me-2" />
          {t('quests.loading')}
        </div>
      );
    }
    if (quests.length === 0) {
      return (
        <div className={cx('placeholder')}>{t('quests.empty')}</div>
      );
    }
    const {claimable, inProgress, claimed} = groupByStatus(quests);
    return (
      <div className={cx('groups')}>
        {claimable.length > 0 && (
          <section>
            <h3 className={cx('groupTitle', 'groupTitleHot')}>
              {t('quests.claimable', {count: claimable.length})}
            </h3>
            <div className={cx('list')}>{claimable.map(renderQuestRow)}</div>
          </section>
        )}
        {inProgress.length > 0 && (
          <section>
            <h3 className={cx('groupTitle')}>{t('quests.inProgress', {count: inProgress.length})}</h3>
            <div className={cx('list')}>{inProgress.map(renderQuestRow)}</div>
          </section>
        )}
        {claimed.length > 0 && (
          <details className={cx('claimedGroup')}>
            <summary className={cx('groupTitle')}>{t('quests.claimed', {count: claimed.length})}</summary>
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
              {t('quests.endsAt', {date: formatEndAt(quest.endAt) ?? ''})}
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
              {t('quests.claimedBadge')}
            </span>
          ) : quest.eligible ? (
            <button
              type="button"
              className={cx('claimBtn')}
              disabled={claimingId === quest.questId}
              onClick={() => handleClaim(quest)}
            >
              {claimingId === quest.questId ? t('quests.claiming') : t('quests.claim')}
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
      title={t('quests.title')}
      headerExtra={balanceBadge}
      maxWidth={880}
    >
      <div className={cx('tabs')}>
        <button
          type="button"
          className={cx('tab', {active: tab === 'quests'})}
          onClick={() => setTab('quests')}
        >
          {t('quests.tabQuests')}
        </button>
        <button
          type="button"
          className={cx('tab', {active: tab === 'shop'})}
          onClick={() => setTab('shop')}
        >
          {t('quests.tabShop')}
        </button>
      </div>

      {tab === 'quests' ? renderQuests() : <CosmeticShop />}
    </BaseModal>
  );
}

export default QuestModal;
