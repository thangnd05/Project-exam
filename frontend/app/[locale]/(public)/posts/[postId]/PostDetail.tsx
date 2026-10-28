'use client';

import dynamic from 'next/dynamic';
import Link, { useLocalizeHref, useRouter } from '@/app/i18n/navigation';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import DOMPurify from 'dompurify';
import classNames from 'classnames/bind';
import { toast } from 'react-toastify';
import {
  Heart, Bookmark, MessageCircle, ChevronRight, Copy
} from 'lucide-react';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { useAuth } from '@/app/hooks/useAuth';
import { useCosmetics } from '@/app/features/gamification/cosmetic/hooks/useCosmetics';
import AvatarWithCosmetic from '@/app/features/gamification/cosmetic/AvatarWithCosmetic';
import ConfirmDeleteModal from '@/app/components/modal/ConfirmDeleteModal';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import routes from '@/app/configs/Routes';
import styles from './PostDetail.module.scss';
import { postsKeys, usePostDetail, usePostComments, useRelatedPosts } from '@/app/features/posts/hooks/usePosts';
import { useAddComment, useUpdateComment, useDeleteComment } from './_hooks/useComments';
import { useToggleReact, useToggleSavePost } from './_hooks/usePostReactions';
import { ReactType } from '@/app/enums';
import type { CommentResponse } from '@/app/types';
import MediaImage from '@/app/components/MediaImage/MediaImage';
import { BREAKPOINTS } from '@/app/assets/styles/breakpoints';
import { formatDateTime, formatLongDate } from '@/app/utils/format-date-time';

const Slider = dynamic(() => import('react-slick'), { ssr: false });

const cx = classNames.bind(styles);
const MAX_REPLY_DEPTH = 4;

