import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {AnimatePresence, motion, useReducedMotion} from 'framer-motion';
import classNames from 'classnames/bind';

import {getStandardExamTypes} from '~/shared/api/examTypeApi';
import {examTypeKeys} from '~/features/tests/exam/exam-types/ExamTypePage';
import styles from './ExploreOrb.module.scss';

const cx = classNames.bind(styles);

const MAX_SHORTCUTS = 7;
const STAGGER_MS = 0.05;
const SPRING = {type: 'spring', stiffness: 380, damping: 28, mass: 0.85};

const normalizeExamTypes = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  if (payload && Array.isArray(payload.content)) return payload.content;
  return [];
};

/** Even full-circle positions starting from top (−90°). */
function getRadialOffset(index, count, radiusPx) {
  const angle = -90 + (360 / count) * index;
  const rad = (angle * Math.PI) / 180;
  return {
    x: Math.cos(rad) * radiusPx,
    y: Math.sin(rad) * radiusPx,
  };
}

function ExploreOrb() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [radiusPx, setRadiusPx] = useState(160);

  const {data: examTypes = []} = useQuery({
    queryKey: examTypeKeys.standard,
    queryFn: getStandardExamTypes,
    select: (payload) => normalizeExamTypes(payload).filter((t) => !t.parentId),
  });

  const shortcuts = useMemo(
    () => examTypes.slice(0, MAX_SHORTCUTS),
    [examTypes],
  );

  const bloomItems = useMemo(() => {
    const chips = shortcuts.map((type) => ({
      key: String(type.examTypeId),
      label: type.name,
      kind: 'type',
      examTypeId: type.examTypeId,
    }));
    chips.push({key: 'view-all', label: 'Xem tất cả', kind: 'all'});
    return chips;
  }, [shortcuts]);

  const collapse = useCallback(() => setExpanded(false), []);
  const toggle = useCallback(() => setExpanded((v) => !v), []);

  const handleChip = useCallback(
    (item) => {
      if (item.kind === 'all') {
        document
          .getElementById('exam-types')
          ?.scrollIntoView({behavior: reduceMotion ? 'auto' : 'smooth'});
        collapse();
        return;
      }
      navigate(`/exam-types/${item.examTypeId}`);
    },
    [collapse, navigate, reduceMotion],
  );

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;

    const updateRadius = () => {
      const {width} = stage.getBoundingClientRect();
      // Desktop ~180, mobile ~120 — stay inside stage with chip half-size headroom
      setRadiusPx(Math.min(180, Math.max(110, width * 0.38)));
    };

    updateRadius();
    const ro = new ResizeObserver(updateRadius);
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!expanded) return undefined;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') collapse();
    };

    const onPointerDown = (e) => {
      if (sectionRef.current && !sectionRef.current.contains(e.target)) {
        collapse();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [expanded, collapse]);

  const itemCount = bloomItems.length;

  return (
    <section
      ref={sectionRef}
      className={cx('section', {expanded})}
      aria-label="Lối tắt khám phá loại đề"
    >
      <div className={cx('glow')} aria-hidden="true" />

      <div className={cx('inner')}>
        <p className={cx('hint', {hintHidden: expanded})}>
          Chạm để mở lối tắt loại đề
        </p>

        <div ref={stageRef} className={cx('stage')}>
          <motion.button
            type="button"
            className={cx('orb')}
            aria-expanded={expanded}
            aria-controls="explore-orb-chips"
            onClick={toggle}
            animate={
              reduceMotion
                ? undefined
                : expanded
                  ? {rotate: [0, 2.5, -2.5, 0], scale: 1.04}
                  : {rotate: 0, scale: 1}
            }
            transition={
              expanded && !reduceMotion
                ? {
                    rotate: {duration: 4, repeat: Infinity, ease: 'easeInOut'},
                    scale: {duration: 0.35},
                  }
                : {duration: 0.35}
            }
          >
            <span className={cx('orbRing')} aria-hidden="true" />
            <span className={cx('orbLabel')}>
              Khám phá
              <br />
              ngay
            </span>
          </motion.button>

          <div id="explore-orb-chips" className={cx('chipCloud')} role="group">
            <AnimatePresence>
              {expanded &&
                bloomItems.map((item, index) => {
                  const {x, y} = getRadialOffset(index, itemCount, radiusPx);
                  const delay = reduceMotion ? 0 : index * STAGGER_MS;
                  // Center chip on stage midpoint, then offset by radial x/y
                  const atCenter = {x: '-50%', y: '-50%'};
                  const atOrbit = {
                    x: `calc(-50% + ${x}px)`,
                    y: `calc(-50% + ${y}px)`,
                  };

                  return (
                    <motion.button
                      key={item.key}
                      type="button"
                      className={cx('chip', {viewAll: item.kind === 'all'})}
                      style={{left: '50%', top: '50%'}}
                      initial={
                        reduceMotion
                          ? {...atOrbit, scale: 1, opacity: 1}
                          : {...atCenter, scale: 0.35, opacity: 0}
                      }
                      animate={{
                        ...atOrbit,
                        scale: 1,
                        opacity: 1,
                        transition: reduceMotion
                          ? {duration: 0}
                          : {...SPRING, delay},
                      }}
                      exit={
                        reduceMotion
                          ? {opacity: 0, transition: {duration: 0}}
                          : {
                              ...atCenter,
                              scale: 0.2,
                              opacity: 0,
                              transition: {
                                duration: 0.22,
                                delay: (itemCount - 1 - index) * 0.03,
                                ease: [0.4, 0, 1, 1],
                              },
                            }
                      }
                      onClick={() => handleChip(item)}
                    >
                      {item.label}
                    </motion.button>
                  );
                })}
            </AnimatePresence>
          </div>
        </div>

        <div className={cx('srOnly')} aria-live="polite">
          {expanded
            ? `Đã mở ${bloomItems.length} lối tắt`
            : 'Lối tắt đang thu gọn'}
        </div>

        {expanded && bloomItems.length <= 1 && shortcuts.length === 0 && (
          <p className={cx('empty')}>Chưa có loại đề để hiển thị</p>
        )}
      </div>
    </section>
  );
}

export default ExploreOrb;
