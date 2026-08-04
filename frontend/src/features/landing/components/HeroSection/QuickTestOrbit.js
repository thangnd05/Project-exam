import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {AnimatePresence, motion, useReducedMotion} from 'framer-motion';
import classNames from 'classnames/bind';

import styles from './QuickTestOrbit.module.scss';

const cx = classNames.bind(styles);

const ORBIT_PERIOD_MS = 20_000;
const ORBIT_SPEED = (Math.PI * 2) / ORBIT_PERIOD_MS;
const MANUAL_PAUSE_MS = 1600;

// radiusY >= bán kính hub + nửa chiều cao thẻ (đã nhân scale 1.1) thì thẻ ở vị trí
// trước (đáy vành) mới không đè lên hub. radiusX tính theo bề ngang thật của sân
// khấu nên vành luôn quét ngang hết chỗ có được.
// Giữ đúng tỉ lệ elip của quỹ đạo gốc (radiusX : radiusY : radiusZ = 250:90:150)
// để nhịp quay có chiều sâu thật. Hub treo phía trên hàng thẻ (--hub-shift trong
// scss), thoả: hubShift + bán kính hub <= radiusY - nửa chiều cao thẻ (đã nhân
// scale 1.1) - khoảng hở.
const RING = {
  wide: {cardWidth: 168, radiusY: 90, maxRadiusX: 235, sideRoom: 56},
  narrow: {cardWidth: 116, radiusY: 70, maxRadiusX: 122, sideRoom: 6},
};
const MIN_RADIUS_X = 96;

// Kéo ngang bao nhiêu px thì quỹ đạo quay trọn 1 vòng (theo bán kính hiện tại).
const DRAG_TURN_FACTOR = 3.6;
// Di chuyển quá ngưỡng này mới tính là kéo (để không nuốt cú click chọn thẻ).
const DRAG_TOLERANCE_PX = 6;
// Quán tính khi thả tay: chiếu vận tốc thêm chừng này mili-giây.
const FLICK_PROJECTION_MS = 140;
// Hằng số thời gian của chuyển động trượt về nấc gần nhất (càng lớn càng thong thả).
const SETTLE_TAU_MS = 170;

