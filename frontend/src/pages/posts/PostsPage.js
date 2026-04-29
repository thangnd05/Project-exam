import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import { Search, Eye, Heart, MessageCircle, Clock, ChevronLeft, ChevronRight, ArrowRight, Plus } from 'lucide-react';
import { getPosts, getCategories } from '~/api/postApi';
import routes from '~/config/Routes';
import CreatePostModal from '~/components/modals/CreatePostModal';
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        const [catsData, postsData] = await Promise.all([
          getCategories(),
          getPosts({ page: 0, size: 10 })
        ]);
        
        setCategories(catsData || []);

        if (postsData.content) {
          setPosts(postsData.content);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setPosts([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  const refreshPosts = async () => {
    try {
      const postsData = await getPosts({ page: 0, size: 10 });
      if (postsData.content && postsData.content.length > 0) {
        setPosts(postsData.content);
      }
    } catch (error) {
      console.error('Failed to refresh posts:', error);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesCategory = !selectedCategory || 
      post.categories?.some(c => c.id === selectedCategory);
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredPost = filteredPosts[0] || posts[0];
  const otherPosts = filteredPosts.filter(p => p.id !== featuredPost?.id);

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
        {featuredPost && (
          <div className={cx('hero')}>
            <div className={cx('heroImageWrapper')}>
              <div className={cx('featuredBadge')}>Bài nổi bật</div>
              <img src={featuredPost.thumbnail || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'} alt={featuredPost.title} />
            </div>
            <div className={cx('heroContent')}>
              <span className={cx('categoryTag')}>{featuredPost.categories?.[0]?.name || 'Blog'}</span>
              <h2 onClick={() => navigate(routes.postDetail.replace(':postId', featuredPost.id))}>
                {featuredPost.title}
              </h2>
              <p className={cx('excerpt')}>{featuredPost.summary || 'Nhấp vào để đọc chi tiết bài viết hấp dẫn này...'}</p>
              <div className={cx('authorMeta')}>
                <div className={cx('authorInfo')}>
                  <img src={featuredPost.authorAvatar || 'https://i.pravatar.cc/150?img=12'} alt={featuredPost.authorName} />
                  <div className={cx('nameDate')}>
                    <span>{featuredPost.authorName}</span>
                    <span>{new Date(featuredPost.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
                <button 
                  className={cx('readMore')}
                  onClick={() => navigate(routes.postDetail.replace(':postId', featuredPost.id))}
                >
                  Đọc thêm <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

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
          <div className={cx('searchActions')}>
            <div className={cx('searchBox')}>
              <Search className={cx('searchIcon')} size={18} />
              <input 
                type="text" 
                placeholder="Tìm bài viết..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className={cx('createBtn')} onClick={() => setShowCreateModal(true)}>
              <Plus size={18} />
              <span>Tạo bài viết</span>
            </button>
          </div>
        </div>

        {/* Post Grid */}
        <div className={cx('postGrid')}>
          {otherPosts.map(post => (
            <div 
              key={post.id} 
              className={cx('postCard')}
              onClick={() => navigate(routes.postDetail.replace(':postId', post.id))}
            >
              <div className={cx('thumbnail')}>
                <div className={cx('cardCategory', getCategoryStyles(post.categories?.[0]?.name))}>
                  {post.categories?.[0]?.name || 'Blog'}
                </div>
                <img src={post.thumbnail || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'} alt={post.title} />
              </div>
              <div className={cx('cardContent')}>
                <div className={cx('cardMeta')}>
                  <Clock size={14} />
                  <span>{new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
                <h3>{post.title}</h3>
                <p className={cx('cardExcerpt')}>{post.summary || post.title}</p>
                <div className={cx('cardFooter')}>
                  <div className={cx('author')}>
                    <img src={post.authorAvatar || 'https://i.pravatar.cc/150?img=12'} alt={post.authorName} />
                    <span>{post.authorName}</span>
                  </div>
                  <div className={cx('stats')}>
                    <span><Eye size={14} /> 0</span>
                    <span><Heart size={14} /> {post.totalReacts || 0}</span>
                    <span><MessageCircle size={14} /> {post.commentCount || 0}</span>
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

        {/* Create Post Modal */}
        <CreatePostModal 
          show={showCreateModal} 
          onClose={() => setShowCreateModal(false)}
          onRefresh={refreshPosts}
          categories={categories}
        />

      </div>
    </div>
  );
}

export default PostsPage;
