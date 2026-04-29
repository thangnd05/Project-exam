import { useState } from 'react';
import { Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import axios from 'axios';
import classNames from 'classnames/bind';
import { FaPenNib, FaEdit, FaImage, FaTag, FaAlignLeft } from 'react-icons/fa';
import { useAuth } from '~/hook/useAuth';
import { useNavigate } from 'react-router-dom';
import routes from '~/config/Routes';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import CommonFormModal from '~/components/common/modal/CommonFormModal';
import ModalActionFooter from '~/components/common/modal/ModalActionFooter';
import styles from '~/components/common/modal/CommonFormModal.module.scss';

const cx = classNames.bind(styles);

function CreatePostModal({ show, onClose, onRefresh, categories = [] }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');

  const { user } = useAuth();
  const navigate = useNavigate();

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image', 'code-block'],
      ['clean'],
    ],
  };

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet',
    'link', 'image', 'code-block',
  ];

  const handleCreate = async () => {
    setMessage('');

    if (!user) {
      setType('warning');
      setMessage('⚠️ Bạn cần đăng nhập trước khi tạo bài viết!');
      setTimeout(() => {
        onClose();
        navigate(routes.login);
      }, 1200);
      return;
    }

    if (!title.trim() || !content.trim() || !categoryId) {
      setType('danger');
      setMessage('⚠️ Vui lòng điền đầy đủ tiêu đề, nội dung và chọn danh mục!');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      const postData = {
        title,
        content,
        thumbnailUrl: thumbnailUrl || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1350&q=80',
        categoryIds: [categoryId],
      };
      
      formData.append('post', JSON.stringify(postData));
      // Nếu có file ảnh thật thì append vào 'images', hiện tại dùng URL nên bỏ qua

      await axios.post('/api/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('🎉 Đăng bài viết thành công!');
      
      setTitle('');
      setContent('');
      setCategoryId('');
      setThumbnailUrl('');
      
      onClose();
      if (onRefresh) onRefresh();
    } catch (err) {
      setType('danger');
      setMessage(
        err.response?.data?.message || '❌ Có lỗi xảy ra khi đăng bài viết!',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <CommonFormModal
      show={show}
      onHide={onClose}
      size="xl"
      title="Tạo bài viết mới"
      icon={FaPenNib}
      footer={
        <ModalActionFooter
          cancelLabel="Hủy bỏ"
          submitLabel="Đăng bài ngay"
          loadingLabel="Đang xử lý..."
          loading={loading}
          onCancel={onClose}
          onSubmit={handleCreate}
        />
      }
    >
      {message && (
        <Alert variant={type} style={{ margin: '15px 20px', fontSize: '14px' }}>
          {message}
        </Alert>
      )}

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

      <div className={cx('formGroup', 'mt-4')}>
        <label className={cx('label')}>Ảnh bìa (URL)</label>
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



      <div className={cx('formGroup', 'mt-4')}>
        <label className={cx('label')}>Nội dung chi tiết</label>
        <div className={cx('quillWrapper')}>
          <ReactQuill
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