function PostDetail() {
  const { postId } = useParams<{ postId: string }>();
  const { user } = useAuth();
  const { frame: cosmeticFrame, badge: cosmeticBadge } = useCosmetics();
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations('Posts.detail');
  const localizeHref = useLocalizeHref();

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [saveCount, setSaveCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyIndentPx, setReplyIndentPx] = useState(40);
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  // Đổi bài viết thì thu gọn lại các luồng trả lời; tải lại bình luận (sau khi trả lời/sửa) thì giữ nguyên.
  const [expandedForPost, setExpandedForPost] = useState(postId);
  if (expandedForPost !== postId) {
    setExpandedForPost(postId);
    setExpandedReplies({});
  }

  const { post, isLoading: loading, isError, refetch } = usePostDetail(postId);
  const { comments = [] } = usePostComments(postId);

  const categoryId = post?.categories?.[0]?.id;
  const { relatedPosts = [] } = useRelatedPosts({
    categoryId,
    postId,
    enabled: !!categoryId,
  });

  const reloadComments = () =>
    queryClient.invalidateQueries({ queryKey: postsKeys.comments(postId) });

  const addCommentMutation = useAddComment();
  const updateCommentMutation = useUpdateComment();
  const deleteCommentMutation = useDeleteComment();
  const reactMutation = useToggleReact();
  const saveMutation = useToggleSavePost();
  const isReacting = reactMutation.isPending;
  const isSaving = saveMutation.isPending;

  // Nạp trạng thái like/lưu cục bộ mỗi khi chuyển sang bài viết khác (điều chỉnh state ngay khi render).
  const [seededPostId, setSeededPostId] = useState<string | null>(null);
  if (post && post.id !== seededPostId) {
    setSeededPostId(post.id);
    setLiked(post.currentUserReactType === ReactType.LIKE);
    setLikeCount(post.reactCounts?.LIKE || 0);
    setBookmarked(!!post.currentUserSaved);
    setSaveCount(post.saveCount || 0);
  }

  const skipFirstCosmeticSync = useRef(true);
  useEffect(() => {
    if (!postId) return;
    if (skipFirstCosmeticSync.current) {
      skipFirstCosmeticSync.current = false;
      return;
    }
    queryClient.invalidateQueries({ queryKey: postsKeys.detail(postId) });
    queryClient.invalidateQueries({ queryKey: postsKeys.comments(postId) });
  }, [cosmeticFrame, cosmeticBadge, postId, queryClient]);

  useEffect(() => {
    const computeIndent = () => {
      if (window.innerWidth < BREAKPOINTS.sm) return 12;
      if (window.innerWidth < BREAKPOINTS.md) return 18;
      if (window.innerWidth < BREAKPOINTS.lg) return 28;
      return 40;
    };

    const updateIndent = () => setReplyIndentPx(computeIndent());
    updateIndent();
    window.addEventListener('resize', updateIndent);
    return () => window.removeEventListener('resize', updateIndent);
  }, []);

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

  const handleSubmitComment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      toast.warning(t('loginToComment'));
      return;
    }
    if (!newComment.trim()) return;

    addCommentMutation.mutate(
      { postId, data: { content: newComment } },
      {
        onSuccess: async () => {
          setNewComment('');
          await reloadComments();
        },
        onError: (error) => console.error('Failed to add comment:', error),
      },
    );
  };

  const handleUpdateComment = (commentId: string) => {
    if (!editContent.trim()) return;
    updateCommentMutation.mutate(
      { commentId, data: { content: editContent } },
      {
        onSuccess: async () => {
          setEditingCommentId(null);
          setEditContent('');
          await reloadComments();
        },
        onError: (error) => console.error('Failed to update comment:', error),
      },
    );
  };

  const handleDeleteComment = () => {
    if (!deletingCommentId) return;
    deleteCommentMutation.mutate(deletingCommentId, {
      onSuccess: async () => {
        await reloadComments();
        setDeletingCommentId(null);
      },
      onError: (error) => console.error('Failed to delete comment:', error),
    });
  };

  const handleReply = (parentId: string) => {
    if (!replyContent.trim()) return;
    addCommentMutation.mutate(
      { postId, data: { content: replyContent, parentId } },
      {
        onSuccess: async () => {
          setReplyingToId(null);
          setReplyContent('');
          await reloadComments();
        },
        onError: (error) => console.error('Failed to add reply:', error),
      },
    );
  };

  const handleToggleLike = () => {
    if (!user) {
      toast.warning(t('loginToLike'));
      return;
    }
    if (isReacting) return;

    const prevLiked = liked;
    const prevLikeCount = likeCount;

    setLiked(!prevLiked);
    setLikeCount(prevLiked ? Math.max(0, prevLikeCount - 1) : prevLikeCount + 1);

    reactMutation.mutate(
      { postId, type: ReactType.LIKE },
      {
        onSuccess: (summary) => {
          setLiked(summary.currentUserReactType === ReactType.LIKE);
          setLikeCount(summary.counts?.LIKE || 0);
        },
        onError: (error) => {
          setLiked(prevLiked);
          setLikeCount(prevLikeCount);
          console.error('Failed to toggle like:', error);
        },
      },
    );
  };

  const handleToggleBookmark = () => {
    if (!user) {
      toast.warning(t('loginToSave'));
      return;
    }
    if (isSaving) return;

    const prevSaved = bookmarked;
    const prevCount = saveCount;
    setBookmarked(!prevSaved);
    setSaveCount(prevSaved ? Math.max(0, prevCount - 1) : prevCount + 1);

    saveMutation.mutate(postId, {
      onSuccess: (result) => {
        setBookmarked(!!result.saved);
        setSaveCount(result.saveCount || 0);
      },
      onError: (error) => {
        setBookmarked(prevSaved);
        setSaveCount(prevCount);
        console.error('Failed to toggle bookmark:', error);
      },
    });
  };

  const countNestedReplies = (comment: CommentResponse): number => {
    if (!comment?.replies || comment.replies.length === 0) return 0;
    return comment.replies.reduce((total, reply) => total + 1 + countNestedReplies(reply), 0);
  };

  const renderComment = (comment: CommentResponse, depth = 0): React.ReactNode => {
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
              {comment.userId === post?.userId && <span className={cx('opTag')}>{t('authorTag')}</span>}
            </div>

            {editingCommentId === comment.id ? (
              <div className="mt-2">
                <textarea
                  className="form-control mb-2"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                />
                <ButtonPrime size="sm" className="me-2" onClick={() => handleUpdateComment(comment.id)}>{t('save')}</ButtonPrime>
                <ButtonPrime variant="ghost" size="sm" onClick={() => setEditingCommentId(null)}>{t('cancel')}</ButtonPrime>
              </div>
            ) : (
              <p className={cx('text')}>{comment.content}</p>
            )}

            <div className={cx('actions')}>
              <ButtonPrime variant="link" size="sm" onClick={() => {
                setReplyingToId(comment.id);
                setReplyContent('');
              }}>{t('reply')}</ButtonPrime>
              <span className={cx('time')}>{formatDateTime(comment.createdAt)}</span>
              {user && user.userId === comment.userId && (
                <>
                  <ButtonPrime variant="link" size="sm" onClick={() => {
                    setEditingCommentId(comment.id);
                    setEditContent(comment.content ?? '');
                  }}>{t('edit')}</ButtonPrime>
                  <ButtonPrime variant="link" size="sm" onClick={() => setDeletingCommentId(comment.id)}>{t('delete')}</ButtonPrime>
                </>
              )}
            </div>

            {replyingToId === comment.id && (
              <div className="mt-3">
                <textarea
                  className="form-control mb-2"
                  placeholder={t('replyPlaceholder', { name: mentionName })}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                />
                <ButtonPrime size="sm" className="me-2" onClick={() => handleReply(comment.id)}>{t('send')}</ButtonPrime>
                <ButtonPrime variant="ghost" size="sm" onClick={() => setReplyingToId(null)}>{t('cancel')}</ButtonPrime>
              </div>
            )}
          </div>
        </div>
        {shouldCollapsible && !isExpanded && (
          <ButtonPrime
            variant="link"
            className={cx('toggleRepliesBtn')}
            onClick={() => setExpandedReplies(prev => ({ ...prev, [comment.id]: true }))}
          >
            {t('showAllReplies', { count: nestedReplyCount })}
          </ButtonPrime>
        )}

        {hasReplies && isExpanded && (
          <>
            <div className={cx('subComments')}>
              {comment.replies?.map(reply =>
                renderComment(
                  reply,
                  depth < MAX_REPLY_DEPTH ? depth + 1 : depth
                )
              )}
            </div>
            {shouldCollapsible && isExpanded && (
              <ButtonPrime
                variant="link"
                className={cx('toggleRepliesBtn')}
                onClick={() => setExpandedReplies(prev => ({ ...prev, [comment.id]: false }))}
              >
                {t('hideReplies')}
              </ButtonPrime>
            )}
          </>
        )}
      </div>
    );
  };

  if (loading) return <div className="text-center py-5">{t('loading')}</div>;
  if (isError) {
    return (
      <div className="text-center py-5">
        <p style={{ marginBottom: '1.6rem', color: 'var(--text-secondary)' }}>
          {t('loadError')}
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <ButtonPrime variant="outline" onClick={() => router.push(localizeHref(routes.posts || '/posts'))}>
            {t('backToList')}
          </ButtonPrime>
          <ButtonPrime onClick={() => refetch()}>{t('retry')}</ButtonPrime>
        </div>
      </div>
    );
  }
  if (!post) return <div className="text-center py-5">{t('notFound')}</div>;

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
          <button className={cx('actionBtn')} onClick={() => document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' })}>
            <div className={cx('iconCircle')}><MessageCircle size={20} /></div>
            <span className={cx('count')}>{post.commentCount || 0}</span>
          </button>
          <button className={cx('actionBtn', { active: copied })} onClick={handleCopyPostLink}>
            <div className={cx('iconCircle')}><Copy size={20} /></div>
          </button>
          {copied && <span className={cx('copyToast')}>{t('copied')}</span>}
        </div>

        <div className={cx('breadcrumbs')}>
          <Link href={routes.home}>{t('breadcrumbHome')}</Link>
          <ChevronRight size={14} />
          <Link href={routes.posts}>Blog</Link>
          <ChevronRight size={14} />
          <Link href="#">{post.categories?.[0]?.name || 'Blog'}</Link>
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
              <Link href="#">{post.authorName}</Link>
            </div>
          </div>
          <div className={cx('metaSide')}>
            {formatLongDate(post.createdAt)}
          </div>
        </div>

        <article className={cx('articleBody')}>
          <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content || '') }} />
        </article>

        <section id="comments" className={cx('commentsSection')}>
          <h3>{t('comments', { count: post.commentCount || 0 })}</h3>

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
                placeholder={t('commentPlaceholder')}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <div className={cx('formActions')}>
                <ButtonPrime type="submit" variant="primary" size="md">{t('postComment')}</ButtonPrime>
              </div>
            </div>
          </form>

          <div className={cx('commentList')}>
            {comments.map(comment => renderComment(comment))}
          </div>
        </section>

        {relatedPosts.length > 0 && (
          <section className={cx('relatedPosts')}>
            <h3>{t('related')}</h3>
            <div className={cx('sliderContainer')}>
              <Slider {...sliderSettings}>
                {relatedPosts.map(rel => (
                  <div key={rel.id} className={cx('sliderItem')}>
                    <div className={cx('relatedCard')} onClick={() => router.push(localizeHref(routes.postDetail.replace(':postId', rel.id)))}>
                      <div className={cx('imgWrap')}>
                        <MediaImage
                          cover
                          src={rel.thumbnailUrl || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=400&q=80'}
                          alt={rel.title ?? ''}
                          width={400}
                          height={225}
                          sizes="400px"
                        />
                      </div>
                      <span className="text-primary fw-bold small mb-2 d-block">{rel.categories?.[0]?.name || 'Blog'}</span>
                      <h4>{rel.title}</h4>
                      <div className={cx('meta')}>{formatLongDate(rel.createdAt)}</div>
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
        title={t('deleteCommentTitle')}
        message={t('deleteCommentMessage')}
      />
    </div>
  );
}

export default PostDetail;
