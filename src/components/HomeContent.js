import React, { useState } from 'react';
import {
    FaDatabase, FaLayerGroup, FaCheckCircle,
    FaStar, FaQuoteLeft, FaPen, FaTimes, FaInfoCircle
} from 'react-icons/fa';
import classNames from 'classnames/bind';
import styles from './HomeContent.module.scss';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const cx = classNames.bind(styles);

const HomeContent = () => {
    // --- STATE QUẢN LÝ MODAL VÀ ĐÁNH GIÁ ---
    const [showModal, setShowModal] = useState(false);
    const [userRating, setUserRating] = useState(5); // Mặc định 5 sao

    // Dữ liệu "Seeding" (Fake)
    const reviews = [
        {
            id: 1,
            name: 'Minh Hằng',
            role: 'Sinh viên NEU',
            avatar: 'https://i.pravatar.cc/150?img=5',
            content: 'Giao diện web rất đẹp và dễ dùng. Mình thích nhất phần giải thích chi tiết sau mỗi câu hỏi.',
            rating: 4
        },
        {
            id: 2,
            name: 'Trần Văn Đạt',
            role: '900+ TOEIC',
            avatar: 'https://i.pravatar.cc/150?img=11',
            content: 'Kho đề ở đây khá sát với thi thật. Mình ôn khoảng 2 tuần trên WinDe trước khi thi và trúng tủ.',
            rating: 4
        },
        {
            id: 3,
            name: 'Lê Thu Thảo',
            role: 'Người đi làm',
            avatar: 'https://i.pravatar.cc/150?img=9',
            content: 'Web có chế độ làm bài ngắn 15-20p rất tiện, không bị áp lực phải ngồi cả tiếng đồng hồ.',
            rating: 4
        },
        {
            id: 4,
            name: 'Hoàng Nam',
            role: 'IELTS 7.5',
            avatar: 'https://i.pravatar.cc/150?img=12',
            content: 'Cực kỳ thích tính năng phân tích lỗi sai. Giúp mình nhận ra mình hay bị bẫy ở đâu.',
            rating: 5
        },
        {
            id: 5,
            name: 'Phạm Hương',
            role: 'Học sinh THPT',
            avatar: 'https://i.pravatar.cc/150?img=24',
            content: 'Nhờ WinDe mà mình tự tin hơn hẳn cho kỳ thi đại học sắp tới. Đề thi thử rất sát form.',
            rating: 5
        },
        {
            id: 6,
            name: 'Phạm Hương',
            role: 'Học sinh THPT',
            avatar: 'https://i.pravatar.cc/150?img=24',
            content: 'Nhờ WinDe mà mình tự tin hơn hẳn cho kỳ thi đại học sắp tới. Đề thi thử rất sát form.',
            rating: 5
        },
        {
            id: 7,
            name: 'Phạm Hương',
            role: 'Học sinh THPT',
            avatar: 'https://i.pravatar.cc/150?img=24',
            content: 'Nhờ WinDe mà mình tự tin hơn hẳn cho kỳ thi đại học sắp tới. Đề thi thử rất sát form.',
            rating: 5
        },
        {
            id: 8,
            name: 'Phạm Hương',
            role: 'Học sinh THPT',
            avatar: 'https://i.pravatar.cc/150?img=24',
            content: 'Nhờ WinDe mà mình tự tin hơn hẳn cho kỳ thi đại học sắp tới. Đề thi thử rất sát form.',
            rating: 5
        },
        {
            id: 9,
            name: 'Phạm Hương',
            role: 'Học sinh THPT',
            avatar: 'https://i.pravatar.cc/150?img=24',
            content: 'Nhờ WinDe mà mình tự tin hơn hẳn cho kỳ thi đại học sắp tới. Đề thi thử rất sát form.',
            rating: 5
        },
        {
            id: 10,
            name: 'Phạm Hương',
            role: 'Học sinh THPT',
            avatar: 'https://i.pravatar.cc/150?img=24',
            content: 'Nhờ WinDe mà mình tự tin hơn hẳn cho kỳ thi đại học sắp tới. Đề thi thử rất sát form.',
            rating: 5
        }
    ];

    // Xử lý Logic hiển thị Dots/Arrows dựa trên số lượng đánh giá
    // Nếu có quá nhiều đánh giá (> 15), việc hiển thị full dots sẽ rất rối mắt -> Chuyển sang dùng Arrows
    const showDots = reviews.length < 15;

    // Cấu hình cho Slide
    const settings = {
        dots: showDots,
        infinite: true,
        speed: 500,
        slidesToShow: 3,
        // Nếu hiện dots: scroll theo trang (3 item) để giảm số lượng dots
        // Nếu không hiện dots: scroll từng item (1) để trải nghiệm mượt mà hơn với arrows/autoplay
        slidesToScroll: showDots ? 3 : 1,
        autoplay: true,
        autoplaySpeed: 3000,
        pauseOnHover: false,
        arrows: !showDots, // Tự động bật mũi tên điều hướng khi ẩn dots
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: showDots ? 2 : 1
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

    // Xử lý gửi đánh giá
    const handleReviewSubmit = (e) => {
        e.preventDefault();
        alert('Cảm ơn bạn đã gửi đánh giá! (Demo)');
        setShowModal(false);
    };

    return (
        <div className={cx('home-content-wrapper')}>



            {/* --- PHẦN 2: THỐNG KÊ --- */}
            <section className={cx('section', 'stats-section')}>
                <div className="container">
                    <div className="row text-center">
                        <div className="col-md-4 mb-4 mb-md-0">
                            <div className={cx('stat-item')}>
                                <FaDatabase className={cx('stat-icon')} />
                                <h3 className="display-4 fw-bold">500+</h3>
                                <p>Câu hỏi trắc nghiệm</p>
                            </div>
                        </div>
                        <div className="col-md-4 mb-4 mb-md-0">
                            <div className={cx('stat-item')}>
                                <FaLayerGroup className={cx('stat-icon')} />
                                <h3 className="display-4 fw-bold">50+</h3>
                                <p>Bộ đề hoàn chỉnh</p>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className={cx('stat-item')}>
                                <FaCheckCircle className={cx('stat-icon')} />
                                <h3 className="display-4 fw-bold">100%</h3>
                                <p>Có giải thích chi tiết</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- PHẦN 3: ĐÁNH GIÁ (SLIDER) --- */}
            <section className={cx('section', 'reviews-section')}>
                <div className="container">
                    <div className="text-center mb-5">
                        <h2 className={cx('section-title')}>Học viên nói gì về WinDe?</h2>
                        <p className="text-muted">Niềm tin được khẳng định qua kết quả thực tế</p>
                    </div>

                    <div className={cx('slider-container')}>
                        <Slider {...settings}>
                            {reviews.map((review) => (
                                <div key={review.id} className={cx('slide-item')}>
                                    <div className={cx('review-card')}>
                                        <div className={cx('quote-icon')}><FaQuoteLeft /></div>
                                        <p className={cx('review-content')}>"{review.content}"</p>
                                        <div className={cx('review-footer')}>
                                            <img src={review.avatar} alt={review.name} className={cx('avatar')} />
                                            <div className={cx('user-info')}>
                                                <h4 className={cx('user-name')}>{review.name}</h4>
                                                <span className={cx('user-role')}>{review.role}</span>
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

                    {/* NÚT MỞ MODAL */}
                    <div className="text-center mt-4">
                        <button
                            className={cx('btn-write-review')}
                            onClick={() => setShowModal(true)}
                        >
                            <FaPen style={{ marginRight: '8px' }} /> Viết đánh giá của bạn
                        </button>
                    </div>
                </div>
            </section>

            {/* --- MODAL (POPUP) STYLE JOIN CLASS --- */}
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
                            <button className={cx('btnCancel')} onClick={() => setShowModal(false)}>
                                Hủy
                            </button>
                            <button className={cx('btnSubmit')} onClick={handleReviewSubmit}>
                                Gửi đánh giá
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default HomeContent;