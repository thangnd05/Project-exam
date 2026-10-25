'use client';

import { useParams } from 'next/navigation';
import { useRouter } from '@/app/i18n/navigation';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'react-toastify';
import { Spinner } from 'react-bootstrap';
import { ArrowLeft, Eye, EyeOff, GripVertical, Trash2 } from 'lucide-react';
import classNames from 'classnames/bind';

import {useExamTypeById} from '@/app/features/exam-types/hooks/useExamTypes';
import {useOwnExamTypeLayout, useUpdateExamTypeLayout} from '@/app/[locale]/(admin)/admin/exam-types/_hooks/useAdminExamTypes';
import { resolveLayoutConfig } from '@/app/features/exam-layout/resolveLayoutConfig';
import {
  defaultLayoutConfig,
  BLOCK_META,
  ZONE_META,
  ZONES,
  BLOCK_TYPES,
  ADDABLE_BLOCK_TYPES,
  DEFAULT_NAVIGATION_MODE,
} from '@/app/features/exam-layout/layoutSchema';
import type { LayoutBlock, LayoutConfig } from '@/app/features/exam-layout/layoutSchema';
import ExamLayoutRenderer from '@/app/features/exam-layout/ExamLayoutRenderer';
import ConfirmModal from '@/app/components/modal/ConfirmModal';
import { buildSampleExam } from '@/app/[locale]/(admin)/admin/exam-types/[examTypeId]/layout/_lib/sampleExamData';
import ScaledPreview from './_components/ScaledPreview';
import ZoneGlyph from './_components/ZoneGlyph';
import styles from './ExamTypeLayoutEditor.module.scss';
import { brandColors } from '@/app/assets/styles/brandColors';
import { getApiErrorMessage } from '@/app/utils/apiError';

const cx = classNames.bind(styles);

const FONT_OPTIONS = ['Inter', 'Roboto', 'Arial', 'Times New Roman', 'Georgia'];

// Màn hình giả lập cho phần xem trước (cỡ laptop phổ biến).
const PREVIEW_WIDTH = 1280;
const PREVIEW_HEIGHT = 760;

