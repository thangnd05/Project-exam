import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {AnimatePresence, motion, useReducedMotion} from 'framer-motion';
import classNames from 'classnames/bind';

import {getStandardExamTypes} from '~/shared/api/examTypeApi';
import {examTypeKeys} from '~/features/tests/exam/exam-types/ExamTypePage';
import styles from './ExploreOrb.module.scss';

const cx = classNames.bind(styles);

/** Full lap ≈ 18s (tune 14–22s). */
const ORBIT_PERIOD_MS = 18_000;
const ORBIT_SPEED = (Math.PI * 2) / ORBIT_PERIOD_MS;
const MANUAL_PAUSE_MS = 1600;
const SWIPE_THRESHOLD = 48;
const MAX_ORBIT_ITEMS = 8;
const INSTANT = {duration: 0};

const DESKTOP_RADIUS = {radiusX: 250, radiusY: 90, radiusZ: 150};
const MOBILE_RADIUS = {radiusX: 140, radiusY: 70, radiusZ: 110};

const TWO_PI = Math.PI * 2;

const normalizeExamTypes = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  if (payload && Array.isArray(payload.content)) return payload.content;
  return [];
};

const getInitials = (name) => {
  if (!name) return '?';
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

const getSubtitle = (type) => {
  if (type.childCount > 0) {
    return `${type.childCount} kỳ thi`;
  }
  return 'Kỳ thi chuẩn';
};

/** Normalize angle to [-π, π]. */
function normalizeAngle(theta) {
  let t = ((theta % TWO_PI) + TWO_PI) % TWO_PI;
  if (t > Math.PI) t -= TWO_PI;
  return t;
}

/**
 * Orbital transform from absolute theta (radians).
 * Front (theta≈0) sits at bottom-center of the ellipse; CSS +y is down.
 */
function getOrbitTransform(theta, radius) {
  const depth = (Math.cos(theta) + 1) / 2;

  return {
    x: Math.sin(theta) * radius.radiusX,
    y: Math.cos(theta) * radius.radiusY,
    z: Math.cos(theta) * radius.radiusZ,
    scale: 0.72 + 0.38 * depth,
    opacity: 0.4 + 0.6 * depth,
    rotateY: -Math.sin(theta) * 32,
    zIndex: Math.round(50 + Math.cos(theta) * 50),
  };
}

/** Index whose theta is closest to 0 (front of orbit). */
function getFrontIndex(rotation, n) {
  if (n <= 0) return 0;
  let best = 0;
  let bestAbs = Infinity;
  for (let i = 0; i < n; i++) {
    const theta = (i / n) * TWO_PI - rotation;
    const abs = Math.abs(normalizeAngle(theta));
    if (abs < bestAbs) {
      bestAbs = abs;
      best = i;
    }
  }
  return best;
}

function useIsNarrow(breakpoint = 768) {
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const onChange = () => setNarrow(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [breakpoint]);

  return narrow;
}

function ExploreOrb() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const isNarrow = useIsNarrow();
  const pauseUntilRef = useRef(0);
  const pointerStartX = useRef(null);
  const didSwipeRef = useRef(false);
  const rotationRef = useRef(0);
  const lastTsRef = useRef(null);
  const hoverPausedRef = useRef(false);
  const pointerPausedRef = useRef(false);

  const [rotation, setRotation] = useState(0);
  const [frontIndex, setFrontIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const {data: examTypes = [], isLoading} = useQuery({
    queryKey: examTypeKeys.standard,
    queryFn: getStandardExamTypes,
    select: (payload) =>
      normalizeExamTypes(payload)
        .filter((t) => !t.parentId)
        .slice(0, MAX_ORBIT_ITEMS),
  });

  const count = examTypes.length;
  const radius = isNarrow ? MOBILE_RADIUS : DESKTOP_RADIUS;
  const step = count > 0 ? TWO_PI / count : 0;

  const syncFront = useCallback((rot, n) => {
    setFrontIndex(getFrontIndex(rot, n));
  }, []);

  useEffect(() => {
    if (count === 0) {
      setFrontIndex(0);
      return;
    }
    syncFront(rotationRef.current, count);
  }, [count, syncFront]);

  const pauseAuto = useCallback((ms = MANUAL_PAUSE_MS) => {
    pauseUntilRef.current = Date.now() + ms;
  }, []);

  const applyRotation = useCallback(
    (next) => {
      rotationRef.current = next;
      setRotation(next);
      syncFront(next, count);
    },
    [count, syncFront],
  );

  /** Nudge orbit so card `index` faces front (shortest angular path). */
  const goTo = useCallback(
    (index) => {
      if (count === 0) return;
      const target = (((index % count) + count) % count) * step;
      const current = rotationRef.current;
      const currentNorm = ((current % TWO_PI) + TWO_PI) % TWO_PI;
      const targetNorm = ((target % TWO_PI) + TWO_PI) % TWO_PI;
      let delta = targetNorm - currentNorm;
      if (delta > Math.PI) delta -= TWO_PI;
      if (delta < -Math.PI) delta += TWO_PI;
      applyRotation(current + delta);
      pauseAuto();
    },
    [applyRotation, count, pauseAuto, step],
  );

  const goPrev = useCallback(() => {
    if (count < 2) return;
    applyRotation(rotationRef.current - step);
    pauseAuto();
  }, [applyRotation, count, pauseAuto, step]);

  const goNext = useCallback(() => {
    if (count < 2) return;
    applyRotation(rotationRef.current + step);
    pauseAuto();
  }, [applyRotation, count, pauseAuto, step]);

  const scrollToAll = useCallback(() => {
    document
      .getElementById('exam-types')
      ?.scrollIntoView({behavior: reduceMotion ? 'auto' : 'smooth'});
  }, [reduceMotion]);

  const openType = useCallback(
    (examTypeId) => {
      if (examTypeId == null) return;
      navigate(`/exam-types/${examTypeId}`);
    },
    [navigate],
  );

  const updatePausedFlag = useCallback(() => {
    setPaused(hoverPausedRef.current || pointerPausedRef.current);
  }, []);

  // Continuous orbit via requestAnimationFrame
  useEffect(() => {
    if (reduceMotion || count < 2) return undefined;

    let rafId = 0;
    lastTsRef.current = null;

    const tick = (ts) => {
      const last = lastTsRef.current;
      lastTsRef.current = ts;

      const hoveringOrHeld = hoverPausedRef.current || pointerPausedRef.current;
      const timedPause = Date.now() < pauseUntilRef.current;

      if (!hoveringOrHeld && !timedPause && last != null) {
        const deltaMs = Math.min(ts - last, 64);
        rotationRef.current += ORBIT_SPEED * deltaMs;
        setRotation(rotationRef.current);
        setFrontIndex(getFrontIndex(rotationRef.current, count));
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(rafId);
      lastTsRef.current = null;
    };
  }, [count, reduceMotion]);

  const orbitTransforms = useMemo(() => {
    if (count === 0) return [];
    return examTypes.map((_, index) => {
      const theta = (index / count) * TWO_PI - rotation;
      return getOrbitTransform(theta, radius);
    });
  }, [count, examTypes, radius, rotation]);

  const frontType = count > 0 ? examTypes[frontIndex] : null;

  const handleCardActivate = useCallback(
    (type, index) => {
      if (didSwipeRef.current) {
        didSwipeRef.current = false;
        return;
      }
      if (index === frontIndex) {
        openType(type.examTypeId);
        return;
      }
      goTo(index);
    },
    [frontIndex, goTo, openType],
  );

  const openFront = useCallback(() => {
    if (frontType) openType(frontType.examTypeId);
  }, [frontType, openType]);

  const onPointerDown = useCallback(
    (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      didSwipeRef.current = false;
      pointerStartX.current = e.clientX;
      pointerPausedRef.current = true;
      updatePausedFlag();
    },
    [updatePausedFlag],
  );

  const onPointerUp = useCallback(
    (e) => {
      pointerPausedRef.current = false;
      updatePausedFlag();

      if (pointerStartX.current == null || count < 2) {
        pointerStartX.current = null;
        return;
      }
      const delta = e.clientX - pointerStartX.current;
      pointerStartX.current = null;
      if (Math.abs(delta) < SWIPE_THRESHOLD) return;
      didSwipeRef.current = true;
      if (delta > 0) goPrev();
      else goNext();
    },
    [count, goNext, goPrev, updatePausedFlag],
  );

  const onPointerCancel = useCallback(() => {
    pointerStartX.current = null;
    pointerPausedRef.current = false;
    updatePausedFlag();
  }, [updatePausedFlag]);

  const onStageKeyDown = useCallback(
    (e) => {
      if (count < 2) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      }
    },
    [count, goNext, goPrev],
  );

  const liveLabel = frontType
    ? `Đang xem: ${frontType.name}`
    : isLoading
      ? 'Đang tải loại đề'
      : 'Chưa có loại đề';

  return (
    <section
      className={cx('section', {reduceMotion, paused})}
      aria-label="Khám phá loại đề"
      onMouseEnter={() => {
        hoverPausedRef.current = true;
        updatePausedFlag();
      }}
      onMouseLeave={() => {
        hoverPausedRef.current = false;
        updatePausedFlag();
      }}
    >
      <div className={cx('glow')} aria-hidden="true" />

      <div className={cx('inner')}>
        <header className={cx('header')}>
          <h2 className={cx('title')}>Khám phá loại đề</h2>
          <p className={cx('subtitle')}>Vuốt hoặc chọn thẻ để xem kỳ thi phù hợp</p>
        </header>

        {count === 0 && !isLoading ? (
          <p className={cx('empty')}>Chưa có loại đề để hiển thị</p>
        ) : (
          <>
            <div className={cx('controls')}>
              <button
                type="button"
                className={cx('navBtn')}
                onClick={goPrev}
                disabled={count < 2}
                aria-label="Trước"
              >
                <ChevronLeft />
              </button>

              <div
                className={cx('stage')}
                onPointerDown={onPointerDown}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerCancel}
                onKeyDown={onStageKeyDown}
                tabIndex={0}
                role="group"
                aria-roledescription="carousel"
                aria-label="Quỹ đạo loại đề"
              >
                <div
                  className={cx('orbitPath')}
                  aria-hidden="true"
                  style={{
                    width: radius.radiusX * 2,
                    height: radius.radiusY * 2,
                  }}
                />

                <div className={cx('track')}>
                  <div className={cx('hubStack')}>
                    <span className={cx('watermark')} aria-hidden="true">
                      WINDE
                    </span>
                    <button
                      type="button"
                      className={cx('hub')}
                      onClick={openFront}
                      disabled={!frontType}
                      aria-label={
                        frontType
                          ? `Khám phá ngay: ${frontType.name}`
                          : 'Khám phá ngay'
                      }
                    >
                      <span className={cx('hubPulse')} aria-hidden="true" />
                      <span className={cx('hubLabel')}>
                        Khám phá
                        <br />
                        ngay
                      </span>
                    </button>
                  </div>

                  {reduceMotion ? (
                    <ReducedMotionCard
                      type={frontType}
                      onOpen={() => frontType && openType(frontType.examTypeId)}
                    />
                  ) : (
                    examTypes.map((type, index) => {
                      const t = orbitTransforms[index];
                      const isActive = index === frontIndex;
                      const isFrontish = t.zIndex >= 70;

                      return (
                        <motion.article
                          key={type.examTypeId}
                          className={cx('card', {
                            isActive,
                            isBack: !isFrontish,
                          })}
                          initial={false}
                          animate={{
                            x: t.x,
                            y: t.y,
                            z: t.z,
                            rotateY: t.rotateY,
                            scale: t.scale,
                            opacity: t.opacity,
                            zIndex: t.zIndex,
                          }}
                          transition={INSTANT}
                          style={{transformStyle: 'preserve-3d'}}
                          onClick={() => handleCardActivate(type, index)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleCardActivate(type, index);
                            }
                          }}
                          tabIndex={isFrontish ? 0 : -1}
                          role="button"
                          aria-label={
                            isActive
                              ? `Mở ${type.name}`
                              : `Đưa ${type.name} ra trước`
                          }
                          aria-hidden={!isFrontish ? true : undefined}
                        >
                          <CardFace type={type} isActive={isActive} />
                        </motion.article>
                      );
                    })
                  )}
                </div>
              </div>

              <button
                type="button"
                className={cx('navBtn')}
                onClick={goNext}
                disabled={count < 2}
                aria-label="Sau"
              >
                <ChevronRight />
              </button>
            </div>

            <div className={cx('actions')}>
              <button
                type="button"
                className={cx('primaryBtn')}
                disabled={!frontType}
                onClick={openFront}
              >
                Khám phá đề
              </button>
              <button type="button" className={cx('viewAllBtn')} onClick={scrollToAll}>
                Xem tất cả
              </button>
            </div>

            {count > 1 && (
              <div className={cx('dots')} role="tablist" aria-label="Chỉ mục loại đề">
                {examTypes.map((type, index) => (
                  <button
                    key={type.examTypeId}
                    type="button"
                    role="tab"
                    aria-selected={index === frontIndex}
                    aria-label={`Loại đề ${index + 1}: ${type.name}`}
                    className={cx('dot', {dotActive: index === frontIndex})}
                    onClick={() => goTo(index)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        <div className={cx('srOnly')} aria-live="polite">
          {liveLabel}
        </div>
      </div>
    </section>
  );
}

function CardFace({type, isActive}) {
  return (
    <>
      <div className={cx('monogram')} aria-hidden="true">
        {getInitials(type.name)}
      </div>
      <h3 className={cx('cardName')}>{type.name}</h3>
      <p className={cx('cardMeta')}>{getSubtitle(type)}</p>
      {isActive && (
        <span className={cx('cardCta')} aria-hidden="true">
          Chọn để mở
        </span>
      )}
    </>
  );
}

function ReducedMotionCard({type, onOpen}) {
  if (!type) {
    return <div className={cx('card', 'isActive', 'flatCard')} />;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.article
        key={type.examTypeId}
        className={cx('card', 'isActive', 'flatCard')}
        initial={{opacity: 0}}
        animate={{opacity: 1}}
        exit={{opacity: 0}}
        transition={{duration: 0.25}}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpen();
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={`Mở ${type.name}`}
      >
        <CardFace type={type} isActive />
      </motion.article>
    </AnimatePresence>
  );
}

function ChevronLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M12.5 4.5L7 10l5.5 5.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M7.5 4.5L13 10l-5.5 5.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default ExploreOrb;
