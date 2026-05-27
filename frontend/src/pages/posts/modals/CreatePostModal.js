import { useState, useRef, useMemo, useCallback, useEffect } from 'react';

import { toast } from 'react-toastify';
import axios from '~/api/axiosClient';
import classNames from 'classnames/bind';
import { FaPenNib, FaEdit, FaImage, FaTag } from 'react-icons/fa';
import { useAuth } from '~/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import routes from '~/config/Routes';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import CommonFormModal from '~/components/common/modal/CommonFormModal';
import ModalActionFooter from '~/components/common/modal/ModalActionFooter';
import styles from '~/components/common/modal/CommonFormModal.module.scss';

const cx = classNames.bind(styles);

function CreatePostModal({ show, onClose, onRefresh, categories = [], editingPost = null }) {
  const isEditing = !!editingPost;
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [inlineImages, setInlineImages] = useState([]);

  const { user } = useAuth();
  const navigate = useNavigate();

  // Khởi tạo / reset state khi mở modal (cả create lẫn edit)
  useEffect(() => {
    if (!show) return;
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
  }, [show, editingPost]);

  const quillRef = useRef(null);

  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64Url = e.target.result;
          setInlineImages((prev) => [...prev, { file, base64Url }]);

          const quill = quillRef.current.getEditor();
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
    'list', 'bullet',
    'link', 'image', 'code-block',
  ];

  const handleSubmit = async () => {
    if (!user) {
      toast.warning(' Bạn cần đăng nhập trước khi đăng bài viết!');
      setTimeout(() => {
        onClose();
        navigate(routes.login);
      }, 1200);
      return;
    }

    if (!title.trim() || !content.trim() || !categoryId) {
      toast.warning(' Vui lòng điền đầy đủ tiêu đề, nội dung và chọn danh mục!');
      return;
    }

    setLoading(true);

    try {
      let finalContent = content;

      // Upload inline images that are still in the content
      const imagesToUpload = inlineImages.filter((img) => finalContent.includes(img.base64Url));

      if (imagesToUpload.length > 0) {
        toast.info(`Đang tải lên ${imagesToUpload.length} ảnh trong nội dung...`, { autoClose: 2000 });
        for (const img of imagesToUpload) {
          const imgFormData = new FormData();
          imgFormData.append('image', img.file);

          try {
            const res = await axios.post('/api/posts/upload-image', imgFormData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            const cloudUrl = res.data.url;
            finalContent = finalContent.split(img.base64Url).join(cloudUrl);
          } catch (error) {
            toast.error(` Lỗi tải ảnh ${img.file.name} lên Cloudinary!`);
          }
        }
      }

      const postData = {
        title,
        content: finalContent,
        thumbnailUrl: thumbnailUrl || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1350&q=80',
        categoryIds: [categoryId],
      };

      const formData = new FormData();
      formData.append('post', JSON.stringify(postData));

      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      }

      if (isEditing) {
        await axios.put(`/api/posts/${editingPost.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Cập nhật bài viết thành công!');
      } else {
        await axios.post('/api/posts', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Đăng bài viết thành công!');
      }

      onClose();
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || (isEditing ? 'Lỗi khi cập nhật bài viết!' : 'Lỗi khi đăng bài viết!'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <CommonFormModal
      show={show}
      onHide={onClose}
      size="xl"
      title={isEditing ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
      icon={isEditing ? FaEdit : FaPenNib}
      footer={
        <ModalActionFooter
          cancelLabel="Hủy bỏ"
          submitLabel={isEditing ? 'Lưu thay đổi' : 'Đăng bài ngay'}
          loadingLabel="Đang xử lý..."
          loading={loading}
          onCancel={onClose}
          onSubmit={handleSubmit}
        />
      }
    >

      <div className={cx('formGroup')}>
        <label className={cx('label')}>Tiêu đề bài viết</label>
        <div className={cx('inputWrapper')}>
          <span className={cx('inputIcon')}>
            <FaEdit />
          </span>
          <input
            type="text"
            className={cx('inputControl')}
            placeholder="Nhập tiêu đề hấp dẫn cho bài viết..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      <div className={cx('row', 'mt-4')}>
        <div className={cx('col', 'formGroup')}>
          <label className={cx('label')}>Danh mục</label>
          <div className={cx('inputWrapper')}>
            <span className={cx('inputIcon')}>
              <FaTag />
            </span>
            <select
              className={cx('inputControl')}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={loading}
            >
              <option value="">Chọn danh mục...</option>
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
          <label className={cx('label')}>Ảnh bìa (Upload từ máy tính)</label>
          <input
            type="file"
            accept="image/*"
            className="form-control"
            onChange={(e) => setThumbnailFile(e.target.files[0])}
            disabled={loading}
            style={{ padding: '10px', fontSize: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
          />
          {thumbnailFile && (
            <small className="text-muted d-block mt-2">Đã chọn: {thumbnailFile.name}</small>
          )}
        </div>
        <div className={cx('col', 'formGroup')}>
          <label className={cx('label')}>Hoặc dán Link (URL) ảnh bìa</label>
          <div className={cx('inputWrapper')}>
            <span className={cx('inputIcon')}>
              <FaImage />
            </span>
            <input
              type="text"
              className={cx('inputControl')}
              placeholder="Dán link ảnh bìa tại đây..."
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
            * Lưu ý: Nếu bạn chọn cả Upload ảnh và dán Link URL, hệ thống sẽ ưu tiên sử dụng ảnh Upload.
          </small>
        </div>
      </div>



      <div className={cx('formGroup', 'mt-4')}>
        <label className={cx('label')}>Nội dung chi tiết</label>
        <div className={cx('quillWrapper')}>
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={content}
            onChange={setContent}
            modules={quillModules}
            formats={quillFormats}
            placeholder="Viết nội dung bài viết tại đây..."
            style={{ height: '300px', marginBottom: '50px' }}
          />
        </div>
      </div>
    </CommonFormModal>
  );
}

export default CreatePostModal;
