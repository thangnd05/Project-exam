import React, {useState} from 'react';
import {motion} from 'framer-motion';
import {FaStar} from 'react-icons/fa';
import classNames from 'classnames/bind';
import styles from './evaluation.module.scss';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import {toast} from 'react-toastify';
import {useAuth} from '~/hooks/useAuth';
import {useNavigate} from 'react-router-dom';
import routes from '~/config/Routes';
import EvaluationModal from './modals/EvaluationModal';
import {useEvaluations} from './hooks/useEvaluations';

const cx = classNames.bind(styles);

const fadeUp = {
  hidden: {opacity: 0, y: 24},
  visible: {
    opacity: 1,
    y: 0,
    transition: {duration: 0.7, ease: [0.22, 1, 0.36, 1]},
  },
};

const Evaluation = () => {
  const {user} = useAuth();
  const navigate = useNavigate();

  // --- STATE ---
  const [showModal, setShowModal] = useState(false);

  // --- FETCH DATA ---
  const {reviews, loading, refetchEvaluations} = useEvaluations();

  // --- LOGIC ---
  const showDots = reviews.length > 0 && reviews.length < 3;

  const settings = {
    dots: showDots,
    infinite: reviews.length > 3,
    speed: 500,
    slidesToShow: Math.min(3, reviews.length > 0 ? reviews.length : 3),
    slidesToScroll: showDots ? 1 : 1,
    autoplay: reviews.length > 3,
    autoplaySpeed: 3000,
    pauseOnHover: true,
    arrows: reviews.length > 3 && !showDots,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: Math.min(2, reviews.length > 0 ? reviews.length : 2),
          slidesToScroll: 1,
        },
      },
      {
        // Điện thoại (≤768px): xem từng card một cho dễ đọc.
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  const handleWriteReviewClick = () => {
    if (!user) {
      toast.warning(' Bạn cần đăng nhập để gửi đánh giá!');
      navigate(routes.login);
      return;
    }
    setShowModal(true);
  };

  const handleReviewSuccess = () => {
    refetchEvaluations(); // Refresh list
  };

  // Lấy 1-2 chữ cái đầu tên để làm avatar (khi không có ảnh)
  const getInitials = (name) => {
    if (!name) return '?';
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Dạng số gọn (20/05/2026) để không bị xuống nhiều dòng trong card hẹp.
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  if (loading) {
    return <div className="text-center py-5">Đang tải đánh giá...</div>;
  }

  return (
    <section className={cx('section', 'reviews-section')}>
      <div className="container">
        <motion.div
          className={cx('sectionHead')}
          initial="hidden"
          whileInView="visible"
          viewport={{once: true, amount: 0.5}}
          variants={fadeUp}
        >
          <div className={cx('sectionHead-text')}>
            <h2 className={cx('section-title')}>Người dùng nói gì về WinDe?</h2>
            <p className={cx('section-subtitle')}>
              Niềm tin được khẳng định qua kết quả thực tế
            </p>
          </div>
          <button
            className={cx('btn-write-review', 'btn-write-review--head')}
            onClick={handleWriteReviewClick}
          >
            Viết đánh giá
          </button>
        </motion.div>

        {reviews.length > 0 ? (
          <motion.div
            className={cx('slider-container')}
            initial={{opacity: 0, y: 30}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true, amount: 0.2}}
            transition={{duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1]}}
          >
            <Slider {...settings}>
              {Array.isArray(reviews) &&
                reviews.map((review) => (
                  <div key={review.id} className={cx('slide-item')}>
                    <div className={cx('review-card')}>
                      <div className={cx('stars')}>
                        {[...Array(5)].map((_, i) => (
                          <FaStar
                            key={i}
                            className={
                              i < review.rating
                                ? cx('star-filled')
                                : cx('star-empty')
                            }
                          />
                        ))}
                      </div>
                      <p className={cx('review-content')}>"{review.content}"</p>
                      <div className={cx('review-footer')}>
                        {review.avatarUrl ? (
                          <img
                            src={review.avatarUrl}
                            alt={review.username}
                            className={cx('avatar')}
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className={cx('avatar', 'avatar-initials')}>
                            {getInitials(review.username)}
                          </div>
                        )}
                        <div className={cx('user-info')}>
                          <h4 className={cx('user-name')}>{review.username}</h4>
                          <span className={cx('user-role')}>
                            {formatDate(review.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </Slider>
          </motion.div>
        ) : (
          <div className="text-center text-muted mb-5">
            Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá!
          </div>
        )}

        {/* Responsive: trên mobile nút nằm DƯỚI card đánh giá (desktop dùng nút ở header). */}
        <div className={cx('write-review-below')}>
          <button
            className={cx('btn-write-review')}
            onClick={handleWriteReviewClick}
          >
            Viết đánh giá
          </button>
        </div>
      </div>

      {/* --- MODAL (POPUP) --- */}
      <EvaluationModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleReviewSuccess}
      />
    </section>
  );
};

export default Evaluation;
