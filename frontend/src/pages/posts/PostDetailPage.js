import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import { 
  Heart, Bookmark, MessageCircle, Share2, Facebook, Linkedin, 
  Link2, ChevronRight, Copy, Check, ThumbsUp, MoreHorizontal, User,
  Send
} from 'lucide-react';
import { getPostById, getComments, addComment, getReacts, toggleReact } from '~/api/postApi';
import { useAuth } from '~/hook/useAuth';
import routes from '~/config/Routes';
import styles from './PostDetailPage.module.scss';
import { Button } from 'react-bootstrap';

const cx = classNames.bind(styles);

const MOCK_DETAIL = {
  id: 'featured-1',
  title: 'Chiến lược ôn thi TOEIC 750+ trong 2 tháng cho người mất gốc',
  excerpt: '“Lộ trình chi tiết từ việc hệ thống lại ngữ pháp cơ bản đến các kỹ năng làm bài Reading & Listening chuyên sâu để đạt mục tiêu 750+.”',
  categoryName: 'Kinh nghiệm ôn thi',
  authorName: 'Hà My',
  authorAvatar: 'https://i.pravatar.cc/150?img=5',
  authorBio: 'Chuyên gia đào tạo TOEIC với hơn 5 năm kinh nghiệm. Đạt 990/990 TOEIC và 8.5 IELTS. Hiện đang là giảng viên cao cấp tại EdTech Proctor, chuyên hỗ trợ sinh viên chinh phục các chứng chỉ quốc tế.',
  createdAt: '15 Tháng 5, 2024',
  readTime: '8 min read',
  views: '4.2k',
  likes: 1200,
  commentCount: 86,
  content: `
    <p>Đạt được mức điểm 750+ TOEIC không phải là một nhiệm vụ bất khả thi, ngay cả khi bạn bắt đầu từ con số 0. Chìa khóa nằm ở việc phân bổ thời gian hợp lý và nắm vững các "bẫy" thường gặp trong đề thi. Trong bài viết này, mình sẽ chia sẻ lộ trình mà mình đã áp dụng cho hàng trăm học viên tại EdTech Proctor.</p>
    
    <h2>Giai đoạn 1: Xây dựng nền tảng (Tuần 1-3)</h2>
    <p>Đừng vội vã giải đề ngay lập tức. Hãy dành 3 tuần đầu tiên để củng cố 12 thì trong tiếng Anh và từ vựng thuộc 50 chủ đề phổ biến nhất của TOEIC như Office, Travel, Banking, và Healthcare.</p>
    
    <blockquote>"Học TOEIC không phải là học mẹo, mà là học cách sử dụng ngôn ngữ trong môi trường làm việc quốc tế chuyên nghiệp."</blockquote>
    
    <h3>Kỹ thuật luyện nghe Shadowing</h3>
    <p>Một trong những phương pháp hiệu quả nhất để cải thiện Listening là Shadowing. Bạn hãy nghe một đoạn hội thoại ngắn và lặp lại ngay lập tức với cùng tốc độ và ngữ điệu của người nói.</p>
    
    <ul>
      <li><b>Part 1 & 2:</b> Tập trung vào các từ khóa nghi vấn (Who, Where, When, Why).</li>
      <li><b>Part 3 & 4:</b> Đọc trước câu hỏi và các lựa chọn để dự đoán nội dung.</li>
      <li><b>Reading:</b> Quản lý thời gian là yếu tố sống còn. Bạn chỉ có trung bình 30 giây cho mỗi câu ở Part 5.</li>
    </ul>

    <img src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" alt="Learning context" />
    <span class="${cx('imgCaption')}">Không gian học tập yên tĩnh giúp tăng 40% hiệu quả tập trung.</span>

    <h2>Mẫu cấu trúc câu hay gặp</h2>
  `
};

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
        isAuthor: true
      }
    ]
  },
  {
    id: 'c2',
    authorName: 'Linh Chi',
    authorAvatar: 'https://i.pravatar.cc/150?img=32',
    text: 'Mục tiêu của mình là 800, đọc xong bài này thấy tự tin hơn hẳn. Cảm ơn chị My!',
    time: '5 giờ trước',
    likes: 4,
    replies: []
  }
];

const MOCK_RELATED = [
  { id: 'rel-1', title: 'Top 5 giáo trình TOEIC "gối đầu giường" năm 2024', category: 'TÀI LIỆU', date: '10 Tháng 5', readTime: '5 min read', img: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=400&q=80' },
  { id: 'rel-2', title: 'Làm sao để không bị "bẫy" trong Reading Part 7?', category: 'KỸ NĂNG', date: '8 Tháng 5', readTime: '12 min read', img: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=400&q=80' },
  { id: 'rel-3', title: 'Bí kíp đạt 450+ Listening chỉ sau 30 ngày tập trung', category: 'LỘ TRÌNH', date: '5 Tháng 5', readTime: '7 min read', img: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=400&q=80' },
];

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
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPost = async () => {
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
      } catch (error) {
        console.error('Failed to fetch post:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [postId]);


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
          <p className={cx('excerptDetail')}>{post.summary || post.title}</p>
        </header>

        <div className={cx('metaRow')}>
          <div className={cx('authorSide')}>
            <img src={post.authorAvatar || 'https://i.pravatar.cc/150?img=12'} alt={post.authorName} />
            <div className={cx('authorInfo')}>
              <Link to="#">{post.authorName}</Link>
            </div>
          </div>
          <div className={cx('metaSide')}>
            {new Date(post.createdAt).toLocaleDateString('vi-VN')} • 5 min read • 0 views
          </div>
        </div>

        <article className={cx('articleBody')}>
          <div dangerouslySetInnerHTML={{ __html: post.content }} />

          <pre>
{`// Cấu trúc câu điều kiện loại 2 trong Reading Part 5
If + S + V2/ed, S + would/could + V-inf

Example:
If the manager were here,
he would sign the contract immediately.`}
            <button className={cx('copyBtn')} onClick={handleCopyCode}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </pre>

          <p>Hãy nhớ rằng sự kiên trì là quan trọng nhất. Mỗi ngày chỉ cần dành ra 90 phút tập trung cao độ, bạn sẽ thấy sự khác biệt rõ rệt sau 2 tháng. Chúc các bạn sớm đạt được mức điểm mong muốn!</p>
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

        {/* Related Posts */}
        <section className={cx('relatedPosts')}>
          <h3>Bài viết liên quan</h3>
          <div className={cx('grid')}>
            {MOCK_RELATED.map(rel => (
              <div key={rel.id} className={cx('relatedCard')} onClick={() => navigate(routes.postDetail.replace(':postId', rel.id))}>
                <div className={cx('imgWrap')}>
                  <img src={rel.img} alt={rel.title} />
                </div>
                <span className="text-primary fw-bold small mb-2 d-block">{rel.category}</span>
                <h4>{rel.title}</h4>
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
