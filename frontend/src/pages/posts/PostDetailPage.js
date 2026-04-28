import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import { 
  Heart, Bookmark, MessageCircle, Share2, Facebook, Linkedin, 
  Link2, ChevronRight, Copy, Check, ThumbsUp, MoreHorizontal, User,
  ArrowRight
} from 'lucide-react';
import { getPostById, getComments, addComment, getReacts, toggleReact } from '~/api/postApi';
import { useAuth } from '~/hook/useAuth';
import routes from '~/config/Routes';
import styles from './posts.module.scss';

const cx = classNames.bind(styles);

const MOCK_DETAIL = {
  id: 'featured-1',
  title: 'Chiến lược ôn thi TOEIC 750+ trong 2 tháng cho người mất gốc',
  excerpt: 'Lộ trình chi tiết từ việc hệ thống lại ngữ pháp cơ bản đến các kỹ năng làm bài Reading & Listening chuyên sâu.',
  categoryName: 'Kinh nghiệm ôn thi',
  authorName: 'Hà My',
  authorTitle: 'Cựu sinh viên ĐHNN ĐHQGHN, 8.5 IELTS, 990 TOEIC',
  authorAvatar: 'https://i.pravatar.cc/150?img=5',
  authorBio: 'Chuyên gia đào tạo TOEIC với hơn 5 năm kinh nghiệm. Đã giúp hàng ngàn học viên chinh phục mục tiêu 750+ chỉ trong thời gian ngắn.',
  createdAt: '15 Tháng 5, 2024',
  readTime: '12 phút đọc',
  views: '4.2k',
  likes: 1200,
  commentCount: 24,
  coverImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
  coverCaption: 'Không gian học tập yên tĩnh giúp tăng 40% hiệu quả tập trung.',
};

