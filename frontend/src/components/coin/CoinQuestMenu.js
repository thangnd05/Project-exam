import {useCallback, useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {Spinner} from 'react-bootstrap';
import {toast} from 'react-toastify';
import classNames from 'classnames/bind';
import {CircleDollarSign, Clock, CheckCircle2, ChevronRight} from 'lucide-react';

import {claimQuest, getMyQuests} from '~/api/questApi';
import {useCoins} from '~/hooks/useCoins';
import routes from '~/config/Routes';
import CoinBadge from './CoinBadge';
import style from './CoinQuestMenu.module.scss';

const cx = classNames.bind(style);

// Badge xu + panel nhiệm vụ xổ ra khi click (không cần nhảy sang trang riêng).
function CoinQuestMenu() {
  const {refreshCoins} = useCoins();
  const [open, setOpen] = useState(false);
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [claimingId, setClaimingId] = useState(null);
  const wrapperRef = useRef(null);

  const loadQuests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyQuests();
      setQuests(Array.isArray(data) ? data : []);
    } catch (error) {
      // im lặng trong popover, tránh spam toast khi mở
    } finally {
      setLoading(false);
    }
  }, []);

  // Mỗi lần mở panel thì lấy nhiệm vụ mới nhất.
  useEffect(() => {
    if (open) {
      loadQuests();
    }
  }, [open, loadQuests]);

  // Click ra ngoài thì đóng.
  useEffect(() => {
    if (!open) return undefined;
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

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

  return (
    <div className={cx('wrapper')} ref={wrapperRef}>
      <button
        type="button"
        className={cx('trigger')}
        onClick={() => setOpen((previous) => !previous)}
        title="Xem nhiệm vụ"
      >
        <CoinBadge />
      </button>

      {open && (
        <div className={cx('panel')}>
          <div className={cx('panelHead')}>Nhiệm vụ</div>

          <div className={cx('panelBody')}>
            {loading ? (
              <div className={cx('placeholder')}>
                <Spinner size="sm" className="me-2" />
                Đang tải...
              </div>
            ) : quests.length === 0 ? (
              <div className={cx('placeholder')}>Hiện chưa có nhiệm vụ nào.</div>
            ) : (
              quests.map((quest) => {
                const hasTarget = quest.conditionType !== 'NONE' && quest.target > 0;
                const progressPct = hasTarget
                  ? Math.min(100, Math.round((quest.currentProgress / quest.target) * 100))
                  : 100;

                return (
                  <div key={quest.questId} className={cx('item', {claimed: quest.claimed})}>
                    <div className={cx('itemHead')}>
                      <span className={cx('itemTitle')}>{quest.title}</span>
                      <span className={cx('reward')}>
                        <CircleDollarSign size={14} />
                        {quest.rewardCoins}
                      </span>
                    </div>

                    {hasTarget && (
                      <div className={cx('progress')}>
                        <div className={cx('progressBar')}>
                          <div
                            className={cx('progressFill')}
                            style={{width: `${progressPct}%`}}
                          />
                        </div>
                        <span className={cx('progressText')}>
                          {quest.currentProgress}/{quest.target}
                        </span>
                      </div>
                    )}

                    {quest.endAt && (
                      <div className={cx('deadline')}>
                        <Clock size={12} />
                        {formatEndAt(quest.endAt)}
                      </div>
                    )}

                    {quest.claimed ? (
                      <span className={cx('doneBadge')}>
                        <CheckCircle2 size={14} />
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
                );
              })
            )}
          </div>

          <Link
            to={routes.quests}
            className={cx('viewAll')}
            onClick={() => setOpen(false)}
          >
            Xem tất cả
            <ChevronRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}

export default CoinQuestMenu;
