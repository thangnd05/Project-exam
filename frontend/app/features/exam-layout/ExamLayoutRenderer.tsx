'use client';

import { Fragment, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import classNames from 'classnames/bind';
import { useTranslations } from 'next-intl';

import TestStartDashboard from '@/app/features/tests/TestStartDashboard';
import QuestionAreaBlock from '@/app/features/exam-layout/blocks/QuestionAreaBlock';
import TimerBlock from '@/app/features/exam-layout/blocks/TimerBlock';
import ProgressBlock from '@/app/features/exam-layout/blocks/ProgressBlock';
import SubmitBlock from '@/app/features/exam-layout/blocks/SubmitBlock';
import QuestionNavBlock from '@/app/features/exam-layout/blocks/QuestionNavBlock';
import BannerBlock from '@/app/features/exam-layout/blocks/BannerBlock';
import FlagButton from '@/app/features/exam-layout/blocks/FlagButton';
import { BLOCK_TYPES, ZONES } from '@/app/features/exam-layout/layoutSchema';
import type { LayoutBlock, LayoutConfig, LayoutTheme } from '@/app/features/exam-layout/layoutSchema';
import type {
  AnswerChangeHandler,
  ExamFlowStep,
  ExamPart,
  ExamQuestion,
  ExamUserAnswers,
  QuestionIndexMap,
} from '@/app/features/exam-layout/examLayoutTypes';
import pageStyles from '@/app/features/exam-layout/TestStart.module.scss';
import zoneStyles from '@/app/features/exam-layout/examLayout.module.scss';

const cx = classNames.bind(pageStyles);
const zx = classNames.bind(zoneStyles);

function buildThemeStyle(theme: LayoutTheme = {}, contentMaxWidth?: number | null): React.CSSProperties {
  const style: Record<string, string> = {};
  if (theme.primary) {
    style['--primary'] = theme.primary;
    style['--primary-color'] = theme.primary;
  }
  if (theme.font) style['--font-family'] = theme.font;
  if (theme.radius != null) style['--exam-radius'] = `${theme.radius}px`;
  if (contentMaxWidth) style['--exam-content-width'] = `${contentMaxWidth}px`;
  return style as React.CSSProperties;
}

type ExamLayoutRendererProps = {
  config: LayoutConfig;
  isPractice?: boolean;
  title?: string;
  // Tên loại đề/chứng chỉ, hiện mờ trước tên đề trên thanh đầu.
  subtitle?: string;
  onExit?: () => void;
  visibleParts: ExamPart[];
  questionIndexMap: QuestionIndexMap;
  userAnswers: ExamUserAnswers;
  handleAnswerChange: AnswerChangeHandler;
  flaggedQuestionIds?: string[];
  onToggleFlag?: (questionId: string) => void;
  allQuestions: ExamQuestion[];
  timeLeft?: number | null;
  formatTime: (seconds: number) => string;
  isSubmitting?: boolean;
  handleSubmit?: () => void;
  preview?: boolean;
  interactive?: boolean;
  selectedId?: string | null;
  onSelectBlock?: (blockId: string) => void;

  isPaged?: boolean;
  flowSteps?: ExamFlowStep[];
  currentStepIndex?: number;
  canGoPrev?: boolean;
  goNext?: () => void;
  goPrev?: () => void;
  goToQuestion?: (questionId: string) => void;
  canNavigateToQuestion?: (questionId: string) => boolean;
};

// Khung phòng thi theo mẫu: thanh đầu (tên đề + vùng TRÊN), cột bên (vùng TRÁI/PHẢI), cột làm bài ở giữa
// gồm thanh câu hiện tại, nội dung câu và thanh chân (Câu trước/Câu tiếp + vùng DƯỚI).
function ExamLayoutRenderer({
  config,
  isPractice,
  title,
  subtitle,
  onExit,
  visibleParts,
  questionIndexMap,
  userAnswers,
  handleAnswerChange,
  flaggedQuestionIds,
  onToggleFlag,
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
  const t = useTranslations('TestTaking.examLayout');
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  const answered = Object.keys(userAnswers).length;
  const total = allQuestions.length;

  const currentStep = isPaged ? flowSteps[currentStepIndex] : undefined;
  const currentStepQuestionIds = isPaged
    ? new Set((currentStep?.questions || []).map((q) => q.questionId))
    : null;

  const visibleBlocks = (config.blocks || []).filter((b) => b.visible !== false);

  // Danh sách câu dạng cột bên đã hiện "đã làm / tổng" ở đầu thẻ, nên khối Tiến độ khi đó bị trùng -> ẩn đi.
  const hasSideNav = visibleBlocks.some(
    (b) =>
      b.type === BLOCK_TYPES.QUESTION_NAV && (b.zone === ZONES.LEFT || b.zone === ZONES.RIGHT),
  );
  const hasSubmitBlock = visibleBlocks.some((b) => b.type === BLOCK_TYPES.SUBMIT);

  const byZone = (zone: string) =>
    visibleBlocks
      .filter(
        (b) =>
          b.type !== BLOCK_TYPES.QUESTION_AREA &&
          !(hasSideNav && b.type === BLOCK_TYPES.PROGRESS) &&
          b.zone === zone,
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
    flaggedQuestionIds,
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
        if (zone !== ZONES.LEFT && zone !== ZONES.RIGHT) {
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
          <TestStartDashboard
            allQuestions={allQuestions}
            userAnswers={userAnswers}
            onScrollToQuestion={navigateToQuestion}
            columns={block.props?.navColumns ?? 5}
            fill
            {...dashboardPagingProps}
          />
        );
      default:
        return null;
    }
  };

  const wrap = (block: LayoutBlock, node: React.ReactNode, zone: string) => {
    const spacing = block.props?.spacing;
    const posStyle: React.CSSProperties =
      spacing !== undefined && spacing !== null && spacing !== '' ? { padding: `${spacing}px` } : {};
    const isSideNav =
      block.type === BLOCK_TYPES.QUESTION_NAV && (zone === ZONES.LEFT || zone === ZONES.RIGHT);
    if (!interactive && Object.keys(posStyle).length === 0 && !isSideNav) {
      return <Fragment key={block.id}>{node}</Fragment>;
    }
    const selected = selectedId === block.id;
    const interactiveStyle: React.CSSProperties = interactive
      ? {
          cursor: 'pointer',
          borderRadius: 8,
          outline: selected ? '2px solid var(--primary)' : '2px solid transparent',
          outlineOffset: -2,
        }
      : {};
    return (
      <div
        key={block.id}
        className={cx({ 'side-nav-slot': isSideNav })}
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

  const renderBlocks = (blocks: LayoutBlock[], zone: string) =>
    blocks.map((b) => wrap(b, renderBlockNode(b, zone), zone));

  // Vùng ngang (TRÊN/DƯỚI) chia 3 nhóm theo căn lề trái/giữa/phải.
  const horizontalGroupOf = (b: LayoutBlock, fallback: string) => {
    const a = b.align || fallback;
    if (a === 'left' || a === 'start') return 'left';
    if (a === 'center') return 'center';
    return 'right';
  };
  const splitHorizontal = (blocks: LayoutBlock[], fallback: string) => ({
    left: blocks.filter((b) => horizontalGroupOf(b, fallback) === 'left'),
    center: blocks.filter((b) => horizontalGroupOf(b, fallback) === 'center'),
    right: blocks.filter((b) => horizontalGroupOf(b, fallback) === 'right'),
  });

  const topBlocks = byZone(ZONES.TOP);
  const toolbarBlocks = byZone(ZONES.TOOLBAR);
  const leftBlocks = byZone(ZONES.LEFT);
  const rightBlocks = byZone(ZONES.RIGHT);
  const bottomBlocks = byZone(ZONES.BOTTOM);
  const floatBlocks = byZone(ZONES.FLOAT);

  const hasNav = visibleBlocks.some((b) => b.type === BLOCK_TYPES.QUESTION_NAV);
  const isNav = (b: LayoutBlock) => b.type === BLOCK_TYPES.QUESTION_NAV;
  // Màn nhỏ: cột bên chứa danh sách câu được thu vào bảng trượt "Câu hỏi"; các khối đi kèm trong cột
  // (vd. nút nộp bài) nằm dưới danh sách trong bảng đó.
  const sideBlocksWithNav = [leftBlocks, rightBlocks].filter((blocks) => blocks.some(isNav));
  const sheetExtras = sideBlocksWithNav.flat().filter((b) => !isNav(b));

  // Bước hiện tại chỉ có một câu: số câu và nút Đánh dấu chuyển lên thanh câu hiện tại như mẫu.
  const singleQuestion = currentStep?.questions.length === 1 ? currentStep.questions[0] : null;
  const stepNumbers = (currentStep?.questions || [])
    .map((q) => questionIndexMap[q.questionId])
    .filter((n): n is number => typeof n === 'number');

  const questionArea = (
    <QuestionAreaBlock
      isPractice={isPractice}
      visibleParts={visibleParts}
      questionIndexMap={questionIndexMap}
      userAnswers={userAnswers}
      handleAnswerChange={handleAnswerChange}
      flaggedQuestionIds={flaggedQuestionIds}
      onToggleFlag={onToggleFlag}
      config={config.questionArea}
      isPaged={isPaged}
      flowSteps={flowSteps}
      currentStepIndex={currentStepIndex}
      goNext={goNext}
      headInToolbar={Boolean(singleQuestion)}
    />
  );

  const mobileNavTrigger =
    hasNav && !preview ? (
      <button
        type="button"
        className={cx('mobile-nav-trigger')}
        onClick={() => setShowInfoPanel((v) => !v)}
        aria-expanded={showInfoPanel}
        aria-label={t('showQuestionList')}
        title={t('questionList')}
      >
        <span>{t('questions')}</span>
        <span className={cx('mobile-nav-count')}>
          {answered}/{total}
        </span>
      </button>
    ) : null;

  const topGroups = splitHorizontal(topBlocks, 'left');
  const header =
    title || topBlocks.length > 0 || onExit ? (
      <header className={cx('exam-header')}>
        <div className={cx('exam-header-group')}>
          {subtitle && (
            <>
              <span className={cx('exam-header-subtitle')}>{subtitle}</span>
              {title && <span className={cx('exam-header-sep')} aria-hidden />}
            </>
          )}
          {title && <span className={cx('exam-header-title')}>{title}</span>}
          {renderBlocks(topGroups.left, ZONES.TOP)}
        </div>
        <div className={cx('exam-header-group', 'center')}>
          {renderBlocks(topGroups.center, ZONES.TOP)}
        </div>
        <div className={cx('exam-header-group', 'right')}>
          {renderBlocks(topGroups.right, ZONES.TOP)}
          {onExit && (
            <button type="button" className={cx('exam-header-exit')} onClick={onExit}>
              {t('exit')}
            </button>
          )}
        </div>
      </header>
    ) : null;

  // Cột bên: danh sách câu chiếm phần giữa; khối căn "Dưới" ghim ở chân cột, các khối khác nằm trên.
  const renderSide = (blocks: LayoutBlock[], zone: string) => {
    if (blocks.length === 0) return null;
    const footerBlocks = blocks.filter(
      (b) => b.type !== BLOCK_TYPES.QUESTION_NAV && (b.align === 'end' || b.align === 'bottom'),
    );
    const mainBlocks = blocks.filter((b) => !footerBlocks.includes(b));
    const navIndex = mainBlocks.findIndex((b) => b.type === BLOCK_TYPES.QUESTION_NAV);
    const before = navIndex < 0 ? mainBlocks : mainBlocks.slice(0, navIndex);
    const nav = navIndex < 0 ? [] : [mainBlocks[navIndex]];
    const after = navIndex < 0 ? [] : mainBlocks.slice(navIndex + 1);
    return (
      <aside
        className={cx(zone === ZONES.LEFT ? 'exam-side-left' : 'exam-side-right', 'exam-side', {
          'hidden-on-mobile': blocks.some(isNav),
        })}
      >
        {before.length > 0 && <div className={cx('exam-side-section')}>{renderBlocks(before, zone)}</div>}
        {nav.length > 0 ? (
          renderBlocks(nav, zone)
        ) : (
          <div className={cx('exam-side-spacer')} />
        )}
        {after.length > 0 && <div className={cx('exam-side-section')}>{renderBlocks(after, zone)}</div>}
        {footerBlocks.length > 0 && (
          <div className={cx('exam-side-footer')}>{renderBlocks(footerBlocks, zone)}</div>
        )}
      </aside>
    );
  };

  // Thanh câu hiện tại: số câu bên trái, các khối của vùng "Thanh câu hỏi" chia theo căn lề.
  const toolbarGroups = splitHorizontal(toolbarBlocks, 'right');
  const showToolbar = Boolean(isPaged && currentStep) || toolbarBlocks.length > 0;
  const toolbar = showToolbar && (
    <div className={cx('exam-toolbar')}>
      <div className={cx('exam-toolbar-info')}>
        {isPaged && stepNumbers.length > 0 && (
          <span className={cx('exam-toolbar-number')}>
            {t.rich('questionOf', {
              number:
                stepNumbers.length > 1
                  ? `${Math.min(...stepNumbers)}–${Math.max(...stepNumbers)}`
                  : String(stepNumbers[0]),
              total,
              b: (chunks) => <b>{chunks}</b>,
            })}
          </span>
        )}
        {isPaged && currentStep?.partName && (
          <>
            <span className={cx('exam-toolbar-sep')} aria-hidden />
            <span className={cx('exam-toolbar-part')}>{currentStep.partName}</span>
          </>
        )}
        {renderBlocks(toolbarGroups.left, ZONES.TOOLBAR)}
      </div>
      <div className={cx('exam-toolbar-actions', 'center')}>
        {renderBlocks(toolbarGroups.center, ZONES.TOOLBAR)}
      </div>
      <div className={cx('exam-toolbar-actions')}>
        {singleQuestion && onToggleFlag && (
          <FlagButton
            flagged={flaggedQuestionIds?.includes(singleQuestion.questionId) ?? false}
            onToggle={() => onToggleFlag(singleQuestion.questionId)}
          />
        )}
        {renderBlocks(toolbarGroups.right, ZONES.TOOLBAR)}
        {mobileNavTrigger}
      </div>
    </div>
  );

  const gated = Boolean(currentStep?.audioGated);
  const isLastStep = currentStepIndex >= flowSteps.length - 1;
  const showStepNav = isPaged && !gated && flowSteps.length > 1;
  const bottomGroups = splitHorizontal(bottomBlocks, 'right');
  const hasBottomBar = showStepNav || bottomBlocks.length > 0;

  const bottomBar = hasBottomBar ? (
    <div className={cx('exam-bottom')}>
      <div className={cx('exam-bottom-group')}>
        {showStepNav && (
          <button
            type="button"
            className={cx('step-btn', 'step-btn-prev')}
            onClick={goPrev}
            disabled={!canGoPrev}
          >
            <ArrowLeft size="1em" aria-hidden />
            {t('prev')}
          </button>
        )}
        {renderBlocks(bottomGroups.left, ZONES.BOTTOM)}
      </div>
      <div className={cx('exam-bottom-group', 'center')}>
        {renderBlocks(bottomGroups.center, ZONES.BOTTOM)}
      </div>
      <div className={cx('exam-bottom-group', 'right')}>
        {renderBlocks(bottomGroups.right, ZONES.BOTTOM)}
        {showStepNav && !isLastStep && (
          <button type="button" className={cx('step-btn', 'step-btn-next')} onClick={goNext}>
            {t('next')}
            <ArrowRight size="1em" aria-hidden />
          </button>
        )}
        {/* Câu cuối mà bố cục không có nút nộp bài: nút "Câu tiếp" thành "Nộp bài" như mẫu. */}
        {showStepNav && isLastStep && !hasSubmitBlock && handleSubmit && (
          <button
            type="button"
            className={cx('step-btn', 'step-btn-next')}
            onClick={preview ? undefined : handleSubmit}
            disabled={isSubmitting}
          >
            {t('submit')}
          </button>
        )}
      </div>
    </div>
  ) : null;

  const floatStack =
    floatBlocks.length === 0 ? null : (
      <div className={zx('zoneFloat', { previewFloat: preview })}>
        {renderBlocks(floatBlocks, ZONES.FLOAT)}
      </div>
    );

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
          aria-label={t('questionList')}
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
          {sheetExtras.length > 0 && (
            <div
              className={cx('exam-side', 'mobile-nav-extras')}
              // Bấm nút (vd. nộp bài) thì đóng bảng trượt để hộp xác nhận không bị che.
              onClick={(e) => {
                if ((e.target as HTMLElement).closest('button')) setShowInfoPanel(false);
              }}
            >
              {sheetExtras.map((b) => (
                <Fragment key={b.id}>{renderBlockNode(b, b.zone)}</Fragment>
              ))}
            </div>
          )}
        </div>
      </div>
    ) : null;

  return (
    <div
      className={cx('exam-shell', { 'exam-shell-preview': preview })}
      style={buildThemeStyle(config.theme, config.questionArea?.maxWidth)}
    >
      {header}

      <div className={cx('exam-body')}>
        {renderSide(leftBlocks, ZONES.LEFT)}

        <section className={cx('exam-main')}>
          {toolbar}
          <div className={cx('exam-scroll', { 'paged-fit-scroll': isPaged })}>
            {!showToolbar && mobileNavTrigger && (
              <div className={cx('mobile-nav-bar')}>{mobileNavTrigger}</div>
            )}
            {questionArea}
          </div>
          {bottomBar}
        </section>

        {renderSide(rightBlocks, ZONES.RIGHT)}
      </div>

      {preview
        ? floatStack
        : floatStack && createPortal(floatStack, document.body)}

      {mobileNavSheet && createPortal(mobileNavSheet, document.body)}
    </div>
  );
}

export default ExamLayoutRenderer;
