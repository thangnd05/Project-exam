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
import { getPosts, getPostById, getComments, addComment, getReacts, toggleReact } from '~/api/postApi';

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

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const comment = {
      id: Date.now(),
      authorName: user?.userName || 'Khách',
      authorAvatar: user?.avatarUrl || 'https://i.pravatar.cc/150?img=12',
      text: newComment,
      time: 'Vừa xong',
      likes: 0,
      replies: []
    };
    setComments([comment, ...comments]);
    setNewComment('');
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
              <div key={comment.id} className="w-100">
                <div className={cx('commentItem')}>
                  <img src={comment.authorAvatar} alt="Avatar" className={cx('avatar')} />
                  <div className={cx('contentBox')}>
                    <div className={cx('commentMeta')}>
                      <span className={cx('authorName')}>{comment.authorName}</span>
                      <span className={cx('time')}>{comment.time}</span>
                    </div>
                    <p className={cx('text')}>{comment.text}</p>
                    <div className={cx('actions')}>
                      <button><ThumbsUp size={14} /> {comment.likes}</button>
                      <button>Trả lời</button>
                    </div>
                  </div>
                </div>

                {comment.replies.length > 0 && (
                  <div className={cx('replyList')}>
                    {comment.replies.map(reply => (
                      <div key={reply.id} className={cx('commentItem')}>
                        <img src={reply.authorAvatar} alt="Avatar" className={cx('avatar')} />
                        <div className={cx('contentBox')}>
                          <div className={cx('commentMeta')}>
                            <span className={cx('authorName')}>
                              {reply.authorName}
                              {reply.isAuthor && <span className={cx('opTag')}>Tác giả</span>}
                            </span>
                            <span className={cx('time')}>{reply.time}</span>
                          </div>
                          <p className={cx('text')}>{reply.text}</p>
                          <div className={cx('actions')}>
                            <button>Trả lời</button>
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
