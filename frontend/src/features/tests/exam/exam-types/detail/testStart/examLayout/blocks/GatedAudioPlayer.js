import { useCallback, useEffect, useRef, useState } from 'react';
import { IoPlay } from 'react-icons/io5';
import classNames from 'classnames/bind';

import ButtonPrime from '~/shared/ui/Button/ButtonPrime';
import { getFullMediaUrl } from '~/shared/utils/mediaUrl';
import styles from './GatedAudioPlayer.module.scss';

const cx = classNames.bind(styles);

function GatedAudioPlayer({ urls = [], onCompleted }) {
  const audioRef = useRef(null);
  const completedRef = useRef(false);

  const [clipIdx, setClipIdx] = useState(0);
  const [phase, setPhase] = useState('loading');

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

  useEffect(() => {
    if (total === 0) {
      complete();
      return;
    }
    tryPlay();

  }, [clipIdx, total]);

  const handleEnded = () => {
    if (clipIdx < total - 1) {
      setClipIdx((i) => i + 1);
    } else {
      setPhase('ended');
      complete();
    }
  };

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

      <audio
        ref={audioRef}
        src={getFullMediaUrl(urls[clipIdx])}
        onTimeUpdate={handleTimeUpdateGuarded}
        onSeeking={handleSeeking}
        onEnded={handleEnded}
        preload="auto"
      />

      {phase === 'armNeeded' && (
        <div className={cx('player')}>
          <div className={cx('info')}>
            <div className={cx('hint')}>
              Trình duyệt tạm dừng audio sau khi tải lại trang. Nhấn để nghe, hoặc chuyển sang câu
              tiếp.
            </div>
          </div>
          <div className={cx('armRow')}>
            <ButtonPrime variant="primary" size="md" onClick={tryPlay}>
              <IoPlay /> Phát audio
            </ButtonPrime>
            <ButtonPrime variant="ghost" size="md" onClick={complete}>
              Câu tiếp
            </ButtonPrime>
          </div>
        </div>
      )}
    </>
  );
}

export default GatedAudioPlayer;