const MOCK_RELATED = [
  { id: 'rel-1', title: 'Top 5 giáo trình TOEIC "gối đầu giường" năm 2024', category: 'Tài liệu', date: '10 Tháng 5', readTime: '5 min read', img: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=400&q=80' },
  { id: 'rel-2', title: 'Làm sao để không bị "bẫy" trong Reading Part 7?', category: 'Kỹ năng', date: '8 Tháng 5', readTime: '12 min read', img: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=400&q=80' },
  { id: 'rel-3', title: 'Bí kíp đạt 450+ Listening chỉ sau 30 ngày tập trung', category: 'Lộ trình', date: '5 Tháng 5', readTime: '7 min read', img: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=400&q=80' },
];

const MOCK_COMMENTS = [
  {
    id: 'c1',
    authorName: 'Nguyễn Tuấn Anh',
    authorAvatar: 'https://i.pravatar.cc/150?img=11',
    text: 'Bài viết cực kỳ chi tiết ạ. Em đang bị mất gốc phần Listening, đặc biệt là Part 3. Chị có thể chia sẻ thêm tài liệu luyện tập phương pháp Shadowing không ạ?',
    time: '2 giờ trước',
    likes: 12,
    replies: [
      {
        id: 'r1',
        authorName: 'Hà My',
        authorAvatar: 'https://i.pravatar.cc/150?img=5',
        text: 'Chào Tuấn Anh, em có thể tìm bộ "Longman New Real TOEIC" - bộ này có phần nghe rất chuẩn để shadowing nhé. Chúc em học tốt!',
        time: '1 giờ trước',
        likes: 5,
      },
      {
        id: 'r2',
        authorName: 'Lê Minh',
        authorAvatar: 'https://i.pravatar.cc/150?img=8',
        text: 'Mình cũng đang học theo bộ đó, công nhận hiệu quả thật.',
        time: '30 phút trước',
        likes: 2,
      }
    ]
  },
  {
    id: 'c2',
    authorName: 'Linh Chi',
    authorAvatar: 'https://i.pravatar.cc/150?img=32',
    text: 'Mục tiêu của mình là 800, đọc xong bài này thấy tự tin hơn hẳn. Cảm ơn chị My!',
    time: '5 giờ trước',
    likes: 8,
    replies: []
  }
];

function PostDetailPage() {
  const { postId } = useParams();
  const { user } = useAuth();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState(MOCK_COMMENTS);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCopyCode = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLike = () => {
    setLiked(!liked);
    // Animation logic handled by CSS class
  };

  const handleBookmark = () => {
    setBookmarked(!bookmarked);
    if (!bookmarked) {
      alert('Đã lưu bài viết vào danh sách của bạn!');
    }
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

  return (
    <div className={cx('wrapperDetail')}>
      <div className={cx('progressBar')} style={{ width: `${scrollProgress}%` }} />

      <div className={cx('containerDetail')}>
        
        {/* Floating Action Bar */}
        <div className={cx('floatingBar')}>
          <button 
            className={cx('actionBtn', { active: liked })} 
            onClick={handleLike}
          >
            <Heart size={20} fill={liked ? 'currentColor' : 'none'} className={liked ? cx('animate') : ''} />
            <span className={cx('count')}>{MOCK_DETAIL.likes + (liked ? 1 : 0)}</span>
          </button>
          
          <button 
            className={cx('actionBtn', { active: bookmarked })} 
            onClick={handleBookmark}
          >
            <Bookmark size={20} fill={bookmarked ? 'currentColor' : 'none'} />
          </button>

          <button 
            className={cx('actionBtn')} 
            onClick={() => document.getElementById('comments').scrollIntoView({ behavior: 'smooth' })}
          >
            <MessageCircle size={20} />
            <span className={cx('count')}>{MOCK_DETAIL.commentCount}</span>
          </button>

          <div className="position-relative">
            <button className={cx('actionBtn')} onClick={() => setShowShare(!showShare)}>
              <Share2 size={20} />
            </button>
            {showShare && (
              <div className={cx('sharePopup')}>
                <button><Facebook size={16} /> Facebook</button>
                <button><Linkedin size={16} /> LinkedIn</button>
                <button onClick={() => { navigator.clipboard.writeText(window.location.href); setShowShare(false); }}>
                  <Link2 size={16} /> Copy link
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Breadcrumbs */}
        <div className={cx('breadcrumbs')}>
          <Link to={routes.home}>Trang chủ</Link>
          <ChevronRight size={14} />
          <Link to={routes.posts}>Blog</Link>
          <ChevronRight size={14} />
          <Link to="#">{MOCK_DETAIL.categoryName}</Link>
          <ChevronRight size={14} />
          <span className={cx('current')}>Chiến lược ôn thi TOEIC 750+</span>
        </div>

        <header className={cx('articleHeader')}>
          <span className={cx('categoryPill')}>{MOCK_DETAIL.categoryName}</span>
          <h1>{MOCK_DETAIL.title}</h1>
          <p className={cx('excerpt')}>{MOCK_DETAIL.excerpt}</p>
        </header>

        <div className={cx('metaRow')}>
          <div className={cx('authorSide')}>
            <img src={MOCK_DETAIL.authorAvatar} alt={MOCK_DETAIL.authorName} />
            <div className={cx('authorInfo')}>
              <Link to="#">{MOCK_DETAIL.authorName}</Link>
              <span>{MOCK_DETAIL.authorTitle}</span>
            </div>
          </div>
          <div className={cx('metaSide')}>
            {MOCK_DETAIL.createdAt} • {MOCK_DETAIL.readTime} • {MOCK_DETAIL.views} lượt xem
          </div>
        </div>

        <div className={cx('coverWrapper')}>
          <img src={MOCK_DETAIL.coverImage} alt="Cover" className={cx('coverImg')} />
          <span className={cx('caption')}>{MOCK_DETAIL.coverCaption}</span>
        </div>

        <article className={cx('articleBody')}>
          <p>Đạt được mức điểm 750+ TOEIC không phải là một nhiệm vụ bất khả thi, ngay cả khi bạn bắt đầu từ con số 0. Chìa khóa nằm ở việc phân bổ thời gian hợp lý và nắm vững các "bẫy" thường gặp trong đề thi. Trong bài viết này, mình sẽ chia sẻ lộ trình mà mình đã áp dụng cho hàng trăm học viên tại EdTech Proctor.</p>

          <h2>Giai đoạn 1: Xây dựng nền tảng (Tuần 1-3)</h2>
          <p>Đừng vội vã giải đề ngay lập tức. Hãy dành 3 tuần đầu tiên để củng cố 12 thì trong tiếng Anh và từ vựng thuộc 50 chủ đề phổ biến nhất của TOEIC như <code>Office</code>, <code>Travel</code>, <code>Banking</code>, và <code>Healthcare</code>.</p>
          
          <blockquote>"Học TOEIC không phải là học mẹo, mà là học cách sử dụng ngôn ngữ trong môi trường làm việc quốc tế chuyên nghiệp."</blockquote>

          <h3>Kỹ thuật luyện nghe Shadowing</h3>
          <p>Một trong những phương pháp hiệu quả nhất để cải thiện Listening là Shadowing. Bạn hãy nghe một đoạn hội thoại ngắn và lặp lại ngay lập tức với cùng tốc độ và ngữ điệu của người nói.</p>
          
          <ul>
            <li><b>Part 1 & 2:</b> Tập trung vào các từ khóa nghi vấn (Who, Where, When, Why).</li>
            <li><b>Part 3 & 4:</b> Đọc trước câu hỏi và các lựa chọn để dự đoán nội dung.</li>
            <li><b>Reading:</b> Quản lý thời gian là yếu tố sống còn. Bạn chỉ có trung bình 30 giây cho mỗi câu ở Part 5.</li>
          </ul>

          <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" alt="Study Group" />

          <h2>Giai đoạn 2: Luyện kỹ năng và chiến thuật</h2>
          <p>Sau khi đã có nền tảng, hãy bắt đầu làm quen với các dạng bài thi. Đừng quên sử dụng phương pháp lặp lại ngắt quãng (Spaced Repetition) để ghi nhớ từ vựng lâu hơn.</p>
          
          <pre>
{`// Lịch học mẫu dạng Pseudo-code
Schedule {
  Morning: "Listening Part 1, 2 (30 mins)",
  Afternoon: "Reading Part 5, 6 (45 mins)",
  Evening: "Review vocabulary & Shadowing (30 mins)",
  Status: "Consistency is key!"
}`}
<button className={cx('copyBtn')} onClick={handleCopyCode}>
  {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
</button>
          </pre>

          <h2>Giai đoạn 3: Luyện đề và chiến thuật phòng thi</h2>
          <p>Hãy dành 2 tuần cuối cùng để giải ít nhất 5 bộ đề thi chính thức. Việc này giúp bạn làm quen với áp lực thời gian và rèn luyện tâm lý vững vàng trước khi bước vào kỳ thi thật.</p>
        </article>

        <div className={cx('tagsSection')}>
          <span>Bài viết được gắn thẻ:</span>
          <Link to="#" className={cx('tagPill')}>#toeic</Link>
          <Link to="#" className={cx('tagPill')}>#on-thi</Link>
          <Link to="#" className={cx('tagPill')}>#kinh-nghiem</Link>
          <Link to="#" className={cx('tagPill')}>#tieng-anh</Link>
        </div>

        {/* Author Card */}
        <div className={cx('authorCard')}>
          <img src={MOCK_DETAIL.authorAvatar} alt="Author" />
          <div className={cx('authorBio')}>
            <h4>{MOCK_DETAIL.authorName}</h4>
            <p>{MOCK_DETAIL.authorBio}</p>
          </div>
          <button className={cx('followBtn')}>Theo dõi</button>
        </div>

        {/* Comments Section */}
        <section id="comments" className={cx('commentsSection')}>
          <h3>Bình luận ({MOCK_DETAIL.commentCount})</h3>
          
          <form className={cx('commentForm')} onSubmit={handleSubmitComment}>
            <img src={user?.avatarUrl || 'https://i.pravatar.cc/150?img=12'} alt="User" />
            <div className={cx('formContent')}>
              <textarea 
                placeholder="Viết bình luận của bạn..." 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <div className={cx('formActions')}>
                <button type="button" className={cx('cancelBtn')} onClick={() => setNewComment('')}>Hủy</button>
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
                      <span>{comment.authorName}</span>
                      <span>{comment.time}</span>
                    </div>
                    <p className={cx('text')}>{comment.text}</p>
                    <div className={cx('actions')}>
                      <button><ThumbsUp size={14} /> {comment.likes}</button>
                      <button>Trả lời</button>
                      <button>Báo cáo</button>
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
                            <span>{reply.authorName}</span>
                            <span>{reply.time}</span>
                          </div>
                          <p className={cx('text')}>{reply.text}</p>
                          <div className={cx('actions')}>
                            <button><ThumbsUp size={14} /> {reply.likes}</button>
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

          <button className={cx('loadMore')}>Tải thêm bình luận</button>
        </section>

        {/* Related Posts */}
        <section className={cx('relatedPosts')}>
          <h3>Bài viết liên quan</h3>
          <div className={cx('grid')}>
            {MOCK_RELATED.map(rel => (
              <div key={rel.id} className={cx('relatedCard')} onClick={() => navigate(routes.postDetail.replace(':postId', rel.id))}>
                <div className={cx('imgWrapper')}>
                  <img src={rel.img} alt={rel.title} />
                  <span className={cx('badge')}>{rel.category}</span>
                </div>
                <h4 className="mt-2">{rel.title}</h4>
                <div className={cx('meta')}>{rel.date} • {rel.readTime}</div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}

export default PostDetailPage;