const formatTime = (seconds: number | null | undefined) => {
  if (seconds === null || seconds === undefined) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

type AlignLabelKey = 'top' | 'middle' | 'bottom' | 'left' | 'center' | 'right';

function alignOptionsFor(zone: string): Array<{ value: string; labelKey: AlignLabelKey }> {
  if (zone === ZONES.LEFT || zone === ZONES.RIGHT) {
    return [
      { value: 'start', labelKey: 'top' },
      { value: 'center', labelKey: 'middle' },
      { value: 'end', labelKey: 'bottom' },
    ];
  }
  return [
    { value: 'left', labelKey: 'left' },
    { value: 'center', labelKey: 'center' },
    { value: 'right', labelKey: 'right' },
  ];
}

// Nhãn dịch cho các vùng/yếu tố đã biết; loại lạ thì giữ nhãn từ BLOCK_META/ZONE_META.
const ZONE_LABEL_KEYS = ['TOP', 'TOOLBAR', 'LEFT', 'RIGHT', 'BOTTOM', 'FLOAT'] as const;
const BLOCK_LABEL_KEYS = ['timer', 'progress', 'submit', 'questionNav', 'banner', 'title'] as const;
const isZoneLabelKey = (key: string): key is (typeof ZONE_LABEL_KEYS)[number] =>
  (ZONE_LABEL_KEYS as readonly string[]).includes(key);
const isBlockLabelKey = (key: string): key is (typeof BLOCK_LABEL_KEYS)[number] =>
  (BLOCK_LABEL_KEYS as readonly string[]).includes(key);
function alignDefaultFor(zone: string) {
  if (zone === ZONES.LEFT || zone === ZONES.RIGHT) return 'start';
  if (zone === ZONES.BOTTOM || zone === ZONES.TOOLBAR) return 'right';
  return 'left';
}

function normalizeOrders(blocks: LayoutBlock[]) {
  const counters: Record<string, number> = {};
  return blocks.map((b) => {
    counters[b.zone] = (counters[b.zone] || 0) + 1;
    return { ...b, order: counters[b.zone] };
  });
}

function ExamTypeLayoutEditor() {
  const { examTypeId } = useParams<{examTypeId: string}>();
  const router = useRouter();
  const t = useTranslations('AdminContent.layoutEditor');

  const zoneLabel = (key: string, fallback: string) => (isZoneLabelKey(key) ? t(`zones.${key}`) : fallback);
  const blockLabel = (type: string) =>
    isBlockLabelKey(type) ? t(`blocks.${type}`) : BLOCK_META[type]?.label || type;
  const alignLabel = (block: LayoutBlock) => {
    if (block.zone === ZONES.FLOAT) return null;
    const value = block.align || alignDefaultFor(block.zone);
    const option = alignOptionsFor(block.zone).find((o) => o.value === value);
    return option ? t(`alignOptions.${option.labelKey}`) : null;
  };

  const { sampleExamData, sampleAllQuestions, sampleQuestionIndexMap, sampleFlowSteps } = useMemo(
    () =>
      buildSampleExam({
        passage: t('sample.passage'),
        questionWithPassage: t('sample.questionWithPassage'),
        questionWithoutPassage: t('sample.questionWithoutPassage'),
        answer: (label) => t('sample.answer', { label }),
      }),
    [t],
  );

  const [config, setConfig] = useState<LayoutConfig>(defaultLayoutConfig);
  // Bản đang lưu trên server, để biết có thay đổi chưa lưu hay không.
  const [savedConfig, setSavedConfig] = useState<LayoutConfig>(defaultLayoutConfig);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropZone, setDropZone] = useState<string | null>(null);
  const [previewStep, setPreviewStep] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const propertiesRef = useRef<HTMLDivElement | null>(null);

  // Chọn yếu tố từ khung xem trước thì cuộn danh sách vùng tới phần thuộc tính vừa mở.
  useEffect(() => {
    if (selectedId) propertiesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedId]);

  const saveLayout = useUpdateExamTypeLayout();
  const saving = saveLayout.isPending;

  const { examType } = useExamTypeById(examTypeId);
  const examTypeName = examType?.name || '';

  const { layout, isLoading: loading } = useOwnExamTypeLayout(examTypeId);

  // Nạp lại cấu hình mỗi khi layout từ server thay đổi
  const [prevLayout, setPrevLayout] = useState<typeof layout>(undefined);
  if (layout !== prevLayout) {
    setPrevLayout(layout);
    if (layout !== undefined) {
      const resolved = resolveLayoutConfig(layout);
      setConfig(resolved);
      setSavedConfig(resolved);
    }
  }

  const dirty = useMemo(
    () => JSON.stringify(config) !== JSON.stringify(savedConfig),
    [config, savedConfig],
  );

  // Đóng/tải lại tab khi còn thay đổi chưa lưu thì trình duyệt hỏi lại.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const updateBlocks = useCallback((fn: (blocks: LayoutBlock[]) => LayoutBlock[]) => {
    setConfig((c: LayoutConfig) => ({ ...c, blocks: normalizeOrders(fn(c.blocks)) }));
  }, []);

  const moveBlock = useCallback(
    (blockId: string, targetZone: string, targetBlockId: string | null = null) => {
      updateBlocks((blocks) => {
        const moving = blocks.find((b) => b.id === blockId);
        if (!moving) return blocks;
        const rest = blocks.filter((b) => b.id !== blockId);
        const relocated = { ...moving, zone: targetZone };
        if (targetBlockId && targetBlockId !== blockId) {
          const targetIndex = rest.findIndex((b) => b.id === targetBlockId);
          rest.splice(targetIndex < 0 ? rest.length : targetIndex, 0, relocated);
          return rest;
        }

        let insertAt = rest.length;
        for (let i = rest.length - 1; i >= 0; i -= 1) {
          if (rest[i].zone === targetZone) {
            insertAt = i + 1;
            break;
          }
        }
        rest.splice(insertAt, 0, relocated);
        return rest;
      });
    },
    [updateBlocks],
  );

  const toggleVisible = useCallback(
    (id: string) => updateBlocks((blocks) => blocks.map((b) => (b.id === id ? { ...b, visible: b.visible === false } : b))),
    [updateBlocks],
  );

  const patchBlockProps = useCallback(
    (id: string, patch: Record<string, unknown>) =>
      updateBlocks((blocks) =>
        blocks.map((b) => (b.id === id ? { ...b, props: { ...b.props, ...patch } } : b)),
      ),
    [updateBlocks],
  );

  const patchBlockField = useCallback(
    (id: string, patch: Record<string, unknown>) => updateBlocks((blocks) => blocks.map((b) => (b.id === id ? { ...b, ...patch } : b))),
    [updateBlocks],
  );

  const removeBlock = useCallback(
    (id: string) => {
      updateBlocks((blocks) => blocks.filter((b) => b.id !== id));
      setSelectedId((prev) => (prev === id ? null : prev));
    },
    [updateBlocks],
  );

  const addBlock = useCallback(
    (type: string) => {
      const id = `${type}-${Date.now()}`;
      updateBlocks((blocks) => [
        ...blocks,
        { id, type, zone: ZONES.TOP, order: 0, visible: true, props: {} },
      ]);
      setSelectedId(id);
    },
    [updateBlocks],
  );

  const patchTheme = useCallback(
    (patch: Record<string, unknown>) => setConfig((c: LayoutConfig) => ({ ...c, theme: { ...c.theme, ...patch } })),
    [],
  );
  const patchQuestionArea = useCallback(
    (patch: Record<string, unknown>) => setConfig((c: LayoutConfig) => ({ ...c, questionArea: { ...c.questionArea, ...patch } })),
    [],
  );

  const resetDefault = useCallback(() => {
    setConfig(defaultLayoutConfig);
    setSelectedId(null);
    setConfirmReset(false);
  }, []);

  const handleSave = useCallback(() => {
    const snapshot = config;
    saveLayout.mutate(
      {examTypeId, config: JSON.stringify(snapshot)},
      {
        onSuccess: () => {
          setSavedConfig(snapshot);
          toast.success(t('saveSuccess'));
        },
        onError: (err: unknown) =>
          toast.error(getApiErrorMessage(err, t('saveFailed'))),
      },
    );
  }, [config, examTypeId, saveLayout, t]);

  const handleBack = () => (dirty ? setConfirmLeave(true) : router.back());

  const handleDropOnZone = (zone: string) => {
    if (dragId) moveBlock(dragId, zone);
    setDragId(null);
    setDropZone(null);
  };
  const handleDropOnBlock = (targetBlock: LayoutBlock) => {
    if (dragId) moveBlock(dragId, targetBlock.zone, targetBlock.id);
    setDragId(null);
    setDropZone(null);
  };

  const blocksByZone = useMemo(() => {
    const map: Record<string, LayoutBlock[]> = {};
    ZONE_META.forEach((z) => {
      map[z.key] = config.blocks
        .filter((b: LayoutBlock) => b.zone === z.key && b.type !== BLOCK_TYPES.QUESTION_AREA)
        .sort((a: LayoutBlock, b: LayoutBlock) => (a.order ?? 0) - (b.order ?? 0));
    });
    return map;
  }, [config.blocks]);

  const selectedBlock = config.blocks.find((b: LayoutBlock) => b.id === selectedId) || null;

  // Phòng thi ẩn khối Tiến độ khi danh sách câu nằm ở cột bên (đầu danh sách đã có "đã làm / tổng").
  const hasSideNav = config.blocks.some(
    (b) =>
      b.visible !== false &&
      b.type === BLOCK_TYPES.QUESTION_NAV &&
      (b.zone === ZONES.LEFT || b.zone === ZONES.RIGHT),
  );
  const isAutoHidden = (b: LayoutBlock) => hasSideNav && b.type === BLOCK_TYPES.PROGRESS;

  // Xem trước chế độ "Từng câu/nhóm một" bằng các bước mẫu, bấm Câu trước/Câu tiếp được như phòng thi thật.
  const previewPaged = (config.questionArea.navigationMode || DEFAULT_NAVIGATION_MODE) === 'paged';
  const previewStepIndex = Math.min(previewStep, sampleFlowSteps.length - 1);

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner /> <span className="ms-2">{t('loading')}</span>
      </div>
    );
  }

  // Thuộc tính mở ngay dưới yếu tố đang chọn trong danh sách vùng, để không phải tìm ở cột khác.
  const propertiesSection = selectedBlock && (
    <div
      ref={propertiesRef}
      className={cx('propertiesCard')}
      onClick={(e) => e.stopPropagation()}
      aria-label={t('propertiesFor', { name: blockLabel(selectedBlock.type) })}
    >
      <div className={cx('field')}>
        <label>{t('zone')}</label>
        <select
          value={selectedBlock.zone}
          onChange={(e) => moveBlock(selectedBlock.id, e.target.value)}
        >
          {ZONE_META.map((z) => (
            <option key={z.key} value={z.key}>
              {zoneLabel(z.key, z.label)}
            </option>
          ))}
        </select>
      </div>

      {selectedBlock.zone !== ZONES.FLOAT && (
        <div className={cx('field')}>
          <label>{t('align')}</label>
          <div className={cx('segmented')} role="radiogroup" aria-label={t('align')}>
            {alignOptionsFor(selectedBlock.zone).map((o) => {
              const active = (selectedBlock.align || alignDefaultFor(selectedBlock.zone)) === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={cx('segment', { active })}
                  onClick={() => patchBlockField(selectedBlock.id, { align: o.value })}
                >
                  {t(`alignOptions.${o.labelKey}`)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedBlock.type === BLOCK_TYPES.SUBMIT && (
        <div className={cx('field')}>
          <label>{t('submitLabel')}</label>
          <input
            value={selectedBlock.props?.label || ''}
            placeholder={t('submitLabelPlaceholder')}
            onChange={(e) => patchBlockProps(selectedBlock.id, { label: e.target.value })}
          />
        </div>
      )}

      {selectedBlock.type === BLOCK_TYPES.QUESTION_NAV && (
        <>
          <div className={cx('field')}>
            <label>{t('navColumns')}</label>
            <input
              type="number"
              min="1"
              max="8"
              value={selectedBlock.props?.navColumns ?? 5}
              onChange={(e) =>
                patchBlockProps(selectedBlock.id, {
                  navColumns: e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
            />
          </div>
          {selectedBlock.zone !== ZONES.LEFT && selectedBlock.zone !== ZONES.RIGHT && (
            <>
              <div className={cx('field')}>
                <label>{t('toggleLabel')}</label>
                <input
                  value={selectedBlock.props?.toggleLabel || ''}
                  placeholder={t('toggleLabelPlaceholder')}
                  onChange={(e) =>
                    patchBlockProps(selectedBlock.id, { toggleLabel: e.target.value })
                  }
                />
              </div>
              <div className={cx('field')}>
                <label>{t('hideLabel')}</label>
                <input
                  value={selectedBlock.props?.hideLabel || ''}
                  placeholder={t('hideLabelPlaceholder')}
                  onChange={(e) =>
                    patchBlockProps(selectedBlock.id, { hideLabel: e.target.value })
                  }
                />
              </div>
            </>
          )}
        </>
      )}

      {selectedBlock.type === BLOCK_TYPES.BANNER && (
        <div className={cx('field')}>
          <label>{t('bannerUrl')}</label>
          <input
            value={selectedBlock.props?.url || ''}
            placeholder={t('bannerUrlPlaceholder')}
            onChange={(e) => patchBlockProps(selectedBlock.id, { url: e.target.value })}
          />
        </div>
      )}

      <div className={cx('field')}>
        <label>{t('spacing')}</label>
        <input
          type="number"
          min="0"
          value={selectedBlock.props?.spacing ?? ''}
          placeholder="0"
          onChange={(e) =>
            patchBlockProps(selectedBlock.id, {
              spacing: e.target.value === '' ? undefined : Number(e.target.value),
            })
          }
        />
      </div>

      <div className={cx('propertyActions')}>
        <button type="button" className={cx('secondaryBtn')} onClick={() => toggleVisible(selectedBlock.id)}>
          {selectedBlock.visible === false ? t('showBlock') : t('hideBlock')}
        </button>
        {ADDABLE_BLOCK_TYPES.includes(selectedBlock.type) && (
          <button type="button" className={cx('dangerBtn')} onClick={() => removeBlock(selectedBlock.id)}>
            {t('removeBlock')}
          </button>
        )}
        <button type="button" className={cx('linkBtn', 'doneBtn')} onClick={() => setSelectedId(null)}>
          {t('done')}
        </button>
      </div>
    </div>
  );

  return (
    <div className={cx('editor')}>
      <div className={cx('header')}>
        <div className={cx('headerLeft')}>
          <button type="button" className={cx('backBtn')} onClick={handleBack}>
            <ArrowLeft size={16} aria-hidden /> {t('back')}
          </button>
          <div>
            <h2>{t('title')}</h2>
            <div className={cx('subtitle')}>
              {t.rich('subtitle', {
                name: examTypeName || examTypeId,
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </div>
          </div>
        </div>
        <div className={cx('headerActions')}>
          <span className={cx('saveState', { dirty })} aria-live="polite">
            {dirty ? t('unsaved') : t('saved')}
          </span>
          <button type="button" className={cx('secondaryBtn')} onClick={() => setConfirmReset(true)}>
            {t('resetDefault')}
          </button>
          <button
            type="button"
            className={cx('primaryBtn')}
            onClick={handleSave}
            disabled={saving || !dirty}
          >
            {saving && <Spinner size="sm" />} {t('save')}
          </button>
        </div>
      </div>

      <div className={cx('workspace')}>

        <div className={cx('panel')}>
          <div className={cx('section')}>
            <h3>{t('zonesSection')}</h3>
            <div className={cx('hint')}>{t('zonesHint')}</div>
            {ZONE_META.map((zone) => (
              <div
                key={zone.key}
                className={cx('zoneGroup', { dropActive: dropZone === zone.key })}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDropZone(zone.key);
                }}
                onDragLeave={() => setDropZone((z) => (z === zone.key ? null : z))}
                onDrop={() => handleDropOnZone(zone.key)}
              >
                <div className={cx('zoneHead')}>
                  <ZoneGlyph zone={zone.key} />
                  <span className={cx('zoneTitle')}>{zoneLabel(zone.key, zone.label)}</span>
                </div>
                {blocksByZone[zone.key].length === 0 && (
                  <span className={cx('zoneEmpty')}>{t('zoneEmpty')}</span>
                )}
                {blocksByZone[zone.key].map((block) => {
                  const align = alignLabel(block);
                  return (
                    <Fragment key={block.id}>
                    <div
                      className={cx('blockItem', {
                        selected: selectedId === block.id,
                        hidden: block.visible === false || isAutoHidden(block),
                      })}
                      title={isAutoHidden(block) ? t('progressAutoHidden') : undefined}
                      draggable
                      onDragStart={() => setDragId(block.id)}
                      onDragEnd={() => setDragId(null)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.stopPropagation();
                        handleDropOnBlock(block);
                      }}
                      onClick={() => setSelectedId(block.id)}
                    >
                      <span className={cx('grip')}>
                        <GripVertical size={16} />
                      </span>
                      <span className={cx('blockLabel')}>
                        {blockLabel(block.type)}
                        {isAutoHidden(block) ? (
                          <span className={cx('blockMeta')}>{t('progressAutoHiddenShort')}</span>
                        ) : (
                          align && <span className={cx('blockMeta')}>{align}</span>
                        )}
                      </span>
                      <button
                        type="button"
                        className={cx('iconBtn')}
                        title={block.visible === false ? t('show') : t('hide')}
                        aria-label={block.visible === false ? t('show') : t('hide')}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleVisible(block.id);
                        }}
                      >
                        {block.visible === false ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      {ADDABLE_BLOCK_TYPES.includes(block.type) && (
                        <button
                          type="button"
                          className={cx('iconBtn')}
                          title={t('remove')}
                          aria-label={t('remove')}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeBlock(block.id);
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    {selectedId === block.id && propertiesSection}
                    </Fragment>
                  );
                })}
              </div>
            ))}
          </div>

          <div className={cx('section')}>
            <h3>{t('addSection')}</h3>
            <div className={cx('paletteRow')}>
              {ADDABLE_BLOCK_TYPES.map((type) => (
                <button key={type} type="button" className={cx('paletteBtn')} onClick={() => addBlock(type)}>
                  + {blockLabel(type)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={cx('previewWrap')}>
          <div className={cx('previewBar')}>
            <span>{t('preview', { width: PREVIEW_WIDTH })}</span>
            <span>{t('previewHint')}</span>
          </div>
          <div className={cx('previewCanvas')} onClick={() => setSelectedId(null)}>
            <ScaledPreview width={PREVIEW_WIDTH} height={PREVIEW_HEIGHT}>
              <ExamLayoutRenderer
                config={config}
                isPractice={false}
                title={examTypeName || undefined}
                onExit={() => {}}
                visibleParts={sampleExamData.visibleParts}
                questionIndexMap={sampleQuestionIndexMap}
                userAnswers={{}}
                handleAnswerChange={() => {}}
                allQuestions={sampleAllQuestions}
                timeLeft={2700}
                formatTime={formatTime}
                isSubmitting={false}
                handleSubmit={() => {}}
                preview
                interactive
                selectedId={selectedId}
                onSelectBlock={setSelectedId}
                isPaged={previewPaged}
                flowSteps={sampleFlowSteps}
                currentStepIndex={previewStepIndex}
                canGoPrev={previewStepIndex > 0}
                goNext={() => setPreviewStep((i) => Math.min(i + 1, sampleFlowSteps.length - 1))}
                goPrev={() => setPreviewStep((i) => Math.max(i - 1, 0))}
                goToQuestion={(questionId) => {
                  const idx = sampleFlowSteps.findIndex((s) =>
                    s.questions.some((q) => q.questionId === questionId),
                  );
                  if (idx >= 0) setPreviewStep(idx);
                }}
                canNavigateToQuestion={() => true}
              />
            </ScaledPreview>
          </div>
        </div>

        <div className={cx('panel')}>
          <div className={cx('section')}>
            <h3>{t('questionAreaSection')}</h3>
            <div className={cx('field')}>
              <label>{t('navigationMode')}</label>
              <select
                value={config.questionArea.navigationMode || DEFAULT_NAVIGATION_MODE}
                onChange={(e) => patchQuestionArea({ navigationMode: e.target.value })}
              >
                <option value="paged">{t('navigationModes.paged')}</option>
                <option value="scroll">{t('navigationModes.scroll')}</option>
              </select>
              <span className={cx('fieldHint')}>
                {(config.questionArea.navigationMode || DEFAULT_NAVIGATION_MODE) === 'paged'
                  ? t('navigationModeHints.paged')
                  : t('navigationModeHints.scroll')}
              </span>
            </div>
            <div className={cx('field')}>
              <label>{t('passagePosition')}</label>
              <select
                value={config.questionArea.passagePosition || 'side'}
                onChange={(e) => patchQuestionArea({ passagePosition: e.target.value })}
              >
                <option value="side">{t('passagePositions.side')}</option>
                <option value="stacked">{t('passagePositions.stacked')}</option>
              </select>
            </div>
            <div className={cx('field')}>
              <label>{t('maxWidth')}</label>
              <input
                type="number"
                min="480"
                step="10"
                value={config.questionArea.maxWidth ?? ''}
                placeholder={t('maxWidthPlaceholder')}
                onChange={(e) =>
                  patchQuestionArea({ maxWidth: e.target.value === '' ? null : Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div className={cx('section')}>
            <h3>{t('themeSection')}</h3>
            <div className={cx('field')}>
              <label>{t('primaryColor')}</label>
              <div className={cx('colorRow')}>
                <input
                  type="color"
                  value={config.theme.primary || brandColors.primary}
                  onChange={(e) => patchTheme({ primary: e.target.value })}
                />
                <span className={cx('colorValue')}>
                  {config.theme.primary || t('defaultValue')}
                </span>
                {config.theme.primary && (
                  <button type="button" className={cx('linkBtn')} onClick={() => patchTheme({ primary: null })}>
                    {t('useDefault')}
                  </button>
                )}
              </div>
            </div>
            <div className={cx('field')}>
              <label>{t('font')}</label>
              <select
                value={config.theme.font || ''}
                onChange={(e) => patchTheme({ font: e.target.value || null })}
              >
                <option value="">{t('fontDefault')}</option>
                {FONT_OPTIONS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div className={cx('field')}>
              <label>{t('radius')}</label>
              <input
                type="number"
                min="0"
                value={config.theme.radius ?? ''}
                placeholder={t('defaultValue')}
                onChange={(e) =>
                  patchTheme({ radius: e.target.value === '' ? null : Number(e.target.value) })
                }
              />
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        show={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={resetDefault}
        title={t('resetConfirm.title')}
        message={t('resetConfirm.message')}
        confirmText={t('resetConfirm.confirm')}
        cancelText={t('resetConfirm.cancel')}
      />
      <ConfirmModal
        show={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        onConfirm={() => router.back()}
        title={t('leaveConfirm.title')}
        message={t('leaveConfirm.message')}
        confirmText={t('leaveConfirm.confirm')}
        cancelText={t('leaveConfirm.cancel')}
      />
    </div>
  );
}

export default ExamTypeLayoutEditor;
