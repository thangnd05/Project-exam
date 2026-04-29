import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import {
  Heart, Bookmark, MessageCircle, Share2, ChevronRight, Copy, ThumbsUp, User
} from 'lucide-react';
import { Button } from 'react-bootstrap';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { useAuth } from '~/hook/useAuth';
import routes from '~/config/Routes';
import styles from './PostDetailPage.module.scss';
import { getPosts, getPostById, getComments, addComment, updateComment, deleteComment, getReacts, toggleReact } from '~/api/postApi';

const cx = classNames.bind(styles);

function PostDetailPage() {
  const { postId } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState([]);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPostData = async () => {
      try {
        setLoading(true);
        const data = await getPostById(postId);
        setPost(data);

        // Fetch comments
        const commentsData = await getComments(postId);
        setComments(commentsData || []);

        // Check if liked
        if (data.currentUserReactType) {
          setLiked(true);
        }

        // Fetch related posts (same category)
        if (data.categories && data.categories.length > 0) {
          const catId = data.categories[0].id;
          const relatedData = await getPosts({ categoryId: catId, size: 8 });
          if (relatedData && relatedData.content) {
            // Filter out current post
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

  const handleCopyCode = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      // Refresh comments
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

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Bạn có chắc muốn xóa bình luận này?')) return;
    try {
      await deleteComment(commentId);
      const data = await getComments(postId);
      setComments(data || []);
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

  if (loading) return <div className="text-center py-5">Đang tải bài viết...</div>;
  if (!post) return <div className="text-center py-5">Không tìm thấy bài viết.</div>;

  return (
    <div className={cx('wrapperDetail')}>

      <div className={cx('containerDetail')}>

        {/* Floating Actions Sidebar */}
        <div className={cx('floatingBar')}>
          <button className={cx('actionBtn', { active: liked })} onClick={() => setLiked(!liked)}>
            <div className={cx('iconCircle')}><Heart size={20} fill={liked ? 'currentColor' : 'none'} /></div>
            <span className={cx('count')}>{Object.values(post.reactCounts || {}).reduce((a, b) => a + b, 0)}</span>
          </button>
          <button className={cx('actionBtn', { active: bookmarked })} onClick={() => setBookmarked(!bookmarked)}>
            <div className={cx('iconCircle')}><Bookmark size={20} fill={bookmarked ? 'currentColor' : 'none'} /></div>
            <span className={cx('count')}>0</span>
          </button>
          <button className={cx('actionBtn')} onClick={() => document.getElementById('comments').scrollIntoView({ behavior: 'smooth' })}>
            <div className={cx('iconCircle')}><MessageCircle size={20} /></div>
            <span className={cx('count')}>{post.commentCount || 0}</span>
          </button>
          <button className={cx('actionBtn')}>
            <div className={cx('iconCircle')}><Share2 size={20} /></div>
          </button>
          <button className={cx('actionBtn')}>
            <div className={cx('iconCircle')}><Copy size={20} /></div>
          </button>
        </div>

        {/* Breadcrumbs */}
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
            <img src={post.authorAvatar || 'https://i.pravatar.cc/150?img=12'} alt={post.authorName} />
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



        {/* Comments Section */}
        <section id="comments" className={cx('commentsSection')}>
          <h3>Bình luận ({post.commentCount || 0})</h3>

          <form className={cx('commentForm')} onSubmit={handleSubmitComment}>
            <div className="d-flex align-items-center mb-3">
              <div className="bg-light rounded-circle p-2 me-3">
                <User size={20} color="#64748b" />
              </div>
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
            {comments.map(comment => (
              <div key={comment.id} className="w-100 mb-4">
                <div className={cx('commentItem')}>
                  <img src={comment.authorAvatar || 'https://i.pravatar.cc/150?img=12'} alt="Avatar" className={cx('avatar')} />
                  <div className={cx('contentBox')}>
                    <div className={cx('commentMeta')}>
                      <span className={cx('authorName')}>{comment.authorName}</span>
                      <span className={cx('time')}>{new Date(comment.createdAt).toLocaleString('vi-VN')}</span>
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
                      {user && user.id === comment.userId && (
                        <>
                          <button onClick={() => {
                            setEditingCommentId(comment.id);
                            setEditContent(comment.content);
                          }}>Sửa</button>
                          <button onClick={() => handleDeleteComment(comment.id)}>Xóa</button>
                        </>
                      )}
                    </div>

                    {replyingToId === comment.id && (
                      <div className="mt-3">
                        <textarea 
                          className="form-control mb-2" 
                          placeholder="Viết câu trả lời..."
                          value={replyContent} 
                          onChange={(e) => setReplyContent(e.target.value)}
                        />
                        <button className="btn btn-primary btn-sm me-2" onClick={() => handleReply(comment.id)}>Gửi</button>
                        <button className="btn btn-light btn-sm" onClick={() => setReplyingToId(null)}>Hủy</button>
                      </div>
                    )}
                  </div>
                </div>

                {comment.replies && comment.replies.length > 0 && (
                  <div className={cx('replyList')}>
                    {comment.replies.map(reply => (
                      <div key={reply.id} className={cx('commentItem')}>
                        <img src={reply.authorAvatar || 'https://i.pravatar.cc/150?img=12'} alt="Avatar" className={cx('avatar')} />
                        <div className={cx('contentBox')}>
                          <div className={cx('commentMeta')}>
                            <span className={cx('authorName')}>
                              {reply.authorName}
                              {reply.userId === post.userId && <span className={cx('opTag')}>Tác giả</span>}
                            </span>
                            <span className={cx('time')}>{new Date(reply.createdAt).toLocaleString('vi-VN')}</span>
                          </div>
                          
                          {editingCommentId === reply.id ? (
                            <div className="mt-2">
                              <textarea 
                                className="form-control mb-2" 
                                value={editContent} 
                                onChange={(e) => setEditContent(e.target.value)}
                              />
                              <button className="btn btn-primary btn-sm me-2" onClick={() => handleUpdateComment(reply.id)}>Lưu</button>
                              <button className="btn btn-light btn-sm" onClick={() => setEditingCommentId(null)}>Hủy</button>
                            </div>
                          ) : (
                            <p className={cx('text')}>{reply.content}</p>
                          )}

                          <div className={cx('actions')}>
                            {user && user.id === reply.userId && (
                              <>
                                <button onClick={() => {
                                  setEditingCommentId(reply.id);
                                  setEditContent(reply.content);
                                }}>Sửa</button>
                                <button onClick={() => handleDeleteComment(reply.id)}>Xóa</button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Related Posts Slider */}
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
    </div>
  );
}

export default PostDetailPage;
