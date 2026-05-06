import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import { Alert, Spinner } from 'react-bootstrap';
import { IoArrowBackOutline, IoEyeOutline, IoHeartOutline, IoChatbubbleOutline, IoTrashOutline, IoPencilOutline } from 'react-icons/io5';
import { toast } from 'react-toastify';
import { getMyPosts, deletePost, getCategories, getPostById } from '~/api/postApi';
import CreatePostModal from '~/components/modals/CreatePostModal';
import routes from '~/config/Routes';
import styles from './PostsListPage.module.scss';

const cx = classNames.bind(styles);

const formatDate = (value) => {
  if (!value) return '--';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '--' : d.toLocaleDateString('vi-VN');
};

const STATUS_LABEL = {
  PENDING: { text: 'Chờ duyệt', cls: 'pending' },
  APPROVED: { text: 'Đã duyệt', cls: 'approved' },
};

function MyPostsPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [editingPost, setEditingPost] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await getMyPosts();
      setPosts(Array.isArray(data) ? data : []);
    } catch (error) {
      setErrorMessage('Không tải được danh sách bài viết của bạn.');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    getCategories()
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
  }, []);

  const handleEdit = async (postId) => {
    setActionLoadingId(postId);
    try {
      const fullPost = await getPostById(postId);
      setEditingPost(fullPost);
      setShowEditModal(true);
    } catch (error) {
      toast.error('Không tải được nội dung bài viết để chỉnh sửa.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCloseEdit = () => {
    setShowEditModal(false);
    setEditingPost(null);
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Xóa bài viết này? Hành động không thể hoàn tác.')) return;
    setActionLoadingId(postId);
    try {
      await deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      toast.success('Đã xóa bài viết');
    } catch (error) {
      toast.error('Không thể xóa bài viết. Vui lòng thử lại.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className={cx('wrapper')}>
      <div className={cx('container')}>
        <header className={cx('header')}>
          <div>
            <h1 className={cx('title')}>Bài viết của tôi</h1>
            <p className={cx('subtitle')}>
              Toàn bộ bài viết bạn đã đăng. Bài chờ duyệt vẫn xuất hiện ở đây cho đến khi được admin duyệt.
            </p>
          </div>
          <button
            type="button"
            className={cx('backBtn')}
            onClick={() => navigate(routes.profile)}
          >
            <IoArrowBackOutline />
            Quay lại profile
          </button>
        </header>

        {loading && (
          <div className={cx('loadingWrap')}>
            <Spinner animation="border" />
            <span>Đang tải...</span>
          </div>
        )}

        {!loading && errorMessage && (
          <Alert variant="danger" className={cx('alertBox')}>{errorMessage}</Alert>
        )}

        {!loading && !errorMessage && posts.length === 0 && (
          <Alert variant="info" className={cx('alertBox')}>
            Bạn chưa đăng bài viết nào. <Link to={routes.posts}>Tạo bài viết đầu tiên</Link>.
          </Alert>
        )}

        {!loading && !errorMessage && posts.length > 0 && (
          <div className={cx('list')}>
            {posts.map((post) => {
              const status = STATUS_LABEL[post.status] || { text: post.status, cls: '' };
              return (
                <article key={post.id} className={cx('card')}>
                  <Link
                    to={routes.postDetail.replace(':postId', post.id)}
                    className={cx('thumbnailLink')}
                  >
                    <img
                      src={post.thumbnailUrl || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=400&q=80'}
                      alt={post.title}
                      className={cx('thumbnail')}
                      referrerPolicy="no-referrer"
                    />
                  </Link>
                  <div className={cx('cardBody')}>
                    <div className={cx('cardMeta')}>
                      <span className={cx('statusBadge', status.cls)}>{status.text}</span>
                      <span className={cx('date')}>{formatDate(post.createdAt)}</span>
                    </div>
                    <Link
                      to={routes.postDetail.replace(':postId', post.id)}
                      className={cx('cardTitleLink')}
                    >
                      <h3 className={cx('cardTitle')}>{post.title}</h3>
                    </Link>
                    <div className={cx('stats')}>
                      <span><IoEyeOutline /> {post.viewCount || 0}</span>
                      <span><IoHeartOutline /> {post.totalReacts || 0}</span>
                      <span><IoChatbubbleOutline /> {post.commentCount || 0}</span>
                    </div>
                  </div>
                  <div className={cx('cardActions')}>
                    <button
                      type="button"
                      className={cx('actionBtn', 'editBtn')}
                      onClick={() => handleEdit(post.id)}
                      disabled={actionLoadingId === post.id}
                    >
                      <IoPencilOutline />
                      Sửa
                    </button>
                    <button
                      type="button"
                      className={cx('actionBtn', 'deleteBtn')}
                      onClick={() => handleDelete(post.id)}
                      disabled={actionLoadingId === post.id}
                    >
                      <IoTrashOutline />
                      {actionLoadingId === post.id ? 'Đang xóa...' : 'Xóa'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <CreatePostModal
        show={showEditModal}
        onClose={handleCloseEdit}
        onRefresh={fetchData}
        categories={categories}
        editingPost={editingPost}
      />
    </div>
  );
}

export default MyPostsPage;
