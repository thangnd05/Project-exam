'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type Quill from 'quill';
import 'quill/dist/quill.snow.css';

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
      if (container) container.innerHTML = '';
    };
  }, []);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill || !ready) return;
    const current = quill.root.innerHTML;
    const next = value || '';
    if (next === current) return;
    if (!next && current === '<p><br></p>') return;
    quill.clipboard.dangerouslyPasteHTML(next, 'silent');
  }, [value, ready]);

  return <div className={className ? `quill ${className}` : 'quill'} style={style} ref={containerRef} />;
});

export default RichTextEditor;
