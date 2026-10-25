'use client';

import { buildLoginUrlFromHere } from '@/app/features/auth/authRedirect';
import { useRouter } from '@/app/i18n/navigation';
import { useState, useRef, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';

import { toast } from 'react-toastify';
import classNames from 'classnames/bind';
import { useAuth } from '@/app/hooks/useAuth';
import type { CategoryResponse, PostResponse } from '@/app/types';
import RichTextEditor, { type RichTextEditorHandle } from '@/app/components/RichTextEditor/RichTextEditor';
import CommonFormModal from '@/app/components/modal/CommonFormModal';
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';
import styles from '@/app/components/modal/CommonFormModal.module.scss';
import { useSavePost, type InlinePostImage } from '@/app/features/posts/CreatePostModal/hooks/useSavePost';

const cx = classNames.bind(styles);

type CreatePostModalProps = {
  show: boolean;
  onClose: () => void;
  onRefresh?: () => void;
  categories?: CategoryResponse[];
  editingPost?: PostResponse | null;
};

function CreatePostModal({ show, onClose, onRefresh, categories = [], editingPost = null }: CreatePostModalProps) {
  const t = useTranslations('Posts.editor');
  const isEditing = !!editingPost;
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [inlineImages, setInlineImages] = useState<InlinePostImage[]>([]);

  const { user } = useAuth();
  const router = useRouter();

  const savePostMutation = useSavePost({
    onSuccess: () => {
      onClose();
      if (onRefresh) onRefresh();
    },
  });
  const loading = savePostMutation.isPending;

  // Mở modal (hoặc đổi bài đang sửa) thì nạp lại form — điều chỉnh state ngay khi render, không cần effect.
  const [prevOpen, setPrevOpen] = useState<{ show: boolean; editingPost: PostResponse | null }>({
    show: false,
    editingPost: null,
  });
  if (prevOpen.show !== show || prevOpen.editingPost !== editingPost) {
    setPrevOpen({ show, editingPost });
    if (show) {
      if (editingPost) {
        setTitle(editingPost.title || '');
        setContent(editingPost.content || '');
        setCategoryId(editingPost.categories?.[0]?.id || '');
        setThumbnailUrl(editingPost.thumbnailUrl || '');
      } else {
        setTitle('');
        setContent('');
        setCategoryId('');
        setThumbnailUrl('');
      }
      setThumbnailFile(null);
      setInlineImages([]);
    }
  }

  const quillRef = useRef<RichTextEditorHandle>(null);

  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64Url = e.target?.result as string;
          setInlineImages((prev) => [...prev, { file, base64Url }]);

          const quill = quillRef.current?.getEditor();
          if (!quill) return;
          const range = quill.getSelection(true);
          quill.insertEmbed(range.index, 'image', base64Url);
        };
        reader.readAsDataURL(file);
      }
    };
  }, []);

  const quillModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image', 'code-block'],
        ['clean'],
      ],
      handlers: {
        image: imageHandler,
      },
    },
  }), [imageHandler]);

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list',
    'link', 'image', 'code-block',
  ];

  const handleSubmit = () => {
    if (!user) {
      toast.warning(t('loginRequired'));
      setTimeout(() => {
        onClose();
        router.push(buildLoginUrlFromHere());
      }, 1200);
      return;
    }

    if (!title.trim() || !content.trim() || !categoryId) {
      toast.warning(t('missingFields'));
      return;
    }

    savePostMutation.mutate({
      title,
      content,
      categoryId,
      thumbnailUrl,
      thumbnailFile,
      inlineImages,
      isEditing,
      editingPostId: editingPost?.id,
    });
  };

  return (
    <CommonFormModal
      show={show}
      onHide={onClose}
      size="xl"
      title={isEditing ? t('editTitle') : t('createTitle')}
      footer={
        <ModalActionFooter
          cancelLabel={t('cancel')}
          submitLabel={isEditing ? t('submitEdit') : t('submitCreate')}
          loadingLabel={t('processing')}
          loading={loading}
          onCancel={onClose}
          onSubmit={handleSubmit}
        />
      }
    >

      <div className={cx('formGroup')}>
        <label className={cx('label')}>{t('titleLabel')}</label>
        <div className={cx('inputWrapper')}>
          <input
            type="text"
            className={cx('inputControl')}
            placeholder={t('titlePlaceholder')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      <div className={cx('row', 'mt-4')}>
        <div className={cx('col', 'formGroup')}>
          <label className={cx('label')}>{t('categoryLabel')}</label>
          <div className={cx('inputWrapper')}>
            <select
              className={cx('inputControl')}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={loading}
            >
              <option value="">{t('categoryPlaceholder')}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className={cx('row', 'mt-4')}>
        <div className={cx('col', 'formGroup')}>
          <label className={cx('label')}>{t('thumbnailUploadLabel')}</label>
          <input
            type="file"
            accept="image/*"
            className="form-control"
            onChange={(e) => setThumbnailFile(e.target.files?.[0] ?? null)}
            disabled={loading}
            style={{ padding: '1rem', fontSize: 'var(--font-size-ssm)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
          />
          {thumbnailFile && (
            <small className="text-muted d-block mt-2">{t('thumbnailSelected', { name: thumbnailFile.name })}</small>
          )}
        </div>
        <div className={cx('col', 'formGroup')}>
          <label className={cx('label')}>{t('thumbnailUrlLabel')}</label>
          <div className={cx('inputWrapper')}>
            <input
              type="text"
              className={cx('inputControl')}
              placeholder={t('thumbnailUrlPlaceholder')}
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>
      </div>
      <div className={cx('row', 'mt-1')}>
        <div className={cx('col')}>
          <small className="text-primary" style={{ fontStyle: 'italic' }}>
            {t('thumbnailNote')}
          </small>
        </div>
      </div>

      <div className={cx('formGroup', 'mt-4')}>
        <label className={cx('label')}>{t('contentLabel')}</label>
        <div className={cx('quillWrapper')}>
          <RichTextEditor
            ref={quillRef}
            theme="snow"
            value={content}
            onChange={setContent}
            modules={quillModules}
            formats={quillFormats}
            placeholder={t('contentPlaceholder')}
            style={{ height: '30rem', marginBottom: '5rem' }}
          />
        </div>
      </div>
    </CommonFormModal>
  );
}

export default CreatePostModal;
