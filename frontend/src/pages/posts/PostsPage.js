import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import { Search, Eye, Heart, MessageCircle, Clock, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { getPosts, getCategories } from '~/api/postApi';
import routes from '~/config/Routes';
import styles from './posts.module.scss';

const cx = classNames.bind(styles);

const MOCK_FEATURED = {
  id: 'mock-featured',
  title: 'Chiến lược ôn thi TOEIC 750+ hiệu quả cho người bận rộn',
  summary: 'Làm thế nào để đạt điểm cao trong kỳ thi TOEIC mà vẫn cân bằng được công việc và học tập? Khám phá lộ trình 3 tháng được thiết kế riêng cho các chuyên viên đang đi làm...',
  categoryName: 'Kinh nghiệm ôn thi',
  authorName: 'Nguyễn Văn An',
  authorAvatar: 'https://i.pravatar.cc/150?img=11',
  thumbnailUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
  createdAt: '2024-10-15T08:00:00Z',
  readTime: '12 phút đọc',
};

const MOCK_POSTS = [
  {
    id: 'mock-1',
    title: '10 lỗi thường gặp khi làm bài thi trắc nghiệm IT online',
    summary: 'Những sai sót ngớ ngẩn nhất có thể khiến bạn mất điểm oan trong kỳ thi chứng chỉ quốc tế.',
    categoryName: 'Lập trình',
    authorName: 'Lê Thu Hà',
    authorAvatar: 'https://i.pravatar.cc/150?img=1',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    createdAt: '2024-10-12T08:00:00Z',
    readTime: '5 phút đọc',
    views: '1.2k',
    likes: 64,
    comments: 12,
  },
  {
    id: 'mock-2',
    title: 'Bí quyết tự học JLPT N3 trong vòng 6 tháng từ con số 0',
    summary: 'Chia sẻ lộ trình chi tiết và giáo trình cần thiết để chinh phục tiếng Nhật trình độ trung cấp.',
    categoryName: 'Ngoại ngữ',
    authorName: 'Trần Minh Đức',
    authorAvatar: 'https://i.pravatar.cc/150?img=2',
    thumbnailUrl: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    createdAt: '2024-10-10T08:00:00Z',
    readTime: '8 phút đọc',
    views: '2.5k',
    likes: 156,
    comments: 45,
  },
  {
    id: 'mock-3',
    title: 'Tổng hợp 50 đề thi thử THPT Quốc gia môn Toán năm 2024',
    summary: 'Bộ tài liệu được tuyển chọn từ các trường chuyên danh tiếng trên cả nước có đáp án chi tiết.',
    categoryName: 'Tài liệu',
    authorName: 'Phạm Mai Chi',
    authorAvatar: 'https://i.pravatar.cc/150?img=3',
    thumbnailUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    createdAt: '2024-10-08T08:00:00Z',
    readTime: '12 phút đọc',
    views: '4.8k',
    likes: 320,
    comments: 89,
  },
  {
    id: 'mock-4',
    title: 'Học ReactJS từ cơ bản đến nâng cao: Lộ trình cho năm 2025',
    summary: 'Tại sao React vẫn là thư viện frontend số 1 và bạn cần chuẩn bị những gì để bắt đầu?',
    categoryName: 'Lập trình',
    authorName: 'EdTech Team',
    authorAvatar: 'https://i.pravatar.cc/150?img=4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    createdAt: '2024-10-05T08:00:00Z',
    readTime: '15 phút đọc',
    views: '3.1k',
    likes: 212,
    comments: 34,
  },
  {
    id: 'mock-5',
    title: 'Cách xây dựng nhóm học tập hiệu quả giúp cùng nhau tiến bộ',
    summary: 'Học một mình có thể nhanh nhưng học cùng nhau mới có thể đi xa. Những kỹ thuật quản lý nhóm học tập...',
    categoryName: 'Chia sẻ',
    authorName: 'Vũ Hoàng Nam',
    authorAvatar: 'https://i.pravatar.cc/150?img=5',
    thumbnailUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    createdAt: '2024-10-03T08:00:00Z',
    readTime: '6 phút đọc',
    views: '1.8k',
    likes: 92,
    comments: 16,
  },
  {
    id: 'mock-6',
    title: 'Phương pháp Pomodoro: Bí quyết học tập 10 tiếng không mệt',
    summary: 'Làm thế nào để duy trì sự tập trung cao độ trong các kỳ ôn thi căng thẳng bằng phương pháp quản lý thời gian...',
    categoryName: 'Kinh nghiệm ôn thi',
    authorName: 'Đặng Minh Hạnh',
    authorAvatar: 'https://i.pravatar.cc/150?img=6',
    thumbnailUrl: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
    createdAt: '2024-10-01T08:00:00Z',
    readTime: '10 phút đọc',
    views: '5.6k',
    likes: 402,
    comments: 112,
  },
];

function PostsPage() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        const [catsData, postsData] = await Promise.all([
          getCategories(),
          getPosts({ page: 0, size: 10 })
        ]);
        
        setCategories(catsData && catsData.length > 0 ? catsData : [
          { id: '1', name: 'Lập trình' },
          { id: '2', name: 'Ngoại ngữ' },
          { id: '3', name: 'Kinh nghiệm ôn thi' },
          { id: '4', name: 'Tài liệu' },
          { id: '5', name: 'Chia sẻ' },
        ]);

        if (postsData.content && postsData.content.length > 0) {
          setPosts(postsData.content);
        } else {
          setPosts(MOCK_POSTS);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setPosts(MOCK_POSTS);
        setCategories([
          { id: '1', name: 'Lập trình' },
          { id: '2', name: 'Ngoại ngữ' },
          { id: '3', name: 'Kinh nghiệm ôn thi' },
          { id: '4', name: 'Tài liệu' },
          { id: '5', name: 'Chia sẻ' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  const filteredPosts = posts.filter(post => {
    const matchesCategory = !selectedCategory || 
      (categories.find(c => c.id === selectedCategory)?.name === post.categoryName);
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryStyles = (categoryName) => {
    switch (categoryName) {
      case 'Lập trình': return 'bg-blue-50 text-blue-700';
      case 'Ngoại ngữ': return 'bg-green-50 text-green-700';
      case 'Kinh nghiệm ôn thi': return 'bg-pink-50 text-pink-700';
      case 'Tài liệu': return 'bg-orange-50 text-orange-700';
      case 'Chia sẻ': return 'bg-purple-50 text-purple-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    <div className={cx('wrapper')}>
      <div className={cx('container')}>
        
        {/* Hero Section */}
        <div className={cx('hero')}>
          <div className={cx('heroImageWrapper')}>
            <div className={cx('featuredBadge')}>Bài nổi bật</div>
            <img src={MOCK_FEATURED.thumbnailUrl} alt={MOCK_FEATURED.title} />
          </div>
          <div className={cx('heroContent')}>
            <span className={cx('categoryTag')}>{MOCK_FEATURED.categoryName}</span>
            <h2 onClick={() => navigate(routes.postDetail.replace(':postId', MOCK_FEATURED.id))}>
              {MOCK_FEATURED.title}
            </h2>
            <p className={cx('excerpt')}>{MOCK_FEATURED.summary}</p>
            <div className={cx('authorMeta')}>
              <div className={cx('authorInfo')}>
                <img src={MOCK_FEATURED.authorAvatar} alt={MOCK_FEATURED.authorName} />
                <div className={cx('nameDate')}>
                  <span>{MOCK_FEATURED.authorName}</span>
                  <span>15/10/2024 • 12 phút đọc</span>
                </div>
              </div>
              <button 
                className={cx('readMore')}
                onClick={() => navigate(routes.postDetail.replace(':postId', MOCK_FEATURED.id))}
              >
                Đọc thêm <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className={cx('filterBar')}>
          <div className={cx('filterPills')}>
            <button 
              className={cx('pill', { active: !selectedCategory })}
              onClick={() => setSelectedCategory(null)}
            >
              Tất cả
            </button>
            {categories.map(cat => (
              <button 
                key={cat.id}
                className={cx('pill', { active: selectedCategory === cat.id })}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
          <div className={cx('searchBox')}>
            <Search className={cx('searchIcon')} size={18} />
            <input 
              type="text" 
              placeholder="Tìm bài viết..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Post Grid */}
        <div className={cx('postGrid')}>
          {filteredPosts.map(post => (
            <div 
              key={post.id} 
              className={cx('postCard')}
              onClick={() => navigate(routes.postDetail.replace(':postId', post.id))}
            >
              <div className={cx('thumbnail')}>
                <div className={cx('cardCategory', getCategoryStyles(post.categoryName))}>
                  {post.categoryName}
                </div>
                <img src={post.thumbnailUrl} alt={post.title} />
              </div>
              <div className={cx('cardContent')}>
                <div className={cx('cardMeta')}>
                  <Clock size={14} />
                  <span>{new Date(post.createdAt).toLocaleDateString('vi-VN')} • {post.readTime || '5 phút đọc'}</span>
                </div>
                <h3>{post.title}</h3>
                <p className={cx('cardExcerpt')}>{post.summary}</p>
                <div className={cx('cardFooter')}>
                  <div className={cx('author')}>
                    <img src={post.authorAvatar || 'https://i.pravatar.cc/150?img=12'} alt={post.authorName} />
                    <span>{post.authorName}</span>
                  </div>
                  <div className={cx('stats')}>
                    <span><Eye size={14} /> {post.views || '0'}</span>
                    <span><Heart size={14} /> {post.likes || 0}</span>
                    <span><MessageCircle size={14} /> {post.comments || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className={cx('pagination')}>
          <button className={cx('pageBtn')}><ChevronLeft size={20} /></button>
          <button className={cx('pageBtn', 'active')}>1</button>
          <button className={cx('pageBtn')}>2</button>
          <button className={cx('pageBtn')}>3</button>
          <button className={cx('pageBtn', 'disabled')}>...</button>
          <button className={cx('pageBtn')}>12</button>
          <button className={cx('pageBtn')}><ChevronRight size={20} /></button>
        </div>

      </div>
    </div>
  );
}

export default PostsPage;
