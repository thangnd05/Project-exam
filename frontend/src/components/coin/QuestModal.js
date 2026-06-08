import {useCallback, useEffect, useState} from 'react';
import ReactDOM from 'react-dom';
import {Spinner} from 'react-bootstrap';
import {toast} from 'react-toastify';
import classNames from 'classnames/bind';
import {IoTrophyOutline, IoClose} from 'react-icons/io5';
import {CircleDollarSign, Clock, CheckCircle2} from 'lucide-react';

import {claimQuest, getMyQuests} from '~/api/questApi';
import {useCoins} from '~/hooks/useCoins';
import styles from './QuestModal.module.scss';

const cx = classNames.bind(styles);

// Modal to hiển thị toàn bộ nhiệm vụ (mở khi click badge xu).
function QuestModal({show, onClose}) {
  const {balance, refreshCoins} = useCoins();
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState(null);

  const loadQuests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyQuests();
      setQuests(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Không thể tải danh sách nhiệm vụ.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (show) {
      loadQuests();
    }
  }, [show, loadQuests]);

  const handleClaim = async (quest) => {
    setClaimingId(quest.questId);
    try {
      const result = await claimQuest(quest.questId);
      toast.success(`Đã nhận ${result.rewardCoins} xu!`);
      await refreshCoins();
      await loadQuests();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || 'Không thể nhận nhiệm vụ. Vui lòng thử lại.',
      );
    } finally {
      setClaimingId(null);
    }
  };

  const formatEndAt = (value) =>
    value ? new Date(value).toLocaleString('vi-VN') : null;

  if (!show) return null;

  return ReactDOM.createPortal(
    <div className={cx('modalOverlay')} onClick={onClose}>
      <div className={cx('modalContent')} onClick={(event) => event.stopPropagation()}>
        <div className={cx('header')}>
          <div className={cx('titleWrapper')}>
            <IoTrophyOutline />
            <h3 className={cx('title')}>Nhiệm vụ</h3>
            <span className={cx('balanceBadge')}>
              <CircleDollarSign size={15} />
              {balance} xu
            </span>
          </div>
          <button type="button" className={cx('closeBtn')} onClick={onClose} aria-label="Đóng">
            <IoClose />
          </button>
        </div>

        <div className={cx('body')}>
          {loading ? (
            <div className={cx('placeholder')}>
              <Spinner size="sm" className="me-2" />
              Đang tải nhiệm vụ...
            </div>
          ) : quests.length === 0 ? (
            <div className={cx('placeholder')}>Hiện chưa có nhiệm vụ nào.</div>
          ) : (
            <div className={cx('grid')}>
              {quests.map((quest) => {
                const hasTarget = quest.conditionType !== 'NONE' && quest.target > 0;
                const progressPct = hasTarget
                  ? Math.min(100, Math.round((quest.currentProgress / quest.target) * 100))
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
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default QuestModal;
