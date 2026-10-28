'use client';

import { useParams } from 'next/navigation';
import { useRouter } from '@/app/i18n/navigation';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'react-toastify';
import { Spinner } from 'react-bootstrap';
import { ArrowLeft, ArrowLeftRight, Eye, EyeOff, GripVertical, Trash2 } from 'lucide-react';
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
import ButtonPrime from '@/app/components/Button/ButtonPrime';
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

// Vị trí các vùng trên màn hình xem trước (toạ độ theo PREVIEW_WIDTH × PREVIEW_HEIGHT), dùng làm chỗ thả
// khi kéo yếu tố từ cột trái sang. Khớp với khung phòng thi: thanh đầu 56px, cột bên 320px.
const DROP_AREAS: Array<{ zone: string; left: number; top: number; width: number; height: number }> = [
  { zone: ZONES.TOP, left: 0, top: 0, width: PREVIEW_WIDTH, height: 56 },
  { zone: ZONES.LEFT, left: 0, top: 56, width: 320, height: PREVIEW_HEIGHT - 56 },
  { zone: ZONES.RIGHT, left: PREVIEW_WIDTH - 320, top: 56, width: 320, height: PREVIEW_HEIGHT - 56 },
  { zone: ZONES.TOOLBAR, left: 320, top: 56, width: PREVIEW_WIDTH - 640, height: 64 },
  { zone: ZONES.BOTTOM, left: 320, top: PREVIEW_HEIGHT - 72, width: PREVIEW_WIDTH - 640, height: 72 },
  { zone: ZONES.FLOAT, left: PREVIEW_WIDTH - 600, top: PREVIEW_HEIGHT - 232, width: 260, height: 140 },
];

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
  // Yếu tố đang mở menu "Chuyển vùng".
  const [moveMenuId, setMoveMenuId] = useState<string | null>(null);
  // Sau khi đổi chỗ bằng bàn phím/menu, đưa focus về lại yếu tố vừa di chuyển (nó được dựng lại ở vị trí mới).
  const pendingFocusRef = useRef<string | null>(null);
  const propertiesRef = useRef<HTMLDivElement | null>(null);
  const zonesPanelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const id = pendingFocusRef.current;
    if (!id) return;
    pendingFocusRef.current = null;
    zonesPanelRef.current?.querySelector<HTMLElement>(`[data-block-id="${id}"]`)?.focus();
  });

  // Menu chuyển vùng đóng khi bấm ra ngoài hoặc nhấn Esc.
  useEffect(() => {
    if (!moveMenuId) return;
    const close = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-move-menu]')) setMoveMenuId(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoveMenuId(null);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [moveMenuId]);

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
        // Căn lề của vùng ngang (trái/giữa/phải) và cột bên (trên/giữa/dưới) khác nhau: sang vùng mới mà giá trị
        // cũ không hợp thì về mặc định của vùng đó.
        const alignFits = alignOptionsFor(targetZone).some((o) => o.value === moving.align);
        const relocated = {
          ...moving,
          zone: targetZone,
          align: alignFits ? moving.align : alignDefaultFor(targetZone),
        };
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

  // Đổi chỗ yếu tố với yếu tố liền trên/dưới trong cùng vùng (dir = -1 lên, 1 xuống).
  const moveWithinZone = useCallback(
    (blockId: string, dir: -1 | 1) => {
      updateBlocks((blocks) => {
        const moving = blocks.find((b) => b.id === blockId);
        if (!moving) return blocks;
        const zoneBlocks = blocks
          .filter((b) => b.zone === moving.zone)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        const i = zoneBlocks.findIndex((b) => b.id === blockId);
        const j = i + dir;
        if (j < 0 || j >= zoneBlocks.length) return blocks;
        [zoneBlocks[i], zoneBlocks[j]] = [zoneBlocks[j], zoneBlocks[i]];
        let k = 0;
        return blocks.map((b) => (b.zone === moving.zone ? zoneBlocks[k++] : b));
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

  const moveToZone = (blockId: string, zone: string) => {
    moveBlock(blockId, zone);
    setMoveMenuId(null);
    setSelectedId(blockId);
    pendingFocusRef.current = blockId;
  };

  // Bàn phím trên một yếu tố: ↑/↓ chuyển giữa các yếu tố, Alt+↑/↓ đổi thứ tự trong vùng,
  // Alt+←/→ chuyển sang vùng trước/sau, Enter mở/đóng phần chỉnh.
  const handleItemKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, block: LayoutBlock) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setSelectedId((id) => (id === block.id ? null : block.id));
    } else if (e.key === 'Escape') {
      setSelectedId(null);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const dir = e.key === 'ArrowUp' ? -1 : 1;
      if (e.altKey) {
        moveWithinZone(block.id, dir);
        pendingFocusRef.current = block.id;
        return;
      }
      const items = Array.from(
        zonesPanelRef.current?.querySelectorAll<HTMLElement>('[data-block-id]') ?? [],
      );
      items[items.indexOf(e.currentTarget) + dir]?.focus();
    } else if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      e.preventDefault();
      const zoneKeys = ZONE_META.map((z) => z.key);
      const target = zoneKeys[zoneKeys.indexOf(block.zone) + (e.key === 'ArrowLeft' ? -1 : 1)];
      if (target) moveToZone(block.id, target);
    }
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
        <ButtonPrime variant="outline" size="sm" onClick={() => toggleVisible(selectedBlock.id)}>
          {selectedBlock.visible === false ? t('showBlock') : t('hideBlock')}
        </ButtonPrime>
        {ADDABLE_BLOCK_TYPES.includes(selectedBlock.type) && (
          <ButtonPrime variant="dangerGhost" size="sm" onClick={() => removeBlock(selectedBlock.id)}>
            {t('removeBlock')}
          </ButtonPrime>
        )}
        <ButtonPrime variant="ghost" size="sm" className={cx('doneBtn')} onClick={() => setSelectedId(null)}>
          {t('done')}
        </ButtonPrime>
      </div>
    </div>
  );

  return (
    <div className={cx('editor')}>
      <div className={cx('header')}>
        <div className={cx('headerLeft')}>
          <ButtonPrime variant="outline" size="sm" className={cx('backBtn')} onClick={handleBack}>
            <ArrowLeft size={16} aria-hidden /> {t('back')}
          </ButtonPrime>
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
          <ButtonPrime variant="outline" size="sm" onClick={() => setConfirmReset(true)}>
            {t('resetDefault')}
          </ButtonPrime>
          <ButtonPrime size="sm" onClick={handleSave} loading={saving} disabled={!dirty}>
            {t('save')}
          </ButtonPrime>
        </div>
      </div>

      <div className={cx('workspace')}>

        <div className={cx('panel')} ref={zonesPanelRef}>
          <div className={cx('section')}>
            <h3>{t('zonesSection')}</h3>
            <div className={cx('hint')}>{t('zonesHint')}</div>
            <div className={cx('hint', 'keyboardHint')}>{t('keyboardHint')}</div>
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
                      data-block-id={block.id}
                      role="button"
                      tabIndex={0}
                      aria-expanded={selectedId === block.id}
                      aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown Alt+ArrowLeft Alt+ArrowRight"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', block.id);
                        setDragId(block.id);
                        setMoveMenuId(null);
                      }}
                      onDragEnd={() => {
                        setDragId(null);
                        setDropZone(null);
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.stopPropagation();
                        handleDropOnBlock(block);
                      }}
                      onClick={() => setSelectedId(block.id)}
                      onKeyDown={(e) => handleItemKeyDown(e, block)}
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
                      <span className={cx('moveMenuWrap')} data-move-menu>
                        <ButtonPrime
                          size="icon"
                          variant="ghost"
                          title={t('moveToZone')}
                          aria-label={t('moveToZone')}
                          aria-haspopup="menu"
                          aria-expanded={moveMenuId === block.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setMoveMenuId((id) => (id === block.id ? null : block.id));
                          }}
                        >
                          <ArrowLeftRight size={16} />
                        </ButtonPrime>
                        {moveMenuId === block.id && (
                          <div className={cx('moveMenu')} role="menu" onClick={(e) => e.stopPropagation()}>
                            <div className={cx('moveMenuTitle')}>{t('moveToZone')}</div>
                            {ZONE_META.filter((z) => z.key !== block.zone).map((z) => (
                              <button
                                key={z.key}
                                type="button"
                                role="menuitem"
                                className={cx('moveMenuItem')}
                                onClick={() => moveToZone(block.id, z.key)}
                              >
                                <ZoneGlyph zone={z.key} />
                                {zoneLabel(z.key, z.label)}
                              </button>
                            ))}
                          </div>
                        )}
                      </span>
                      <ButtonPrime
                        size="icon"
                        variant="ghost"
                        title={block.visible === false ? t('show') : t('hide')}
                        aria-label={block.visible === false ? t('show') : t('hide')}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleVisible(block.id);
                        }}
                      >
                        {block.visible === false ? <EyeOff size={16} /> : <Eye size={16} />}
                      </ButtonPrime>
                      {ADDABLE_BLOCK_TYPES.includes(block.type) && (
                        <ButtonPrime
                          size="icon"
                          variant="dangerGhost"
                          title={t('remove')}
                          aria-label={t('remove')}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeBlock(block.id);
                          }}
                        >
                          <Trash2 size={16} />
                        </ButtonPrime>
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
                <ButtonPrime key={type} variant="soft" size="sm" onClick={() => addBlock(type)}>
                  + {blockLabel(type)}
                </ButtonPrime>
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
              {/* Đang kéo một yếu tố từ cột trái: các vùng trên khung xem trước thành chỗ thả. */}
              {dragId && (
                <div className={cx('dropOverlay')}>
                  {DROP_AREAS.map((area) => (
                    <div
                      key={area.zone}
                      className={cx('dropArea', { active: dropZone === area.zone })}
                      style={{ left: area.left, top: area.top, width: area.width, height: area.height }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        setDropZone(area.zone);
                      }}
                      onDragLeave={() => setDropZone((z) => (z === area.zone ? null : z))}
                      onDrop={(e) => {
                        e.preventDefault();
                        const movedId = dragId;
                        handleDropOnZone(area.zone);
                        // Mở phần chỉnh của yếu tố vừa thả để thấy ngay nó đã sang vùng nào.
                        setSelectedId(movedId);
                      }}
                    >
                      <span>{zoneLabel(area.zone, area.zone)}</span>
                    </div>
                  ))}
                </div>
              )}
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
                  <ButtonPrime variant="link" onClick={() => patchTheme({ primary: null })}>
                    {t('useDefault')}
                  </ButtonPrime>
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
