import { Link } from "react-router-dom";
import classNames from "classnames/bind";
import styles from "./errorPage.module.scss";

const cx = classNames.bind(styles);

export default function NotFoundPage() {
    return (
        <div className={cx("wrapper")}>
            <div className={cx("card")}>
                <h1 className={cx("code")}>404</h1>

                <h2 className={cx("title")}>Trang không tồn tại</h2>

                <p className={cx("desc")}>
                    Đường dẫn bạn truy cập không hợp lệ hoặc đã bị xóa.
                </p>

                <Link to="/" className={cx("btn")}>
                    Quay về trang chủ
                </Link>
            </div>
        </div>
    );
}
