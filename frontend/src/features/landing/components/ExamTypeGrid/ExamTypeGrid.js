'use client';

import Link from 'next/link';
import {useCallback, useEffect, useState} from 'react';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {AnimatePresence, motion, useReducedMotion} from 'framer-motion';
import classNames from 'classnames/bind';

import {getExamTypeChildren, getStandardExamTypes} from '~/shared/api/examTypeApi';
import {buildExamTypeDetailPath} from '~/shared/config/Routes';
import {examTypeKeys} from '~/features/tests/exam/exam-types/examTypeKeys';
import styles from './ExamTypeGrid.module.scss';

const cx = classNames.bind(styles);

const SKELETON_COUNT = 6;
const EASE = [0.22, 1, 0.36, 1];

const normalizeExamTypes = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  if (payload && Array.isArray(payload.content)) return payload.content;
  return [];
};

const childrenQueryKey = (id) => [...examTypeKeys.standard, 'children', id];

const getInitials = (name) => {
  if (!name) return '?';
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

const getSubtitle = (type) =>
  type.childCount > 0 ? `${type.childCount} kỳ thi` : 'Kỳ thi chuẩn';

const hasChildren = (type) => Number(type?.childCount) > 0;

function ExamTypeGrid() {
  const reduceMotion = useReducedMotion();
  const queryClient = useQueryClient();
  // { id, name, imageUrl } khi đang xem tầng con; null = lưới gốc.
  const [drill, setDrill] = useState(null);

  const {data: examTypes = [], isLoading} = useQuery({
    queryKey: examTypeKeys.standard,
    queryFn: getStandardExamTypes,
    select: (payload) => normalizeExamTypes(payload).filter((t) => !t.parentId),
  });

  const drillId = drill?.id ?? null;

  const {
    data: children = [],
    isLoading: childrenLoading,
    isError: childrenError,
  } = useQuery({
    queryKey: childrenQueryKey(drillId),
    queryFn: () => getExamTypeChildren(drillId),
    enabled: drillId != null,
    select: normalizeExamTypes,
  });

  const goBack = useCallback(() => setDrill(null), []);

  const openParent = useCallback((type) => {
    setDrill({
      id: type.examTypeId,
      name: type.name,
      imageUrl: type.imageUrl ?? null,
    });
  }, []);

  const prefetchChildren = useCallback(
    (type) => {
      if (!hasChildren(type)) return;
      queryClient.prefetchQuery({
        queryKey: childrenQueryKey(type.examTypeId),
        queryFn: () => getExamTypeChildren(type.examTypeId),
      });
    },
    [queryClient],
  );

  useEffect(() => {
    if (drillId == null) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') goBack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drillId, goBack]);

  const isDrill = drillId != null;

  const stageVariants = reduceMotion
    ? {
        enter: {opacity: 1},
        center: {opacity: 1},
        exit: {opacity: 0},
      }
    : {
        enter: {opacity: 0, rotateY: 78, scale: 0.94},
        center: {opacity: 1, rotateY: 0, scale: 1},
        exit: {opacity: 0, rotateY: -78, scale: 0.94},
      };

  const cardStagger = reduceMotion
    ? undefined
    : {
        hidden: {},
        show: {transition: {staggerChildren: 0.055, delayChildren: 0.12}},
      };

  const cardItem = {
    hidden: reduceMotion ? {opacity: 1} : {opacity: 0, y: 14, scale: 0.97},
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {duration: 0.32, ease: EASE},
    },
  };

  return (
    <section id="exam-types" className={cx('section')} aria-label="Khám phá loại đề">
      <div className={cx('atmosphere')} aria-hidden="true">
        <span className={cx('orb', 'orbA')} />
        <span className={cx('orb', 'orbB')} />
      </div>

      <div className={cx('inner')}>
        <header className={cx('header')}>
          <h2 className={cx('title')}>Chọn kỳ thi của bạn</h2>
          <p className={cx('subtitle')}>
            {isDrill
              ? `Đang xem các kỳ thi trong ${drill.name}`
              : 'Chạm vào kỳ thi bạn đang theo đuổi'}
          </p>
        </header>

        {isLoading ? (
          <div className={cx('grid')} aria-hidden="true">
            {Array.from({length: SKELETON_COUNT}, (_, i) => (
              <div key={i} className={cx('card', 'skeleton')} />
            ))}
          </div>
        ) : examTypes.length === 0 ? (
          <p className={cx('empty')}>Chưa có loại đề để hiển thị</p>
        ) : (
          <div className={cx('stage')}>
            <AnimatePresence mode="wait" initial={false}>
              {!isDrill ? (
                <motion.div
                  key="root"
                  className={cx('face')}
                  variants={stageVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{duration: reduceMotion ? 0.15 : 0.42, ease: EASE}}
                >
                  {/* Giữ chiều cao bằng tầng drill (có drillBar) để khung không nhảy size. */}
                  <div className={cx('drillBar', 'drillBarSpacer')} aria-hidden="true" />
                  <div className={cx('grid')}>
                    {examTypes.map((type) => (
                      <ExamTypeCard
                        key={type.examTypeId}
                        type={type}
                        onOpenParent={() => openParent(type)}
                        onPrefetch={() => prefetchChildren(type)}
                      />
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={`drill-${drillId}`}
                  className={cx('face')}
                  variants={stageVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{duration: reduceMotion ? 0.15 : 0.42, ease: EASE}}
                >
                  <div className={cx('drillBar')}>
                    <button type="button" className={cx('backBtn')} onClick={goBack}>
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                        <path
                          d="M12.5 4.5L7 10l5.5 5.5"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Tất cả kỳ thi
                    </button>

                    <div className={cx('parentChip')} aria-hidden="true">
                      <ParentMark name={drill.name} imageUrl={drill.imageUrl} />
                      <span className={cx('parentChipName')}>{drill.name}</span>
                    </div>
                  </div>

                  <motion.div
                    className={cx('grid')}
                    variants={cardStagger}
                    initial={reduceMotion ? false : 'hidden'}
                    animate="show"
                  >
                    {childrenLoading ? (
                      Array.from({length: 4}, (_, i) => (
                        <div key={i} className={cx('card', 'skeleton')} aria-hidden="true" />
                      ))
                    ) : childrenError ? (
                      <p className={cx('empty', 'emptySpan')}>
                        Không tải được danh sách. Bấm “Tất cả kỳ thi” rồi thử lại.
                      </p>
                    ) : children.length === 0 ? (
                      <p className={cx('empty', 'emptySpan')}>Chưa có kỳ thi con để hiển thị</p>
                    ) : (
                      children.map((type) =>
                        reduceMotion ? (
                          <ExamTypeCard
                            key={type.examTypeId}
                            type={type}
                            onOpenParent={() => openParent(type)}
                          />
                        ) : (
                          <motion.div key={type.examTypeId} variants={cardItem}>
                            <ExamTypeCard
                              type={type}
                              onOpenParent={() => openParent(type)}
                            />
                          </motion.div>
                        ),
                      )
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  );
}

function ParentMark({name, imageUrl}) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = Boolean(imageUrl) && !imgFailed;

  if (showImage) {
    return (
      <span className={cx('parentChipMark', 'hasImage')}>
        <img src={imageUrl} alt="" onError={() => setImgFailed(true)} />
      </span>
    );
  }

  return <span className={cx('parentChipMark')}>{getInitials(name)}</span>;
}

function ExamTypeCard({type, onOpenParent, onPrefetch}) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = Boolean(type.imageUrl) && !imgFailed;
  const expandable = hasChildren(type);
  const label = expandable ? `Xem các kỳ thi trong ${type.name}` : `Mở ${type.name}`;
  const className = cx('card');

  const body = (
    <>
      <div className={cx('monogram', {hasImage: showImage})} aria-hidden="true">
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
      <h3 className={cx('cardName')}>{type.name}</h3>
      <p className={cx('cardMeta')}>{getSubtitle(type)}</p>
    </>
  );

  if (expandable) {
    return (
      <button
        type="button"
        className={className}
        aria-label={label}
        onClick={onOpenParent}
        onMouseEnter={onPrefetch}
        onFocus={onPrefetch}
      >
        {body}
      </button>
    );
  }

  return (
    <Link href={buildExamTypeDetailPath(type.examTypeId)} className={className} aria-label={label}>
      {body}
    </Link>
  );
}

export default ExamTypeGrid;
