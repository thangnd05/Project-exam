'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
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

import {useExamTypeById, useOwnExamTypeLayout, useUpdateExamTypeLayout} from '~/features/admin/exam-content/hooks/useExamTypes';
import { resolveLayoutConfig } from '~/features/tests/exam/exam-types/detail/testStart/examLayout/resolveLayoutConfig';
import {
  defaultLayoutConfig,
  BLOCK_META,
  ZONE_META,
  ZONES,
  BLOCK_TYPES,
  ADDABLE_BLOCK_TYPES,
} from '~/features/tests/exam/exam-types/detail/testStart/examLayout/layoutSchema';
import ExamLayoutRenderer from '~/features/tests/exam/exam-types/detail/testStart/examLayout/ExamLayoutRenderer';
import {
  sampleExamData,
  sampleAllQuestions,
  sampleQuestionIndexMap,
} from '~/features/tests/exam/exam-types/detail/testStart/examLayout/sampleExamData';
import styles from './ExamTypeLayoutEditorPage.module.scss';
import { brandColors } from '~/shared/styles/brandColors';

const cx = classNames.bind(styles);

const FONT_OPTIONS = ['Inter', 'Roboto', 'Arial', 'Times New Roman', 'Georgia'];

const formatTime = (seconds) => {
  if (seconds === null || seconds === undefined) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

function alignOptionsFor(zone) {
  if (zone === ZONES.LEFT || zone === ZONES.RIGHT) {
    return [
      { value: 'start', label: 'Trên' },
      { value: 'center', label: 'Giữa' },
      { value: 'end', label: 'Dưới' },
    ];
  }
  return [
    { value: 'left', label: 'Trái' },
    { value: 'center', label: 'Giữa' },
    { value: 'right', label: 'Phải' },
  ];
}
function alignDefaultFor(zone) {
  if (zone === ZONES.LEFT || zone === ZONES.RIGHT) return 'start';
  if (zone === ZONES.BOTTOM) return 'right';
  return 'left';
}

function normalizeOrders(blocks) {
  const counters = {};
  return blocks.map((b) => {
    counters[b.zone] = (counters[b.zone] || 0) + 1;
    return { ...b, order: counters[b.zone] };
  });
}

function ExamTypeLayoutEditorPage() {
  const { examTypeId } = useParams();
  const router = useRouter();

  const [config, setConfig] = useState(defaultLayoutConfig);
  const [selectedId, setSelectedId] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [dropZone, setDropZone] = useState(null);

  const saveLayout = useUpdateExamTypeLayout();
  const saving = saveLayout.isPending;

  const { examType } = useExamTypeById(examTypeId);
  const examTypeName = examType?.name || '';

  const { layout, isLoading: loading } = useOwnExamTypeLayout(examTypeId);

  useEffect(() => {
    if (layout !== undefined) {
      setConfig(resolveLayoutConfig(layout));
    }
  }, [layout]);

  const updateBlocks = useCallback((fn) => {
    setConfig((c) => ({ ...c, blocks: normalizeOrders(fn(c.blocks)) }));
  }, []);

  const moveBlock = useCallback(
    (blockId, targetZone, targetBlockId = null) => {
      updateBlocks((blocks) => {
        const moving = blocks.find((b) => b.id === blockId);
        if (!moving) return blocks;
        const rest = blocks.filter((b) => b.id !== blockId);
        const relocated = { ...moving, zone: targetZone };
        if (targetBlockId && targetBlockId !== blockId) {
          const t = rest.findIndex((b) => b.id === targetBlockId);
          rest.splice(t < 0 ? rest.length : t, 0, relocated);
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
    (id) => updateBlocks((blocks) => blocks.map((b) => (b.id === id ? { ...b, visible: b.visible === false } : b))),
    [updateBlocks],
  );

  const patchBlockProps = useCallback(
    (id, patch) =>
      updateBlocks((blocks) =>
        blocks.map((b) => (b.id === id ? { ...b, props: { ...b.props, ...patch } } : b)),
      ),
    [updateBlocks],
  );

  const patchBlockField = useCallback(
    (id, patch) => updateBlocks((blocks) => blocks.map((b) => (b.id === id ? { ...b, ...patch } : b))),
    [updateBlocks],
  );

  const removeBlock = useCallback(
    (id) => {
      updateBlocks((blocks) => blocks.filter((b) => b.id !== id));
      setSelectedId((prev) => (prev === id ? null : prev));
    },
    [updateBlocks],
  );

  const addBlock = useCallback(
    (type) => {
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
    (patch) => setConfig((c) => ({ ...c, theme: { ...c.theme, ...patch } })),
    [],
  );
  const patchQuestionArea = useCallback(
    (patch) => setConfig((c) => ({ ...c, questionArea: { ...c.questionArea, ...patch } })),
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
        onSuccess: () => toast.success('Đã lưu giao diện làm bài cho loại đề này.'),
        onError: (err) =>
          toast.error(err?.response?.data?.message || 'Lưu thất bại. Vui lòng thử lại.'),
      },
    );
  }, [config, examTypeId, saveLayout]);

  const handleDropOnZone = (zone) => {
    if (dragId) moveBlock(dragId, zone);
    setDragId(null);
    setDropZone(null);
  };
  const handleDropOnBlock = (targetBlock) => {
    if (dragId) moveBlock(dragId, targetBlock.zone, targetBlock.id);
    setDragId(null);
    setDropZone(null);
  };

  const blocksByZone = useMemo(() => {
    const map = {};
    ZONE_META.forEach((z) => {
      map[z.key] = config.blocks
        .filter((b) => b.zone === z.key && b.type !== BLOCK_TYPES.QUESTION_AREA)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    });
    return map;
  }, [config.blocks]);

  const selectedBlock = config.blocks.find((b) => b.id === selectedId) || null;

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner /> <span className="ms-2">Đang tải giao diện...</span>
      </div>
    );
  }

  return (
    <div className={cx('editor')}>
      <div className={cx('header')}>
        <div className={cx('headerLeft')}>
          <button className={cx('backBtn')} onClick={() => router.back()}>
            <ArrowLeft size={16} /> Quay lại
          </button>
          <div>
            <h2>Giao diện làm bài</h2>
            <div className={cx('subtitle')}>
              Loại đề: <strong>{examTypeName || examTypeId}</strong>  kéo các yếu tố vào vùng
              bất kỳ.
            </div>
          </div>
        </div>
        <div className={cx('headerActions')}>
          <button className={cx('dangerBtn')} onClick={resetDefault}>
            <RotateCcw size={16} /> Về mặc định
          </button>
          <button className="btn btn-primary d-inline-flex align-items-center gap-2" onClick={handleSave} disabled={saving}>
            {saving ? <Spinner size="sm" /> : <Save size={16} />} Lưu
          </button>
        </div>
      </div>

      <div className={cx('workspace')}>

        <div className={cx('panel')}>
          <div className={cx('section')}>
            <h3>Bố cục theo vùng</h3>
            <div className={cx('hint')}>Kéo một yếu tố rồi thả vào vùng khác để đổi vị trí.</div>
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
                <span className={cx('zoneTitle')}>{zone.label}</span>
                {blocksByZone[zone.key].length === 0 && (
                  <span className={cx('zoneEmpty')}>— thả yếu tố vào đây </span>
                )}
                {blocksByZone[zone.key].map((block) => {
                  const meta = BLOCK_META[block.type] || { label: block.type };
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
                        {meta.label}
                      </span>
                      <button
                        type="button"
                        className={cx('iconBtn')}
                        title={block.visible === false ? 'Hiện' : 'Ẩn'}
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
                          title="Xoá"
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
            <h3>Thêm yếu tố</h3>
            <div className={cx('paletteRow')}>
              {ADDABLE_BLOCK_TYPES.map((type) => {
                const meta = BLOCK_META[type];
                return (
                  <button key={type} className={cx('paletteBtn')} onClick={() => addBlock(type)}>
                    <Plus size={14} /> {meta.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className={cx('previewWrap')}>
          <div className={cx('previewBar')}>
            <span>Xem trước (dữ liệu mẫu)</span>
            <span>Nhấp vào yếu tố để chỉnh</span>
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
            <h3>Chủ đề (theme)</h3>
            <div className={cx('field')}>
              <label>Màu chủ đạo</label>
              <input
                type="color"
                value={config.theme.primary || brandColors.primary}
                onChange={(e) => patchTheme({ primary: e.target.value })}
              />
            </div>
            <div className={cx('field')}>
              <label>Font chữ</label>
              <select
                value={config.theme.font || ''}
                onChange={(e) => patchTheme({ font: e.target.value || null })}
              >
                <option value="">Mặc định</option>
                {FONT_OPTIONS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div className={cx('field')}>
              <label>Bo góc (px)</label>
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
            <h3>Khối câu hỏi</h3>
            <div className={cx('field')}>
              <label>Kiểu làm bài</label>
              <select
                value={config.questionArea.navigationMode || 'scroll'}
                onChange={(e) => patchQuestionArea({ navigationMode: e.target.value })}
              >
                <option value="scroll">Cuộn tất cả (mặc định)</option>
                <option value="paged">Từng câu/nhóm  kiểu TOEIC (nghe tự chuyển, đọc bấm)</option>
              </select>
            </div>
            <div className={cx('field')}>
              <label>Vị trí đoạn văn</label>
              <select
                value={config.questionArea.passagePosition || 'side'}
                onChange={(e) => patchQuestionArea({ passagePosition: e.target.value })}
              >
                <option value="side">Bên cạnh câu hỏi (2 cột)</option>
                <option value="stacked">Trên câu hỏi (xếp dọc)</option>
              </select>
            </div>
          </div>

          <div className={cx('section')}>
            <h3>Thuộc tính yếu tố</h3>
            {!selectedBlock && (
              <div className={cx('emptyRight')}>Chọn một yếu tố ở cột trái hoặc trong preview.</div>
            )}
            {selectedBlock && (
              <>
                <div className={cx('field')}>
                  <label>Loại</label>
                  <div>
                    {BLOCK_META[selectedBlock.type]?.label}
                  </div>
                </div>
                <div className={cx('field')}>
                  <label>Vùng</label>
                  <select
                    value={selectedBlock.zone}
                    onChange={(e) => moveBlock(selectedBlock.id, e.target.value)}
                  >
                    {ZONE_META.map((z) => (
                      <option key={z.key} value={z.key}>
                        {z.label}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedBlock.zone !== ZONES.FLOAT && (
                  <div className={cx('field')}>
                    <label>Canh vị trí</label>
                    <select
                      value={selectedBlock.align || alignDefaultFor(selectedBlock.zone)}
                      onChange={(e) => patchBlockField(selectedBlock.id, { align: e.target.value })}
                    >
                      {alignOptionsFor(selectedBlock.zone).map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className={cx('field')}>
                  <label>Khoảng cách quanh (px)</label>
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
                    <label>Nhãn nút</label>
                    <input
                      value={selectedBlock.props?.label || ''}
                      placeholder="Nộp bài thi"
                      onChange={(e) => patchBlockProps(selectedBlock.id, { label: e.target.value })}
                    />
                  </div>
                )}

                {selectedBlock.type === BLOCK_TYPES.QUESTION_NAV && (
                  <>
                    <div className={cx('field')}>
                      <label>Nhãn nút mở</label>
                      <input
                        value={selectedBlock.props?.toggleLabel || ''}
                        placeholder="Câu hỏi"
                        onChange={(e) =>
                          patchBlockProps(selectedBlock.id, { toggleLabel: e.target.value })
                        }
                      />
                    </div>
                    <div className={cx('field')}>
                      <label>Nhãn nút ẩn</label>
                      <input
                        value={selectedBlock.props?.hideLabel || ''}
                        placeholder="Ẩn"
                        onChange={(e) =>
                          patchBlockProps(selectedBlock.id, { hideLabel: e.target.value })
                        }
                      />
                    </div>
                    <div className={cx('field')}>
                      <label>Số cột (khi ở cột bên / trên / nổi)</label>
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
                    <label>URL ảnh banner</label>
                    <input
                      value={selectedBlock.props?.url || ''}
                      placeholder="https://... hoặc /uploads/..."
                      onChange={(e) => patchBlockProps(selectedBlock.id, { url: e.target.value })}
                    />
                  </div>
                )}

                <div className={cx('field')}>
                  <label>Hiển thị</label>
                  <button
                    type="button"
                    className={cx('paletteBtn')}
                    onClick={() => toggleVisible(selectedBlock.id)}
                  >
                    {selectedBlock.visible === false ? <EyeOff size={14} /> : <Eye size={14} />}
                    {selectedBlock.visible === false ? 'Đang ẩn' : 'Đang hiện'}
                  </button>
                </div>

                {ADDABLE_BLOCK_TYPES.includes(selectedBlock.type) && (
                  <button className={cx('dangerBtn')} onClick={() => removeBlock(selectedBlock.id)}>
                    <Trash2 size={14} /> Xoá yếu tố
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

export default ExamTypeLayoutEditorPage;
