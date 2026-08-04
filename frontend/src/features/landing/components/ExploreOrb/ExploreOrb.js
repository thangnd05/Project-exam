import {memo, useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {AnimatePresence, motion, useReducedMotion} from 'framer-motion';
import classNames from 'classnames/bind';

import {getStandardExamTypes} from '~/shared/api/examTypeApi';
import {examTypeKeys} from '~/features/tests/exam/exam-types/examTypeKeys';
import styles from './ExploreOrb.module.scss';

const cx = classNames.bind(styles);

const ORBIT_PERIOD_MS = 18_000;
const ORBIT_SPEED = (Math.PI * 2) / ORBIT_PERIOD_MS;
const MANUAL_PAUSE_MS = 1600;
const MAX_ORBIT_ITEMS = 8;

const DESKTOP_RADIUS = {radiusX: 250, radiusY: 90, radiusZ: 150};
const MOBILE_RADIUS = {radiusX: 140, radiusY: 70, radiusZ: 110};

// Kéo ngang bao nhiêu px thì quỹ đạo quay trọn 1 vòng (theo bán kính hiện tại).
const DRAG_TURN_FACTOR = 3.6;
// Di chuyển quá ngưỡng này mới tính là kéo (để không nuốt cú click chọn thẻ).
const DRAG_TOLERANCE_PX = 6;
// Quán tính khi thả tay: chiếu vận tốc thêm chừng này mili-giây.
const FLICK_PROJECTION_MS = 140;
// Hằng số thời gian của chuyển động trượt về nấc gần nhất.
const SETTLE_TAU_MS = 110;

const TWO_PI = Math.PI * 2;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

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

function normalizeAngle(theta) {
  let t = ((theta % TWO_PI) + TWO_PI) % TWO_PI;
  if (t > Math.PI) t -= TWO_PI;
  return t;
}

function getOrbitTransform(theta, radius) {
  const depth = (Math.cos(theta) + 1) / 2;

  return {
    x: Math.sin(theta) * radius.radiusX,
    y: Math.cos(theta) * radius.radiusY,
    z: Math.cos(theta) * radius.radiusZ,
    scale: 0.72 + 0.38 * depth,
    opacity: 0.4 + 0.6 * depth,
    depth,
    rotateY: -Math.sin(theta) * 32,
    zIndex: Math.round(50 + Math.cos(theta) * 50),
  };
}

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
  const dragRef = useRef(null);
  const settleRef = useRef(null);
  const didSwipeRef = useRef(false);
  const rotationRef = useRef(0);
  const lastTsRef = useRef(null);
  const hoverPausedRef = useRef(false);
  const hoverCountRef = useRef(0);
  const pointerPausedRef = useRef(false);
  const previousFrontRef = useRef(0);
  const radiusRef = useRef(isNarrow ? MOBILE_RADIUS : DESKTOP_RADIUS);
  const countRef = useRef(0);
  const typesRef = useRef([]);
  const cardRefs = useRef([]);
  const cardStateRef = useRef([]);

  const [frontIndex, setFrontIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dragging, setDragging] = useState(false);

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

  radiusRef.current = radius;
  countRef.current = count;
  typesRef.current = examTypes;

  const applyTransforms = useCallback(() => {
    const n = countRef.current;
    const rad = radiusRef.current;
    const rot = rotationRef.current;
    const cards = cardRefs.current;
    const types = typesRef.current;
    const states = cardStateRef.current;

    if (n <= 0) return;

    const front = getFrontIndex(rot, n);

    for (let i = 0; i < n; i++) {
      const el = cards[i];
      if (!el) continue;

      const theta = (i / n) * TWO_PI - rot;
      const t = getOrbitTransform(theta, rad);

      let s = states[i];
      if (!s) {
        s = states[i] = {active: null, frontish: null, z: null};
      }

      el.style.transform = `translate3d(${t.x}px, ${t.y}px, ${t.z}px) rotateY(${t.rotateY}deg) scale(${t.scale})`;
      el.style.opacity = String(t.opacity);

      el.style.setProperty('--frontness', t.depth.toFixed(3));

      const zStr = String(t.zIndex);
      if (s.z !== zStr) {
        el.style.zIndex = zStr;
        s.z = zStr;
      }

      const isActive = i === front;
      const isFrontish = t.zIndex >= 70;
      if (s.active !== isActive || s.frontish !== isFrontish) {
        const name = types[i]?.name ?? '';
        el.classList.toggle(styles.isActive, isActive);
        el.classList.toggle(styles.isBack, !isFrontish);
        el.tabIndex = isFrontish ? 0 : -1;
        if (isFrontish) {
          el.removeAttribute('aria-hidden');
        } else {
          el.setAttribute('aria-hidden', 'true');
        }
        el.setAttribute(
          'aria-label',
          isActive ? `Mở ${name}` : `Đưa ${name} ra trước`,
        );
        s.active = isActive;
        s.frontish = isFrontish;
      }
    }

    if (front !== previousFrontRef.current) {
      previousFrontRef.current = front;
      setFrontIndex(front);
    }
  }, []);

  const setCardRef = useCallback((index, el) => {

    if (cardRefs.current[index] !== el) {
      cardStateRef.current[index] = null;
    }
    cardRefs.current[index] = el;
  }, []);

  useEffect(() => {

    hoverCountRef.current = 0;
    hoverPausedRef.current = false;
    setPaused(pointerPausedRef.current);

    if (count === 0) {
      previousFrontRef.current = 0;
      setFrontIndex(0);
      return;
    }
    const front = getFrontIndex(rotationRef.current, count);
    previousFrontRef.current = front;
    setFrontIndex(front);
  }, [count]);

  useLayoutEffect(() => {
    if (reduceMotion || count === 0) return;
    applyTransforms();
  }, [applyTransforms, count, examTypes, isNarrow, reduceMotion]);

  const pauseAuto = useCallback((ms = MANUAL_PAUSE_MS) => {
    pauseUntilRef.current = Date.now() + ms;
  }, []);

  const settleTo = useCallback(
    (targetRotation) => {
      pauseAuto();
      if (reduceMotion) {
        settleRef.current = null;
        rotationRef.current = targetRotation;
        applyTransforms();
        return;
      }
      settleRef.current = targetRotation;
    },
    [applyTransforms, pauseAuto, reduceMotion],
  );

  const goTo = useCallback(
    (index) => {
      if (count === 0) return;
      const target = (((index % count) + count) % count) * step;
      const current = settleRef.current ?? rotationRef.current;
      const currentNorm = ((current % TWO_PI) + TWO_PI) % TWO_PI;
      const targetNorm = ((target % TWO_PI) + TWO_PI) % TWO_PI;
      let delta = targetNorm - currentNorm;
      if (delta > Math.PI) delta -= TWO_PI;
      if (delta < -Math.PI) delta += TWO_PI;
      settleTo(current + delta);
    },
    [count, settleTo, step],
  );

  // Luôn về đúng nấc: làm tròn vị trí hiện tại rồi cộng/trừ một bước.
  const nudge = useCallback(
    (direction) => {
      if (count < 2) return;
      const base = settleRef.current ?? rotationRef.current;
      settleTo((Math.round(base / step) + direction) * step);
    },
    [count, settleTo, step],
  );

  const goPrev = useCallback(() => nudge(-1), [nudge]);
  const goNext = useCallback(() => nudge(1), [nudge]);

  const scrollToAll = useCallback(() => {
    document
      .getElementById('explore-orb')
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
  const onCardHoverChange = useCallback(
    (hovering) => {
      hoverCountRef.current = Math.max(0, hoverCountRef.current + (hovering ? 1 : -1));
      hoverPausedRef.current = hoverCountRef.current > 0;
      updatePausedFlag();
    },
    [updatePausedFlag],
  );

  useEffect(() => {
    if (reduceMotion || count < 2) return undefined;

    let rafId = 0;
    lastTsRef.current = null;

    const tick = (ts) => {
      const last = lastTsRef.current;
      lastTsRef.current = ts;
      const deltaMs = last == null ? 0 : Math.min(ts - last, 64);

      if (dragRef.current) {
        // Đang kéo: góc quay do pointermove quyết định.
      } else if (settleRef.current != null) {
        const target = settleRef.current;
        const diff = target - rotationRef.current;
        if (Math.abs(diff) < 0.002) {
          rotationRef.current = target;
          settleRef.current = null;
          pauseAuto();
        } else {
          rotationRef.current += diff * (1 - Math.exp(-deltaMs / SETTLE_TAU_MS));
        }
        applyTransforms();
      } else if (
        deltaMs > 0 &&
        !hoverPausedRef.current &&
        !pointerPausedRef.current &&
        Date.now() >= pauseUntilRef.current
      ) {
        rotationRef.current += ORBIT_SPEED * deltaMs;
        applyTransforms();
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(rafId);
      lastTsRef.current = null;
    };
  }, [applyTransforms, count, pauseAuto, reduceMotion]);

  const frontType = count > 0 ? examTypes[frontIndex] : null;

  const handleCardActivate = useCallback(
    (type, index) => {
      if (didSwipeRef.current) {
        didSwipeRef.current = false;
        return;
      }
      if (index === previousFrontRef.current) {
        openType(type.examTypeId);
        return;
      }
      goTo(index);
    },
    [goTo, openType],
  );

  const openFront = useCallback(() => {
    if (frontType) openType(frontType.examTypeId);
  }, [frontType, openType]);

  const onPointerDown = useCallback(
    (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (reduceMotion || countRef.current < 2) return;

      didSwipeRef.current = false;
      settleRef.current = null;
      pointerPausedRef.current = true;
      updatePausedFlag();
      setDragging(true);

      const drag = {
        id: e.pointerId,
        startX: e.clientX,
        lastX: e.clientX,
        lastTime: e.timeStamp,
        velocity: 0,
        moved: false,
        startRotation: rotationRef.current,
        // px kéo -> radian quay, co giãn theo bán kính quỹ đạo hiện tại
        rotPerPx: TWO_PI / (radiusRef.current.radiusX * DRAG_TURN_FACTOR),
      };

      const onMove = (ev) => {
        if (ev.pointerId !== drag.id) return;
        const dx = ev.clientX - drag.startX;
        if (Math.abs(dx) > DRAG_TOLERANCE_PX) drag.moved = true;

        const dt = ev.timeStamp - drag.lastTime;
        if (dt > 0) {
          drag.velocity = (ev.clientX - drag.lastX) / dt;
          drag.lastX = ev.clientX;
          drag.lastTime = ev.timeStamp;
        }

        rotationRef.current = drag.startRotation - dx * drag.rotPerPx;
        applyTransforms();
      };

      const finish = () => {
        drag.cleanup();
        dragRef.current = null;
        pointerPausedRef.current = false;
        updatePausedFlag();
        setDragging(false);
        pauseAuto();

        const n = countRef.current;
        if (!drag.moved || n < 2) return;

        didSwipeRef.current = true;
        const stepRad = TWO_PI / n;
        const flick = clamp(
          -drag.velocity * drag.rotPerPx * FLICK_PROJECTION_MS,
          -stepRad,
          stepRad,
        );
        settleRef.current =
          Math.round((rotationRef.current + flick) / stepRad) * stepRad;
      };

      const onEnd = (ev) => {
        if (ev.pointerId === drag.id) finish();
      };

      drag.cleanup = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onEnd);
        window.removeEventListener('pointercancel', onEnd);
      };

      dragRef.current = drag;
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onEnd);
      window.addEventListener('pointercancel', onEnd);
    },
    [applyTransforms, pauseAuto, reduceMotion, updatePausedFlag],
  );

  useEffect(() => () => dragRef.current?.cleanup(), []);

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
      id="explore-orb"
      className={cx('section', {reduceMotion, paused})}
      aria-label="Khám phá loại đề"
    >
      <div className={cx('atmosphere')} aria-hidden="true">
        <span className={cx('orb', 'orbA')} />
        <span className={cx('orb', 'orbB')} />
      </div>

      <div className={cx('inner')}>
        <header className={cx('header')}>
          <h2 className={cx('title')}>Chọn kỳ thi của bạn</h2>
          <p className={cx('subtitle')}>
            Xoay quỹ đạo hãy chạm vào kỳ thi để bắt đầu hành trình
          </p>
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
                className={cx('stage', {dragging})}
                onPointerDown={onPointerDown}
                onKeyDown={onStageKeyDown}
                tabIndex={0}
                role="group"
                aria-roledescription="carousel"
                aria-label="Quỹ đạo loại đề"
              >
                <div className={cx('track')}>
                  <div className={cx('hubStack')}>
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
                    <OrbitCards
                      types={examTypes}
                      setCardRef={setCardRef}
                      onActivate={handleCardActivate}
                      onHoverChange={onCardHoverChange}
                    />
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

const OrbitCards = memo(function OrbitCards({
  types,
  setCardRef,
  onActivate,
  onHoverChange,
}) {
  return types.map((type, index) => (
    <article
      key={type.examTypeId}
      ref={(el) => setCardRef(index, el)}
      className={cx('card')}
      onClick={() => onActivate(type, index)}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onActivate(type, index);
        }
      }}
      role="button"
    >
      <CardFace type={type} />
    </article>
  ));
});

function Monogram({type}) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = Boolean(type.imageUrl) && !imgFailed;

  return (
    <div
      className={cx('monogram', {hasImage: showImage})}
      aria-hidden="true"
    >
      {showImage ? (
        <img
          className={cx('monogramImg')}
          src={type.imageUrl}
          alt=""
          onError={() => setImgFailed(true)}
        />
      ) : (
        getInitials(type.name)
      )}
    </div>
  );
}

function CardFace({type}) {
  return (
    <>
      <Monogram type={type} />
      <h3 className={cx('cardName')}>{type.name}</h3>
      <p className={cx('cardMeta')}>{getSubtitle(type)}</p>
      <span className={cx('cardCta')} aria-hidden="true">
        Chọn để mở
      </span>
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
        <CardFace type={type} />
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
