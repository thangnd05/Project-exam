import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import { Alert, Spinner } from 'react-bootstrap';
import { IoArrowBackOutline, IoEyeOutline, IoHeartOutline, IoChatbubbleOutline, IoBookmarkOutline } from 'react-icons/io5';
import { toast } from 'react-toastify';
import { getSavedPosts, toggleSavePost } from '~/api/postApi';
import routes from '~/config/Routes';
import styles from './PostsListPage.module.scss';

const cx = classNames.bind(styles);

const formatDate = (value) => {
  if (!value) return '--';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '--' : d.toLocaleDateString('vi-VN');
};

function SavedPostsPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await getSavedPosts();
      setPosts(Array.isArray(data) ? data : []);
    } catch (error) {
      setErrorMessage('Không tải được danh sách bài đã lưu.');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUnsave = async (postId) => {
    if (!window.confirm('Bỏ lưu bài viết này?')) return;
    setActionLoadingId(postId);
    try {
      await toggleSavePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      toast.success('Đã bỏ lưu');
    } catch (error) {
      toast.error('Không thể bỏ lưu. Vui lòng thử lại.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className={cx('wrapper')}>
      <div className={cx('container')}>
        <header className={cx('header')}>
          <div>
            <h1 className={cx('title')}>Bài viết đã lưu</h1>
            <p className={cx('subtitle')}>
              Những bài viết bạn đã đánh dấu để xem lại.
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
            Bạn chưa lưu bài viết nào. Mở một bài viết bất kỳ và bấm icon <IoBookmarkOutline /> để lưu lại.
          </Alert>
        )}

        {!loading && !errorMessage && posts.length > 0 && (
          <div className={cx('list')}>
            {posts.map((post) => (
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
                    <span className={cx('authorMeta')}>
                      {post.authorAvatar && (
                        <img
                          src={post.authorAvatar}
                          alt={post.authorName}
                          className={cx('authorAvatar')}
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <span>{post.authorName || 'Ẩn danh'}</span>
                    </span>
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
                    className={cx('actionBtn', 'unsaveBtn')}
                    onClick={() => handleUnsave(post.id)}
                    disabled={actionLoadingId === post.id}
                  >
                    <IoBookmarkOutline />
                    {actionLoadingId === post.id ? 'Đang bỏ...' : 'Bỏ lưu'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SavedPostsPage;
