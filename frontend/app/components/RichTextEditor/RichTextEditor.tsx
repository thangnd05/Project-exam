'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type Quill from 'quill';
import 'quill/dist/quill.snow.css';

/**
 * Trình soạn thảo dựng thẳng trên `quill@2`, thay cho `react-quill`.
 *
 * Vì sao tự viết: react-quill@2 gọi `findDOMNode` — API đã bị xoá ở React 19, nên nó là thứ
 * duy nhất chặn đường nâng React. Wrapper này giữ nguyên giao ước cũ mà 2 chỗ đang dùng cần:
 *   - `onChange(html, delta, source)` — EmailEditorModal chỉ nhận `source === 'user'` để Quill
 *     chuẩn hoá HTML lúc nạp không ghi đè nội dung thật.
 *   - `getEditor()` qua ref — CreatePostModal cần instance để chèn ảnh vào đúng vị trí con trỏ.
 *   - Cấu trúc DOM `.quill > (.ql-toolbar + .ql-container)` y như react-quill, để SCSS sẵn có
 *     không phải sửa một dòng nào.
 *
 * Quill chạm `document` ngay khi nạp module nên phải `import()` bên trong effect (chỉ chạy ở
 * trình duyệt) — nhờ vậy chỗ gọi không cần bọc `next/dynamic` nữa.
 */

export type RichTextEditorHandle = {
  getEditor: () => Quill | null;
};

type RichTextEditorProps = {
  value?: string;
  onChange?: (html: string, delta: unknown, source: string) => void;
  modules?: Record<string, unknown>;
  formats?: string[];
  placeholder?: string;
  theme?: string;
  className?: string;
  style?: React.CSSProperties;
};

const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(function RichTextEditor(
  { value = '', onChange, modules, formats, placeholder, theme = 'snow', className, style },
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<Quill | null>(null);
  const [ready, setReady] = useState(false);

  // Giữ trong ref để effect khởi tạo không phải chạy lại mỗi lần prop đổi (khởi tạo lại Quill
  // sẽ mất con trỏ và toàn bộ lịch sử undo).
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const initialValueRef = useRef(value);
  const optionsRef = useRef({ modules, formats, placeholder, theme });

  useImperativeHandle(ref, () => ({ getEditor: () => quillRef.current }), []);

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return undefined;

    (async () => {
      const { default: QuillCtor } = await import('quill');
      if (cancelled || !containerRef.current) return;

      // Quill biến chính div này thành .ql-container và chèn .ql-toolbar ngay trước nó.
      const editorHost = document.createElement('div');
      containerRef.current.appendChild(editorHost);

      const { modules: mods, formats: fmts, placeholder: ph, theme: th } = optionsRef.current;
      const quill = new QuillCtor(editorHost, {
        theme: th,
        placeholder: ph,
        ...(mods ? { modules: mods } : {}),
        ...(fmts ? { formats: fmts } : {}),
      });

      if (initialValueRef.current) {
        quill.clipboard.dangerouslyPasteHTML(initialValueRef.current, 'silent');
      }

      quill.on('text-change', (delta, _oldDelta, source) => {
        onChangeRef.current?.(quill.root.innerHTML, delta, source);
      });

      quillRef.current = quill;
      setReady(true);
    })();

    return () => {
      cancelled = true;
      quillRef.current = null;
      // Dọn sạch DOM Quill đã dựng để lần mount sau không bị nhân đôi thanh công cụ.
      if (container) container.innerHTML = '';
    };
  }, []);

  // Đồng bộ khi giá trị được đổi TỪ BÊN NGOÀI (mở modal với nội dung có sẵn, reset form...).
  // So sánh với HTML hiện tại để không ghi đè lúc người dùng đang gõ — nếu không, mỗi phím bấm
  // sẽ đẩy con trỏ về đầu.
  useEffect(() => {
    const quill = quillRef.current;
    if (!quill || !ready) return;
    const current = quill.root.innerHTML;
    const next = value || '';
    if (next === current) return;
    // Quill để lại '<p><br></p>' khi rỗng; coi đó là tương đương chuỗi rỗng.
    if (!next && current === '<p><br></p>') return;
    quill.clipboard.dangerouslyPasteHTML(next, 'silent');
  }, [value, ready]);

  return <div className={className ? `quill ${className}` : 'quill'} style={style} ref={containerRef} />;
});

export default RichTextEditor;
