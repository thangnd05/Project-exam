import { useCallback, useEffect, useRef, useState } from 'react';
import { IoPlay, IoVolumeHigh, IoArrowForward } from 'react-icons/io5';
import classNames from 'classnames/bind';

import { getFullMediaUrl } from '~/shared/utils/mediaUrl';
import styles from './GatedAudioPlayer.module.scss';

const cx = classNames.bind(styles);

/**
 * Player audio phần nghe kiểu TOEIC: tự phát (autoplay), khoá tua/replay, phát tuần tự nhiều
 * clip nếu có; hết audio cuối thì gọi onCompleted NGAY để tự chuyển câu (không đợi).
 *
 * Vì browser thường chặn autoplay có tiếng nếu thiếu user-gesture, khi bị chặn sẽ hiện nút
 * "Phát audio" để người dùng chạm 1 lần (arm).
 *
 * @param {string[]} urls        Danh sách URL audio (theo thứ tự phát).
 * @param {() => void} onCompleted  Gọi ngay khi phát hết clip cuối (tự chuyển câu).
 */
function GatedAudioPlayer({ urls = [], onCompleted }) {
  const audioRef = useRef(null);
  const completedRef = useRef(false);

  const [clipIdx, setClipIdx] = useState(0);
  const [phase, setPhase] = useState('loading'); // loading | armNeeded | playing | ended

  const total = urls.length;

  const complete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onCompleted?.();
  }, [onCompleted]);

  const tryPlay = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    const p = el.play();
    if (p && typeof p.then === 'function') {
      p.then(() => setPhase('playing')).catch(() => setPhase('armNeeded'));
    } else {
      setPhase('playing');
    }
  }, []);

  // Thử autoplay khi mount hoặc khi chuyển sang clip mới.
  useEffect(() => {
    if (total === 0) {
      complete();
      return;
    }
    tryPlay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clipIdx, total]);

  const handleEnded = () => {
    if (clipIdx < total - 1) {
      setClipIdx((i) => i + 1); // sang clip tiếp theo (effect sẽ tự play)
    } else {
      setPhase('ended');
      complete(); // hết audio -> chuyển câu NGAY, không đợi
    }
  };

  // Chặn tua: nếu người dùng cố seek, kéo về vị trí đã phát xa nhất.
  const playedRef = useRef(0);
  const handleTimeUpdateGuarded = () => {
    const el = audioRef.current;
    if (el) playedRef.current = Math.max(playedRef.current, el.currentTime);
  };
  const handleSeeking = () => {
    const el = audioRef.current;
    if (el && Math.abs(el.currentTime - playedRef.current) > 0.4) {
      el.currentTime = playedRef.current;
    }
  };

  return (
    <>
      {/* audio ẩn — luôn mount để không ngắt playback khi ẩn box UI; không cho tua */}
      <audio
        ref={audioRef}
        src={getFullMediaUrl(urls[clipIdx])}
        onTimeUpdate={handleTimeUpdateGuarded}
        onSeeking={handleSeeking}
        onEnded={handleEnded}
        preload="auto"
      />

      {/* Chỉ hiện box khi audio đang bị dừng (browser chặn autoplay). Đang phát -> ẩn hẳn. */}
      {phase === 'armNeeded' && (
        <div className={cx('player')}>
          <div className={cx('info')}>
            <div className={cx('hint')}>
              Trình duyệt tạm dừng audio sau khi tải lại trang. Nhấn để nghe, hoặc chuyển sang câu
              tiếp.
            </div>
          </div>
          <div className={cx('armRow')}>
            <button type="button" className={cx('armBtn')} onClick={tryPlay}>
              <IoPlay /> Phát audio
            </button>
            <button type="button" className={cx('skipBtn')} onClick={complete}>
              Câu tiếp <IoArrowForward />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default GatedAudioPlayer;
