'use client';

import { useParams } from 'next/navigation';
import { useRouter } from '@/app/i18n/navigation';
import { useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'react-toastify';
import { Spinner } from 'react-bootstrap';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from 'lucide-react';
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
} from '@/app/features/exam-layout/layoutSchema';
import type { LayoutBlock, LayoutConfig } from '@/app/features/exam-layout/layoutSchema';
import ExamLayoutRenderer from '@/app/features/exam-layout/ExamLayoutRenderer';
import { buildSampleExam } from '@/app/[locale]/(admin)/admin/exam-types/[examTypeId]/layout/_lib/sampleExamData';
import styles from './ExamTypeLayoutEditor.module.scss';
import { brandColors } from '@/app/assets/styles/brandColors';
import { getApiErrorMessage } from '@/app/utils/apiError';

const cx = classNames.bind(styles);

const FONT_OPTIONS = ['Inter', 'Roboto', 'Arial', 'Times New Roman', 'Georgia'];

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

  const { sampleExamData, sampleAllQuestions, sampleQuestionIndexMap } = useMemo(
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropZone, setDropZone] = useState<string | null>(null);

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
      setConfig(resolveLayoutConfig(layout));
    }
  }

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
  }, []);

  const handleSave = useCallback(() => {
    saveLayout.mutate(
      {examTypeId, config: JSON.stringify(config)},
      {
        onSuccess: () => toast.success(t('saveSuccess')),
        onError: (err: unknown) =>
          toast.error(getApiErrorMessage(err, t('saveFailed'))),
      },
    );
  }, [config, examTypeId, saveLayout, t]);

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

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner /> <span className="ms-2">{t('loading')}</span>
      </div>
    );
  }

  return (
    <div className={cx('editor')}>
      <div className={cx('header')}>
        <div className={cx('headerLeft')}>
          <button className={cx('backBtn')} onClick={() => router.back()}>
            <ArrowLeft size={16} /> {t('back')}
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
          <button className={cx('dangerBtn')} onClick={resetDefault}>
            <RotateCcw size={16} /> {t('resetDefault')}
          </button>
          <button className="btn btn-primary d-inline-flex align-items-center gap-2" onClick={handleSave} disabled={saving}>
            {saving ? <Spinner size="sm" /> : <Save size={16} />} {t('save')}
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
                <span className={cx('zoneTitle')}>{zoneLabel(zone.key, zone.label)}</span>
                {blocksByZone[zone.key].length === 0 && (
                  <span className={cx('zoneEmpty')}>{t('zoneEmpty')}</span>
                )}
                {blocksByZone[zone.key].map((block) => {
                  const addable = ADDABLE_BLOCK_TYPES.includes(block.type);
                  return (
                    <div
                      key={block.id}
                      className={cx('blockItem', {
                        selected: selectedId === block.id,
                        hidden: block.visible === false,
                      })}
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
                      </span>
                      <button
                        type="button"
                        className={cx('iconBtn')}
                        title={block.visible === false ? t('show') : t('hide')}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleVisible(block.id);
                        }}
                      >
                        {block.visible === false ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      {addable && (
                        <button
                          type="button"
                          className={cx('iconBtn')}
                          title={t('remove')}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeBlock(block.id);
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className={cx('section')}>
            <h3>{t('addSection')}</h3>
            <div className={cx('paletteRow')}>
              {ADDABLE_BLOCK_TYPES.map((type) => {
                return (
                  <button key={type} className={cx('paletteBtn')} onClick={() => addBlock(type)}>
                    <Plus size={14} /> {blockLabel(type)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className={cx('previewWrap')}>
          <div className={cx('previewBar')}>
            <span>{t('preview')}</span>
            <span>{t('previewHint')}</span>
          </div>
          <div className={cx('previewCanvas')} onClick={() => setSelectedId(null)}>
            <ExamLayoutRenderer
              config={config}
              isPractice={false}
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
            />
          </div>
        </div>

        <div className={cx('panel')}>
          <div className={cx('section')}>
            <h3>{t('themeSection')}</h3>
            <div className={cx('field')}>
              <label>{t('primaryColor')}</label>
              <input
                type="color"
                value={config.theme.primary || brandColors.primary}
                onChange={(e) => patchTheme({ primary: e.target.value })}
              />
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
                onChange={(e) =>
                  patchTheme({ radius: e.target.value === '' ? null : Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div className={cx('section')}>
            <h3>{t('questionAreaSection')}</h3>
            <div className={cx('field')}>
              <label>{t('navigationMode')}</label>
              <select
                value={config.questionArea.navigationMode || 'scroll'}
                onChange={(e) => patchQuestionArea({ navigationMode: e.target.value })}
              >
                <option value="scroll">{t('navigationModes.scroll')}</option>
                <option value="paged">{t('navigationModes.paged')}</option>
              </select>
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
          </div>

          <div className={cx('section')}>
            <h3>{t('propertiesSection')}</h3>
            {!selectedBlock && (
              <div className={cx('emptyRight')}>{t('propertiesEmpty')}</div>
            )}
            {selectedBlock && (
              <>
                <div className={cx('field')}>
                  <label>{t('blockType')}</label>
                  <div>
                    {blockLabel(selectedBlock.type)}
                  </div>
                </div>
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
                    <select
                      value={selectedBlock.align || alignDefaultFor(selectedBlock.zone)}
                      onChange={(e) => patchBlockField(selectedBlock.id, { align: e.target.value })}
                    >
                      {alignOptionsFor(selectedBlock.zone).map((o) => (
                        <option key={o.value} value={o.value}>
                          {t(`alignOptions.${o.labelKey}`)}
                        </option>
                      ))}
                    </select>
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
                    <div className={cx('field')}>
                      <label>{t('navColumns')}</label>
                      <input
                        type="number"
                        min="1"
                        max="8"
                        value={selectedBlock.props?.navColumns ?? 4}
                        onChange={(e) =>
                          patchBlockProps(selectedBlock.id, {
                            navColumns: e.target.value === '' ? undefined : Number(e.target.value),
                          })
                        }
                      />
                    </div>
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
                  <label>{t('visibility')}</label>
                  <button
                    type="button"
                    className={cx('paletteBtn')}
                    onClick={() => toggleVisible(selectedBlock.id)}
                  >
                    {selectedBlock.visible === false ? <EyeOff size={14} /> : <Eye size={14} />}
                    {selectedBlock.visible === false ? t('hidden') : t('visible')}
                  </button>
                </div>

                {ADDABLE_BLOCK_TYPES.includes(selectedBlock.type) && (
                  <button className={cx('dangerBtn')} onClick={() => removeBlock(selectedBlock.id)}>
                    <Trash2 size={14} /> {t('removeBlock')}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExamTypeLayoutEditor;