const TWO_PI = Math.PI * 2;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const getInitials = (name) => {
  if (!name) return '?';
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

const shortExamName = (name) => {
  if (!name) return '';
  const primary = name.split(/\s*[–—]\s*/)[0].trim();
  if (primary.length <= 40) return primary;
  const cut = primary.slice(0, 38).replace(/\s+\S*$/, '');
  return `${cut || primary.slice(0, 38)}…`;
};

function normalizeAngle(theta) {
  let t = ((theta % TWO_PI) + TWO_PI) % TWO_PI;
  if (t > Math.PI) t -= TWO_PI;
  return t;
}

function getOrbitTransform(theta, radius) {
  const depth = (Math.cos(theta) + 1) / 2;

  return {
    // fanX: chỉ dùng khi có đúng 2 thẻ — nếu không thẻ phía sau sẽ nằm khuất
    // hoàn toàn sau thẻ trước (cả hai cùng x = 0). sin(theta/2) liên tục nên
    // không gây giật khi quay.
    x: Math.sin(theta) * radius.radiusX + Math.sin(theta / 2) * radius.fanX,
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

const QuickTestOrbit = forwardRef(function QuickTestOrbit(
  {tests, onOpen, onFrontChange},
  ref,
) {
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
  const radiusRef = useRef(RING.wide);
  const stageRef = useRef(null);
  const countRef = useRef(0);
  const testsRef = useRef([]);
  const cardRefs = useRef([]);
  const cardStateRef = useRef([]);
  const onFrontChangeRef = useRef(onFrontChange);

  const [frontIndex, setFrontIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [stageWidth, setStageWidth] = useState(0);

  const count = tests.length;
  const step = count > 0 ? TWO_PI / count : 0;

  const radius = useMemo(() => {
    const preset = isNarrow ? RING.narrow : RING.wide;
    const halfStage = (stageWidth || preset.maxRadiusX * 2.5) / 2;
    const radiusX = clamp(
      halfStage - preset.cardWidth / 2 - preset.sideRoom,
      MIN_RADIUS_X,
      preset.maxRadiusX,
    );
    return {
      radiusX,
      radiusY: preset.radiusY,
      radiusZ: clamp(radiusX * 0.6, 90, 150),
      fanX: count === 2 ? Math.min(radiusX * 0.3, 70) : 0,
    };
  }, [count, isNarrow, stageWidth]);

  radiusRef.current = radius;
  countRef.current = count;
  testsRef.current = tests;
  onFrontChangeRef.current = onFrontChange;

  const applyTransforms = useCallback(() => {
    const n = countRef.current;
    const rad = radiusRef.current;
    const rot = rotationRef.current;
    const cards = cardRefs.current;
    const items = testsRef.current;
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

      // translate(-50%, -50%) đặt cuối + transform-origin 0 0: thẻ tự căn giữa
      // quanh điểm quỹ đạo, không cần biết trước kích thước thẻ.
      el.style.transform = `translate3d(${t.x}px, ${t.y}px, ${t.z}px) rotateY(${t.rotateY}deg) scale(${t.scale}) translate(-50%, -50%)`;
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
        const name = items[i]?.examTypeName ?? '';
        el.tabIndex = isFrontish ? 0 : -1;
        if (isFrontish) {
          el.removeAttribute('aria-hidden');
        } else {
          el.setAttribute('aria-hidden', 'true');
        }
        el.setAttribute(
          'aria-label',
          isActive ? `Làm bài kiểm tra nhanh ${name}` : `Đưa ${name} ra trước`,
        );
        s.active = isActive;
        s.frontish = isFrontish;
      }
    }

    if (front !== previousFrontRef.current) {
      previousFrontRef.current = front;
      setFrontIndex(front);
      onFrontChangeRef.current?.(front);
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

    if (count === 0) {
      previousFrontRef.current = 0;
      setFrontIndex(0);
      return;
    }
    const front = getFrontIndex(rotationRef.current, count);
    previousFrontRef.current = front;
    setFrontIndex(front);
    onFrontChangeRef.current?.(front);
  }, [count]);

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return undefined;

    const apply = () => setStageWidth(el.getBoundingClientRect().width);
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (reduceMotion || count === 0) return;
    applyTransforms();
  }, [applyTransforms, count, tests, radius, reduceMotion]);

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

  useImperativeHandle(ref, () => ({goPrev, goNext, goTo}), [goPrev, goNext, goTo]);

  const onCardHoverChange = useCallback((hovering) => {
    hoverCountRef.current = Math.max(0, hoverCountRef.current + (hovering ? 1 : -1));
    hoverPausedRef.current = hoverCountRef.current > 0;
  }, []);

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

  const handleCardActivate = useCallback(
    (test, index) => {
      if (didSwipeRef.current) {
        didSwipeRef.current = false;
        return;
      }
      if (index === previousFrontRef.current) {
        onOpen?.(test);
        return;
      }
      goTo(index);
    },
    [goTo, onOpen],
  );

  const onPointerDown = useCallback(
    (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (reduceMotion || countRef.current < 2) return;

      didSwipeRef.current = false;
      settleRef.current = null;
      pointerPausedRef.current = true;
      setDragging(true);

      const drag = {
        id: e.pointerId,
        startX: e.clientX,
        lastX: e.clientX,
        lastTime: e.timeStamp,
        velocity: 0,
        moved: false,
        startRotation: rotationRef.current,
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
    [applyTransforms, pauseAuto, reduceMotion],
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

  const frontTest = count > 0 ? tests[frontIndex] : null;

  const openFront = useCallback(() => {
    // Kéo xong thả tay ngay trên hub thì không tính là bấm.
    if (didSwipeRef.current) {
      didSwipeRef.current = false;
      return;
    }
    if (frontTest) onOpen?.(frontTest);
  }, [frontTest, onOpen]);

  return (
    <div
      ref={stageRef}
      className={cx('stage', {dragging, reduceMotion})}
      onPointerDown={onPointerDown}
      onKeyDown={onStageKeyDown}
      tabIndex={0}
      role="group"
      aria-roledescription="carousel"
      aria-label="Quỹ đạo đề kiểm tra nhanh"
    >
      <div className={cx('track')}>
        <div className={cx('hubStack')}>
          <button
            type="button"
            className={cx('hub')}
            onClick={openFront}
            disabled={!frontTest}
            aria-label={
              frontTest
                ? `Làm bài kiểm tra nhanh ${frontTest.examTypeName}, ${frontTest.totalQuestions} câu hỏi`
                : 'Làm bài kiểm tra nhanh'
            }
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={frontTest?.testId ?? 'empty'}
                className={cx('hubCore')}
                initial={{opacity: 0, y: 10}}
                animate={{opacity: 1, y: 0}}
                exit={{opacity: 0, y: -10}}
                transition={{duration: reduceMotion ? 0 : 0.3}}
              >
                <span className={cx('hubNum')}>
                  {frontTest?.totalQuestions || '—'}
                </span>
                <span className={cx('hubUnit')}>câu hỏi</span>
                <span className={cx('hubCta')} aria-hidden="true">
                  Làm ngay
                </span>
              </motion.span>
            </AnimatePresence>
          </button>
        </div>

        {!reduceMotion && (
          <OrbitCards
            tests={tests}
            setCardRef={setCardRef}
            onActivate={handleCardActivate}
            onHoverChange={onCardHoverChange}
          />
        )}
      </div>
    </div>
  );
});

function OrbitCards({tests, setCardRef, onActivate, onHoverChange}) {
  return tests.map((test, index) => (
    <article
      key={test.testId}
      ref={(el) => setCardRef(index, el)}
      className={cx('card')}
      role="button"
      onClick={() => onActivate(test, index)}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onActivate(test, index);
        }
      }}
    >
      <CardFace test={test} />
    </article>
  ));
}

function CardFace({test}) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(test.examTypeImageUrl) && !imageFailed;

  return (
    <>
      {showImage ? (
        <img
          className={cx('logo')}
          src={test.examTypeImageUrl}
          alt=""
          aria-hidden="true"
          loading="lazy"
          draggable={false}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className={cx('initials')} aria-hidden="true">
          {getInitials(test.examTypeName)}
        </span>
      )}
      <h3 className={cx('name')} title={test.examTypeName}>
        {shortExamName(test.examTypeName)}
      </h3>
      <span className={cx('count')}>{test.totalQuestions || '—'} câu</span>
    </>
  );
}

export default QuickTestOrbit;
