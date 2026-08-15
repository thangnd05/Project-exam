'use client';

import { Fragment, useState } from 'react';
import { createPortal } from 'react-dom';
import { Container } from 'react-bootstrap';
import { IoGridOutline } from 'react-icons/io5';
import classNames from 'classnames/bind';

import TestStartDashboard from '@/app/components/tests/TestStartDashboard';
import QuestionAreaBlock from '@/app/components/exam-layout/blocks/QuestionAreaBlock';
import TimerBlock from '@/app/components/exam-layout/blocks/TimerBlock';
import ProgressBlock from '@/app/components/exam-layout/blocks/ProgressBlock';
import SubmitBlock from '@/app/components/exam-layout/blocks/SubmitBlock';
import QuestionNavBlock from '@/app/components/exam-layout/blocks/QuestionNavBlock';
import BannerBlock from '@/app/components/exam-layout/blocks/BannerBlock';
import { BLOCK_TYPES, ZONES } from '@/app/components/exam-layout/layoutSchema';
import type { LayoutBlock, LayoutConfig, LayoutTheme } from '@/app/components/exam-layout/layoutSchema';
import type {
  AnswerChangeHandler,
  ExamFlowStep,
  ExamPart,
  ExamQuestion,
  ExamUserAnswers,
  QuestionIndexMap,
} from '@/app/components/exam-layout/examLayoutTypes';
// Trang làm bài và engine layout dùng chung class; scss đặt cạnh engine để bớt import chéo.
import pageStyles from '@/app/components/exam-layout/TestStart.module.scss';
import zoneStyles from '@/app/components/exam-layout/examLayout.module.scss';

const cx = classNames.bind(pageStyles);
const zx = classNames.bind(zoneStyles);

function buildThemeStyle(theme: LayoutTheme = {}): React.CSSProperties {
  // CSS custom property (--primary...) không nằm trong CSSProperties nên gom vào record rồi cast.
  const style: Record<string, string> = {};
  if (theme.primary) {
    style['--primary'] = theme.primary;
    style['--primary-color'] = theme.primary;
  }
  if (theme.font) style['--font-family'] = theme.font;
  if (theme.radius != null) style['--exam-radius'] = `${theme.radius}px`;
  return style as React.CSSProperties;
}

type ExamLayoutRendererProps = {
  config: LayoutConfig;
  isPractice?: boolean;
  visibleParts: ExamPart[];
  questionIndexMap: QuestionIndexMap;
  userAnswers: ExamUserAnswers;
  handleAnswerChange: AnswerChangeHandler;
  allQuestions: ExamQuestion[];
  timeLeft?: number | null;
  formatTime: (seconds: number) => string;
  isSubmitting?: boolean;
  handleSubmit?: () => void;
  /** preview = render trong layout builder (không gắn portal/scroll của trang làm bài) */
  preview?: boolean;
  /** interactive = cho phép click chọn yếu tố trong layout builder */
  interactive?: boolean;
  selectedId?: string | null;
  onSelectBlock?: (blockId: string) => void;

  /** Chế độ PAGED: từng câu/nhóm một */
  isPaged?: boolean;
  flowSteps?: ExamFlowStep[];
  currentStepIndex?: number;
  canGoPrev?: boolean;
  goNext?: () => void;
  goPrev?: () => void;
  goToQuestion?: (questionId: string) => void;
  canNavigateToQuestion?: (questionId: string) => boolean;
};

