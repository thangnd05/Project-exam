'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {motion, type Variants} from 'framer-motion';
import {FaStar} from 'react-icons/fa';
import classNames from 'classnames/bind';
import styles from './Evaluation.module.scss';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import {toast} from 'react-toastify';
import {useAuth} from '@/app/hooks/useAuth';
import routes from '@/app/configs/Routes';
import EvaluationModal from './modals/EvaluationModal';
import {useEvaluations} from './hooks/useEvaluations';
import ButtonPrime from '@/app/components/Button/ButtonPrime';

// Carousel nặng (~40KB) và luôn nằm dưới màn hình đầu — nạp khi render tới.
const Slider = dynamic(() => import('react-slick'), { ssr: false });

const cx = classNames.bind(styles);

const fadeUp: Variants = {
  hidden: {opacity: 0, y: 24},
  visible: {
    opacity: 1,
    y: 0,
    transition: {duration: 0.7, ease: [0.22, 1, 0.36, 1]},
  },
};

const Evaluation = () => {
  const {user} = useAuth();
  const router = useRouter();

  const [showModal, setShowModal] = useState(false);

  const {reviews, isLoading: loading, refetch: refetchEvaluations} = useEvaluations();

  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200,
  );

  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const count = reviews.length || 1;
  let slidesToShow = Math.min(3, count);
  if (windowWidth <= 768) slidesToShow = 1;
  else if (windowWidth <= 1024) slidesToShow = Math.min(2, count);

  const canSlide = reviews.length > slidesToShow;

  const settings = {
    dots: false,
    infinite: canSlide,
    speed: 500,
    slidesToShow,
    slidesToScroll: 1,
    autoplay: canSlide,
    autoplaySpeed: 3000,
    pauseOnHover: true,
    arrows: canSlide && windowWidth > 768,
  };

  const handleWriteReviewClick = () => {
    if (!user) {
      toast.warning(' Bạn cần đăng nhập để gửi đánh giá!');
      router.push(routes.login);
      return;
    }
    setShowModal(true);
  };

  const handleReviewSuccess = () => {
    refetchEvaluations();
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);

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
          <ButtonPrime
            className={cx('btn-write-review', 'btn-write-review--head')}
            onClick={handleWriteReviewClick}
          >
            Viết đánh giá
          </ButtonPrime>
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
                              i < (review.rating ?? 0)
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

        <div className={cx('write-review-below')}>
          <ButtonPrime
            className={cx('btn-write-review')}
            onClick={handleWriteReviewClick}
          >
            Viết đánh giá
          </ButtonPrime>
        </div>
      </div>

      <EvaluationModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleReviewSuccess}
      />
    </section>
  );
};

export default Evaluation;
