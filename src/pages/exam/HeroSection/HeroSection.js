import classNames from 'classnames/bind';
import styles from './HeroSection.module.scss';
import { name } from '~/assets/images';

const cx = classNames.bind(styles);

function HeroSection() {
    return (
        <section className={cx('hero')}>
            <div className={cx('content')}>
                <h1 className={cx('welcome')}>Chào mừng đến với {name}</h1>
                <p className={cx('desc')}>
                    <strong>{name}</strong> – Công cụ đồng hành cùng hành trình chinh phục tri thức.
                    Chúng tôi mang đến giải pháp hỗ trợ thông minh và cá nhân hóa,
                    không chỉ cung cấp nguồn bài tập chọn lọc mà còn giúp bạn tự xây dựng
                    kho câu hỏi riêng để việc ôn luyện trở nên thực tế và thú vị hơn.
                </p>
                <div className={cx('actions')}>
                    <button className={cx('btn-primary')}>Bắt đầu ngay</button>
                    <button className={cx('btn-outline')}>Tìm hiểu thêm</button>
                </div>
            </div>

            <div className={cx('image-wrapper')}>
                <div className={cx('mockup-screen')}>
                    <img
                        src="https://img.freepik.com/free-vector/online-certification-illustration-concept_23-2148575640.jpg"
                        alt="WinDe Education Illustration"
                    />
                </div>
            </div>
        </section>
    );
}

export default HeroSection;