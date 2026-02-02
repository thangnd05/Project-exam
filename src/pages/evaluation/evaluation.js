import React, { useState, useEffect } from 'react';
import {
    FaStar, FaQuoteLeft, FaPen, FaTimes, FaInfoCircle
} from 'react-icons/fa';
import classNames from 'classnames/bind';
import styles from './evaluation.module.scss';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import axios from 'axios';
import { useAuth } from '~/hook/useAuth';
import { useNavigate } from 'react-router-dom';
import routes from '~/config/Routes';

const cx = classNames.bind(styles);

const Evaluation = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // --- STATE ---
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form state
    const [userRating, setUserRating] = useState(5);
    const [content, setContent] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // --- FETCH DATA ---
    const fetchReviews = async () => {
        try {
            const response = await axios.get('/api/evaluations');
            // Đảm bảo data trả về là mảng
            if (Array.isArray(response.data)) {
                setReviews(response.data);
            } else {
                console.error('API evaluations returned non-array data:', response.data);
                setReviews([]);
            }
        } catch (error) {
            console.error('Failed to fetch reviews:', error);
            setReviews([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    // --- LOGIC ---
    const showDots = reviews.length > 0 && reviews.length < 15;

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
                    slidesToScroll: 1
                }
            },
            {
                breakpoint: 600,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1
                }
            }
        ]
    };

    const handleWriteReviewClick = () => {
        if (!user) {
            alert('⚠️ Bạn cần đăng nhập để gửi đánh giá!');
            navigate(routes.login);
            return;
        }
        setShowModal(true);
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) {
            alert('Vui lòng nhập nội dung đánh giá');
            return;
        }

        setSubmitting(true);
        try {
            await axios.post('/api/evaluations', {
                content: content,
                rating: userRating
            });
            alert('Cảm ơn bạn đã gửi đánh giá!');
            setShowModal(false);
            setContent('');
            setUserRating(5);
            fetchReviews(); // Refresh list
        } catch (error) {
            console.error('Failed to submit review:', error);
            alert('Gửi đánh giá thất bại. Vui lòng thử lại sau!');
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return <div className="text-center py-5">Đang tải đánh giá...</div>;
    }

    return (
        <section className={cx('section', 'reviews-section')}>
            <div className="container">
                <div className="text-center mb-5">
                    <h2 className={cx('section-title')}>Học viên nói gì về WinDe?</h2>
                    <p className="text-muted">Niềm tin được khẳng định qua kết quả thực tế</p>
                </div>

                {reviews.length > 0 ? (
                    <div className={cx('slider-container')}>
                        <Slider {...settings}>
                            {Array.isArray(reviews) && reviews.map((review) => (
                                <div key={review.id} className={cx('slide-item')}>
                                    <div className={cx('review-card')}>
                                        <div className={cx('quote-icon')}><FaQuoteLeft /></div>
                                        <p className={cx('review-content')}>"{review.content}"</p>
                                        <div className={cx('review-footer')}>
                                            <img
                                                src={review.avatarUrl || 'https://via.placeholder.com/50'}
                                                alt={review.username}
                                                className={cx('avatar')}
                                            />
                                            <div className={cx('user-info')}>
                                                <h4 className={cx('user-name')}>{review.username}</h4>
                                                <span className={cx('user-role')}>
                                                    {formatDate(review.createdAt)}
                                                </span>
                                                <div className={cx('stars')}>
                                                    {[...Array(5)].map((_, i) => (
                                                        <FaStar key={i} className={i < review.rating ? cx('star-filled') : cx('star-empty')} />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </Slider>
                    </div>
                ) : (
                    <div className="text-center text-muted mb-5">
                        Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá!
                    </div>
                )}

                {/* NÚT MỞ MODAL */}
                <div className="text-center mt-4">
                    <button
                        className={cx('btn-write-review')}
                        onClick={handleWriteReviewClick}
                    >
                        <FaPen style={{ marginRight: '8px' }} /> Viết đánh giá của bạn
                    </button>
                </div>
            </div>

            {/* --- MODAL (POPUP) --- */}
            {showModal && (
                <div className={cx('modalOverlay')} onClick={() => setShowModal(false)}>
                    <div className={cx('modalContent')} onClick={(e) => e.stopPropagation()}>
                        {/* HEADER */}
                        <div className={cx('header')}>
                            <div className={cx('titleWrapper')}>
                                <FaPen />
                                <h3 className={cx('title')}>Viết đánh giá</h3>
                            </div>
                            <button className={cx('closeBtn')} onClick={() => setShowModal(false)}>
                                <FaTimes />
                            </button>
                        </div>

                        {/* BODY */}
                        <div className={cx('body')}>
                            <form onSubmit={handleReviewSubmit}>
                                {/* Rating Stars */}
                                <div className={cx('formGroup')}>
                                    <label className={cx('label')}>Mức độ hài lòng</label>
                                    <div className={cx('ratingSelect')}>
                                        {[...Array(5)].map((_, i) => (
                                            <FaStar
                                                key={i}
                                                className={i < userRating ? cx('starActive') : cx('starInactive')}
                                                onClick={() => setUserRating(i + 1)}
                                            />
                                        ))}
                                        <span className={cx('ratingText')}>({userRating}/5 sao)</span>
                                    </div>
                                </div>

                                {/* Input Content */}
                                <div className={cx('formGroup')}>
                                    <label className={cx('label')}>Nội dung chia sẻ</label>
                                    <div className={cx('inputWrapper')}>
                                        <textarea
                                            className={cx('inputControl')}
                                            rows="4"
                                            placeholder="Bạn cảm thấy trải nghiệm ôn thi tại WinDe thế nào?"
                                            required
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                        ></textarea>
                                    </div>
                                    <div className={cx('tip')}>
                                        <FaInfoCircle />
                                        <span>Đánh giá của bạn sẽ được hiển thị công khai.</span>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* FOOTER */}
                        <div className={cx('footer')}>
                            <button className={cx('btnCancel')} onClick={() => setShowModal(false)} disabled={submitting}>
                                Hủy
                            </button>
                            <button className={cx('btnSubmit')} onClick={handleReviewSubmit} disabled={submitting}>
                                {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default Evaluation;
