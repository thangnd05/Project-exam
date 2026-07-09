import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import {
  Heart, Bookmark, MessageCircle, ChevronRight, Copy
} from 'lucide-react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { useAuth } from '~/shared/hooks/useAuth';
import { useCosmetics } from '~/shared/hooks/useCosmetics';
import AvatarWithCosmetic from '~/components/cosmetic/AvatarWithCosmetic';
import ConfirmDeleteModal from '~/shared/ui/modal/ConfirmDeleteModal';
import routes from '~/shared/config/Routes';
import styles from './PostDetailPage.module.scss';
import { getPosts, getPostById, getComments, addComment, updateComment, deleteComment, toggleReact, toggleSavePost } from '~/api/postApi';

const cx = classNames.bind(styles);
const MAX_REPLY_DEPTH = 4;

function PostDetailPage() {
  const { postId } = useParams();
  const { user } = useAuth();
  const { frame: cosmeticFrame, badge: cosmeticBadge } = useCosmetics();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isReacting, setIsReacting] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [saveCount, setSaveCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState([]);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyIndentPx, setReplyIndentPx] = useState(40);
  const [expandedReplies, setExpandedReplies] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPostData = async () => {
      try {
        setLoading(true);
        const data = await getPostById(postId);
        setPost(data);

        const commentsData = await getComments(postId);
        setComments(commentsData || []);

        setLiked(data.currentUserReactType === 'LIKE');
        setLikeCount(data.reactCounts?.LIKE || 0);

        setBookmarked(!!data.currentUserSaved);
        setSaveCount(data.saveCount || 0);

        if (data.categories && data.categories.length > 0) {
          const catId = data.categories[0].id;
          const relatedData = await getPosts({ categoryId: catId, size: 8 });
          if (relatedData && relatedData.content) {

            setRelatedPosts(relatedData.content.filter(p => p.id !== postId));
          }
        }
      } catch (error) {
        console.error('Failed to fetch post:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPostData();
  }, [postId]);

  const skipFirstCosmeticSync = useRef(true);
  useEffect(() => {
    if (!postId) return;
    if (skipFirstCosmeticSync.current) {
      skipFirstCosmeticSync.current = false;
      return;
    }
    (async () => {
      try {
        const [commentsData, postData] = await Promise.all([
          getComments(postId),
          getPostById(postId),
        ]);
        setComments(commentsData || []);
        setPost((prev) =>
          prev
            ? { ...prev, equippedFrame: postData.equippedFrame, equippedBadge: postData.equippedBadge }
            : prev,
        );
      } catch (error) {

      }
    })();
  }, [cosmeticFrame, cosmeticBadge, postId]);

  useEffect(() => {
    const computeIndent = () => {
      if (window.innerWidth <= 576) return 12;
      if (window.innerWidth <= 768) return 18;
      if (window.innerWidth <= 992) return 28;
      return 40;
    };

    const updateIndent = () => setReplyIndentPx(computeIndent());
    updateIndent();
    window.addEventListener('resize', updateIndent);
    return () => window.removeEventListener('resize', updateIndent);
  }, []);

  useEffect(() => {
    setExpandedReplies({});
  }, [comments]);

  const sliderSettings = {
    dots: true,
    infinite: relatedPosts.length > 3,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        }
      }
    ]
  };

  const copyPostLinkToClipboard = async () => {
    const postUrl = window.location.href;

    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(postUrl);
      return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = postUrl;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  };

  const showCopySuccess = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyPostLink = async () => {
    try {
      await copyPostLinkToClipboard();
      showCopySuccess();
    } catch (error) {
      console.error('Failed to copy post link:', error);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Vui lòng đăng nhập để bình luận');
      return;
    }
    if (!newComment.trim()) return;

    try {
      await addComment(postId, { content: newComment });
      setNewComment('');

      const data = await getComments(postId);
      setComments(data || []);
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleUpdateComment = async (commentId) => {
    if (!editContent.trim()) return;
    try {
      await updateComment(commentId, { content: editContent });
      setEditingCommentId(null);
      setEditContent('');
      const data = await getComments(postId);
      setComments(data || []);
    } catch (error) {
      console.error('Failed to update comment:', error);
    }
  };

  const handleDeleteComment = async () => {
    if (!deletingCommentId) return;
    try {
      await deleteComment(deletingCommentId);
      const data = await getComments(postId);
      setComments(data || []);
      setDeletingCommentId(null);
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const handleReply = async (parentId) => {
    if (!replyContent.trim()) return;
    try {
      await addComment(postId, { content: replyContent, parentId });
      setReplyingToId(null);
      setReplyContent('');
      const data = await getComments(postId);
      setComments(data || []);
    } catch (error) {
      console.error('Failed to add reply:', error);
    }
  };

  const handleToggleLike = async () => {
    if (!user) {
      alert('Vui lòng đăng nhập để thả tim');
      return;
    }
    if (isReacting) return;

    const prevLiked = liked;
    const prevLikeCount = likeCount;

    setLiked(!prevLiked);
    setLikeCount(prevLiked ? Math.max(0, prevLikeCount - 1) : prevLikeCount + 1);
    setIsReacting(true);

    try {
      const summary = await toggleReact(postId, { type: 'LIKE' });
      setLiked(summary.currentUserReactType === 'LIKE');
      setLikeCount(summary.counts?.LIKE || 0);
    } catch (error) {
      setLiked(prevLiked);
      setLikeCount(prevLikeCount);
      console.error('Failed to toggle like:', error);
    } finally {
      setIsReacting(false);
    }
  };

  const handleToggleBookmark = async () => {
    if (!user) {
      alert('Vui lòng đăng nhập để lưu bài viết');
      return;
    }
    if (isSaving) return;

    const prevSaved = bookmarked;
    const prevCount = saveCount;
    setBookmarked(!prevSaved);
    setSaveCount(prevSaved ? Math.max(0, prevCount - 1) : prevCount + 1);
    setIsSaving(true);

    try {
      const result = await toggleSavePost(postId);
      setBookmarked(!!result.saved);
      setSaveCount(result.saveCount || 0);
    } catch (error) {
      setBookmarked(prevSaved);
      setSaveCount(prevCount);
      console.error('Failed to toggle bookmark:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const countNestedReplies = (comment) => {
    if (!comment?.replies || comment.replies.length === 0) return 0;
    return comment.replies.reduce((total, reply) => total + 1 + countNestedReplies(reply), 0);
  };

  const renderComment = (comment, depth = 0) => {
    const indentStep = depth > 0 && depth <= MAX_REPLY_DEPTH ? `${replyIndentPx}px` : '0px';
    const mentionName = comment.authorName || 'user';
    const hasReplies = comment.replies && comment.replies.length > 0;
    const nestedReplyCount = countNestedReplies(comment);
    const shouldCollapsible = depth === 0 && nestedReplyCount > 3;
    const isExpanded = shouldCollapsible ? !!expandedReplies[comment.id] : true;

    return (
      <div key={comment.id} className={cx('commentNode')} style={{ marginLeft: indentStep }}>
        <div className={cx('commentItem')}>
          <AvatarWithCosmetic
            src={comment.authorAvatar}
            fallbackSrc="https://i.pravatar.cc/150?img=12"
            size={40}
            frame={comment.equippedFrame}
            badge={comment.equippedBadge}
          />
          <div className={cx('contentBox')}>
            <div className={cx('commentMeta')}>
              <span className={cx('authorName')}>{comment.authorName}</span>
              {comment.userId === post.userId && <span className={cx('opTag')}>Tác giả</span>}
            </div>

            {editingCommentId === comment.id ? (
              <div className="mt-2">
                <textarea
                  className="form-control mb-2"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                />
                <button className="btn btn-primary btn-sm me-2" onClick={() => handleUpdateComment(comment.id)}>Lưu</button>
                <button className="btn btn-light btn-sm" onClick={() => setEditingCommentId(null)}>Hủy</button>
              </div>
            ) : (
              <p className={cx('text')}>{comment.content}</p>
            )}

            <div className={cx('actions')}>
              <button onClick={() => {
                setReplyingToId(comment.id);
                setReplyContent('');
              }}>Trả lời</button>
              <span className={cx('time')}>{new Date(comment.createdAt).toLocaleString('vi-VN')}</span>
              {user && user.id === comment.userId && (
                <>
                  <button onClick={() => {
                    setEditingCommentId(comment.id);
                    setEditContent(comment.content);
                  }}>Sửa</button>
                  <button onClick={() => setDeletingCommentId(comment.id)}>Xóa</button>
                </>
              )}
            </div>

            {replyingToId === comment.id && (
              <div className="mt-3">
                <textarea
                  className="form-control mb-2"
                  placeholder={`Viết câu trả lời cho ${mentionName}...`}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                />
                <button className="btn btn-primary btn-sm me-2" onClick={() => handleReply(comment.id)}>Gửi</button>
                <button className="btn btn-light btn-sm" onClick={() => setReplyingToId(null)}>Hủy</button>
              </div>
            )}
          </div>
        </div>
        {shouldCollapsible && !isExpanded && (
          <button
            type="button"
            className={cx('toggleRepliesBtn')}
            onClick={() => setExpandedReplies(prev => ({ ...prev, [comment.id]: true }))}
          >
            Xem tất cả {nestedReplyCount} phản hồi
          </button>
        )}

        {hasReplies && isExpanded && (
          <>
            <div className={cx('subComments')}>
              {comment.replies.map(reply =>
                renderComment(
                  reply,
                  depth < MAX_REPLY_DEPTH ? depth + 1 : depth
                )
              )}
            </div>
            {shouldCollapsible && isExpanded && (
              <button
                type="button"
                className={cx('toggleRepliesBtn')}
                onClick={() => setExpandedReplies(prev => ({ ...prev, [comment.id]: false }))}
              >
                Ẩn bớt phản hồi
              </button>
            )}
          </>
        )}
      </div>
    );
  };

  if (loading) return <div className="text-center py-5">Đang tải bài viết...</div>;
  if (!post) return <div className="text-center py-5">Không tìm thấy bài viết.</div>;

  return (
    <div className={cx('wrapperDetail')}>

      <div className={cx('containerDetail')}>

        <div className={cx('floatingBar')}>
          <button
            className={cx('actionBtn', { active: liked })}
            onClick={handleToggleLike}
            disabled={isReacting}
          >
            <div className={cx('iconCircle')}><Heart size={20} fill={liked ? 'currentColor' : 'none'} /></div>
            <span className={cx('count')}>{likeCount}</span>
          </button>
          <button
            className={cx('actionBtn', { active: bookmarked })}
            onClick={handleToggleBookmark}
            disabled={isSaving}
          >
            <div className={cx('iconCircle')}><Bookmark size={20} fill={bookmarked ? 'currentColor' : 'none'} /></div>
            <span className={cx('count')}>{saveCount}</span>
          </button>
          <button className={cx('actionBtn')} onClick={() => document.getElementById('comments').scrollIntoView({ behavior: 'smooth' })}>
            <div className={cx('iconCircle')}><MessageCircle size={20} /></div>
            <span className={cx('count')}>{post.commentCount || 0}</span>
          </button>
          <button className={cx('actionBtn', { active: copied })} onClick={handleCopyPostLink}>
            <div className={cx('iconCircle')}><Copy size={20} /></div>
          </button>
          {copied && <span className={cx('copyToast')}>Đã sao chép</span>}
        </div>

        <div className={cx('breadcrumbs')}>
          <Link to={routes.home}>Trang chủ</Link>
          <ChevronRight size={14} />
          <Link to={routes.posts}>Blog</Link>
          <ChevronRight size={14} />
          <Link to="#">{post.categories?.[0]?.name || 'Blog'}</Link>
          <ChevronRight size={14} />
          <span className={cx('current')}>{post.title}</span>
        </div>

        <header className={cx('articleHeader')}>
          <span className={cx('categoryPill')}>{post.categories?.[0]?.name || 'Blog'}</span>
          <h1>{post.title}</h1>
        </header>

        <div className={cx('metaRow')}>
          <div className={cx('authorSide')}>
            <AvatarWithCosmetic
              src={post.authorAvatar}
              fallbackSrc="https://i.pravatar.cc/150?img=12"
              size={44}
              frame={post.equippedFrame}
              badge={post.equippedBadge}
            />
            <div className={cx('authorInfo')}>
              <Link to="#">{post.authorName}</Link>
            </div>
          </div>
          <div className={cx('metaSide')}>
            {new Date(post.createdAt).toLocaleDateString('vi-VN')}
          </div>
        </div>

        <article className={cx('articleBody')}>
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </article>

        <section id="comments" className={cx('commentsSection')}>
          <h3>Bình luận ({post.commentCount || 0})</h3>

          <form className={cx('commentForm')} onSubmit={handleSubmitComment}>
            <div className="d-flex align-items-center mb-3">
              <AvatarWithCosmetic
                src={user?.avatarUrl}
                fallbackSrc="https://i.pravatar.cc/150?img=12"
                size={40}
                frame={cosmeticFrame}
                badge={cosmeticBadge}
              />
            </div>
            <div className={cx('formContent')}>
              <textarea
                placeholder="Chia sẻ suy nghĩ của bạn về bài viết này..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <div className={cx('formActions')}>
                <button type="submit" className={cx('submitBtn')}>Đăng bình luận</button>
              </div>
            </div>
          </form>

          <div className={cx('commentList')}>
            {comments.map(comment => renderComment(comment))}
          </div>
        </section>

        {relatedPosts.length > 0 && (
          <section className={cx('relatedPosts')}>
            <h3>Bài viết liên quan</h3>
            <div className={cx('sliderContainer')}>
              <Slider {...sliderSettings}>
                {relatedPosts.map(rel => (
                  <div key={rel.id} className={cx('sliderItem')}>
                    <div className={cx('relatedCard')} onClick={() => navigate(routes.postDetail.replace(':postId', rel.id))}>
                      <div className={cx('imgWrap')}>
                        <img src={rel.thumbnailUrl || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=400&q=80'} alt={rel.title} />
                      </div>
                      <span className="text-primary fw-bold small mb-2 d-block">{rel.categories?.[0]?.name || 'Blog'}</span>
                      <h4>{rel.title}</h4>
                      <div className={cx('meta')}>{new Date(rel.createdAt).toLocaleDateString('vi-VN')}</div>
                    </div>
                  </div>
                ))}
              </Slider>
            </div>
          </section>
        )}

      </div>

      <ConfirmDeleteModal
        show={Boolean(deletingCommentId)}
        onClose={() => setDeletingCommentId(null)}
        onConfirm={handleDeleteComment}
        title="Xác nhận xóa bình luận"
        message="Bạn có chắc muốn xóa bình luận này? Hành động này không thể hoàn tác."
      />
    </div>
  );
}

export default PostDetailPage;