function ExamLayoutRenderer({
  config,
  isPractice,
  visibleParts,
  questionIndexMap,
  userAnswers,
  handleAnswerChange,
  allQuestions,
  timeLeft,
  formatTime,
  isSubmitting,
  handleSubmit,
  preview = false,
  interactive = false,
  selectedId = null,
  onSelectBlock,

  isPaged = false,
  flowSteps = [],
  currentStepIndex = 0,
  canGoPrev = false,
  goNext,
  goPrev,
  goToQuestion,
  canNavigateToQuestion,
}: ExamLayoutRendererProps) {
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  const answered = Object.keys(userAnswers).length;
  const total = allQuestions.length;

  const currentStepQuestionIds = isPaged
    ? new Set((flowSteps[currentStepIndex]?.questions || []).map((q) => q.questionId))
    : null;

  const byZone = (zone: string) =>
    (config.blocks || [])
      .filter(
        (b) => b.visible !== false && b.type !== BLOCK_TYPES.QUESTION_AREA && b.zone === zone,
      )
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const scrollToQuestion = (questionId: string) => {
    const element = document.getElementById(`q-${questionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const navigateToQuestion = (questionId: string) => {
    if (isPaged) {
      goToQuestion?.(questionId);
    } else {
      scrollToQuestion(questionId);
    }
  };

  const dashboardPagingProps = {
    isPaged,
    canNavigateToQuestion,
    currentQuestionIds: currentStepQuestionIds,
  };

  const renderBlockNode = (block: LayoutBlock, zone: string) => {
    switch (block.type) {
      case BLOCK_TYPES.TIMER:
        return <TimerBlock timeLeft={timeLeft} formatTime={formatTime} />;
      case BLOCK_TYPES.PROGRESS:
        return <ProgressBlock answered={answered} total={total} />;
      case BLOCK_TYPES.SUBMIT:
        return (
          <SubmitBlock
            onSubmit={preview ? undefined : handleSubmit}
            isSubmitting={isSubmitting}
            label={block.props?.label}
          />
        );
      case BLOCK_TYPES.BANNER:
        return <BannerBlock url={block.props?.url} showPlaceholder={interactive} />;
      case BLOCK_TYPES.QUESTION_NAV:
        if (zone === ZONES.BOTTOM) {
          return (
            <QuestionNavBlock
              open={showInfoPanel}
              onToggle={() => setShowInfoPanel((v) => !v)}
              toggleLabel={block.props?.toggleLabel}
              hideLabel={block.props?.hideLabel}
            />
          );
        }

        return (
          <div className={zx('sideNavInline')}>
            <TestStartDashboard
              allQuestions={allQuestions}
              userAnswers={userAnswers}
              onScrollToQuestion={navigateToQuestion}
              columns={block.props?.navColumns ?? 5}
              {...dashboardPagingProps}
            />
          </div>
        );
      default:
        return null;
    }
  };

  const blockWrapStyle = (block: LayoutBlock, zone: string) => {
    const style: React.CSSProperties = {};
    const spacing = block.props?.spacing;
    if (spacing !== undefined && spacing !== null && spacing !== '') {
      style.padding = `${spacing}px`;
    }
    const align = block.align;
    if (zone === ZONES.LEFT || zone === ZONES.RIGHT) {
      style.alignSelf =
        align === 'center' ? 'center' : align === 'end' || align === 'bottom' ? 'flex-end' : 'flex-start';
    } else if (zone === ZONES.TOP) {
      if (align === 'center') {
        style.marginLeft = 'auto';
        style.marginRight = 'auto';
      } else if (align === 'right' || align === 'end') {
        style.marginLeft = 'auto';
      }
    }
    return style;
  };

  const wrap = (block: LayoutBlock, node: React.ReactNode, zone: string) => {
    const posStyle = blockWrapStyle(block, zone);
    if (!interactive && Object.keys(posStyle).length === 0) {
      return <Fragment key={block.id}>{node}</Fragment>;
    }
    const selected = selectedId === block.id;
    const interactiveStyle: React.CSSProperties = interactive
      ? {
          cursor: 'pointer',
          borderRadius: 8,
          outline: selected ? '2px solid var(--primary)' : '2px solid transparent',
          outlineOffset: 2,
        }
      : {};
    return (
      <div
        key={block.id}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        onClick={
          interactive
            ? (e) => {
                e.stopPropagation();
                onSelectBlock?.(block.id);
              }
            : undefined
        }
        style={{ ...posStyle, ...interactiveStyle }}
      >
        {node}
      </div>
    );
  };

  const isPill = (b: LayoutBlock) => b.type === BLOCK_TYPES.TIMER || b.type === BLOCK_TYPES.PROGRESS;
  const footerGroupOf = (b: LayoutBlock) => {
    const a = b.align || 'right';
    if (a === 'left') return 'left';
    if (a === 'center') return 'center';
    return 'right';
  };

  const topBlocks = byZone(ZONES.TOP);
  const leftBlocks = byZone(ZONES.LEFT);
  const rightBlocks = byZone(ZONES.RIGHT);
  const bottomBlocks = byZone(ZONES.BOTTOM);
  const floatBlocks = byZone(ZONES.FLOAT);

  const hasNav = (config.blocks || []).some(
    (b) => b.visible !== false && b.type === BLOCK_TYPES.QUESTION_NAV,
  );
  const isNavOnly = (blocks: LayoutBlock[]) =>
    blocks.length > 0 && blocks.every((b) => b.type === BLOCK_TYPES.QUESTION_NAV);

  const questionArea = (
    <QuestionAreaBlock
      isPractice={isPractice}
      visibleParts={visibleParts}
      questionIndexMap={questionIndexMap}
      userAnswers={userAnswers}
      handleAnswerChange={handleAnswerChange}
      config={config.questionArea}
      isPaged={isPaged}
      flowSteps={flowSteps}
      currentStepIndex={currentStepIndex}
      canGoPrev={canGoPrev}
      goNext={goNext}
      goPrev={goPrev}
    />
  );
  const renderFooterGroup = (blocks: LayoutBlock[]) => {
    const navs = blocks.filter((b) => b.type === BLOCK_TYPES.QUESTION_NAV);
    const pills = blocks.filter(isPill);
    const others = blocks.filter((b) => !isPill(b) && b.type !== BLOCK_TYPES.QUESTION_NAV);
    return (
      <>
        {navs.map((b) => wrap(b, renderBlockNode(b, ZONES.BOTTOM), ZONES.BOTTOM))}
        {pills.length > 0 && (
          <div className={cx('footer-pills')}>
            {pills.map((b) => wrap(b, renderBlockNode(b, ZONES.BOTTOM), ZONES.BOTTOM))}
          </div>
        )}
        {others.map((b) => wrap(b, renderBlockNode(b, ZONES.BOTTOM), ZONES.BOTTOM))}
      </>
    );
  };
  const footerLeft = bottomBlocks.filter((b) => footerGroupOf(b) === 'left');
  const footerCenter = bottomBlocks.filter((b) => footerGroupOf(b) === 'center');
  const footerRight = bottomBlocks.filter((b) => footerGroupOf(b) === 'right');

  const footer =
    bottomBlocks.length === 0 ? null : (
      <div className={cx('footer-actions')} style={{ position: 'static' }}>
        <div className={cx('footer-buttons')}>
          <Container className={cx('footer-buttons-inner')}>
            <div className={zx('footerGroup')}>{renderFooterGroup(footerLeft)}</div>
            <div className={zx('footerGroup')}>{renderFooterGroup(footerCenter)}</div>
            <div className={cx('footer-right-group')}>{renderFooterGroup(footerRight)}</div>
          </Container>
        </div>
      </div>
    );

  const floatStack =
    floatBlocks.length === 0 ? null : (
      <div className={zx('zoneFloat', { previewFloat: preview })}>
        {floatBlocks.map((b) => wrap(b, renderBlockNode(b, ZONES.FLOAT), ZONES.FLOAT))}
      </div>
    );

  const mobileNavTrigger =
    hasNav && !preview ? (
      <div className={cx('mobile-nav-bar')}>
        <button
          type="button"
          className={cx('mobile-nav-trigger')}
          onClick={() => setShowInfoPanel((v) => !v)}
          aria-expanded={showInfoPanel}
          aria-label="Xem danh sách câu hỏi"
          title="Danh sách câu hỏi"
        >
          <IoGridOutline size={24} />
        </button>
      </div>
    ) : null;

  const mobileNavSheet =
    hasNav && !preview && showInfoPanel ? (
      <div
        className={cx('mobile-nav-backdrop')}
        onClick={() => setShowInfoPanel(false)}
        role="presentation"
      >
        <div
          className={cx('mobile-nav-sheet')}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-label="Danh sách câu hỏi"
        >
          <TestStartDashboard
            allQuestions={allQuestions}
            userAnswers={userAnswers}
            onScrollToQuestion={(id: string) => {
              navigateToQuestion(id);
              setShowInfoPanel(false);
            }}
            {...dashboardPagingProps}
          />
        </div>
      </div>
    ) : null;

  const wrapperStyle: React.CSSProperties = preview
    ? { ...buildThemeStyle(config.theme), position: 'relative' }
    : {
        ...buildThemeStyle(config.theme),
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
        marginTop: 0,
        paddingBottom: 0,
      };

  return (
    <div className={cx('wrapper')} style={wrapperStyle}>
      {topBlocks.length > 0 && (
        <div className={zx('zoneTop')}>
          {topBlocks.map((b) => wrap(b, renderBlockNode(b, ZONES.TOP), ZONES.TOP))}
        </div>
      )}

      <div
        className={zx('scrollBody')}
        style={preview ? { flex: 'none', overflow: 'visible' } : undefined}
      >
        <div className={zx('innerRow')}>
          {leftBlocks.length > 0 && (
            <aside className={zx('zoneLeft', { hiddenOnMobile: isNavOnly(leftBlocks) })}>
              {leftBlocks.map((b) => wrap(b, renderBlockNode(b, ZONES.LEFT), ZONES.LEFT))}
            </aside>
          )}
          <div
            className={zx('centerScroll', { pagedFit: isPaged })}
            style={preview ? { overflowY: 'visible' } : undefined}
          >
            {mobileNavTrigger}
            {questionArea}
          </div>
          {rightBlocks.length > 0 && (
            <aside className={zx('zoneRight', { hiddenOnMobile: isNavOnly(rightBlocks) })}>
              {rightBlocks.map((b) => wrap(b, renderBlockNode(b, ZONES.RIGHT), ZONES.RIGHT))}
            </aside>
          )}
        </div>
      </div>

      {footer}

      {preview
        ? floatStack
        : floatStack && createPortal(floatStack, document.body)}

      {mobileNavSheet && createPortal(mobileNavSheet, document.body)}
    </div>
  );
}

export default ExamLayoutRenderer;
