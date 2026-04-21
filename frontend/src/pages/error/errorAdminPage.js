import { Link } from "react-router-dom";
import classNames from "classnames/bind";
import styles from "./errorPage.module.scss";

const cx = classNames.bind(styles);

function ErrorAdminPage() {
  return (
    <div className={cx("wrapper")}>
      <div className={cx("card")}>
        <h1 className={cx("code")}>403</h1>

        <h2 className={cx("title")}>Không có quyền truy cập</h2>

        <p className={cx("desc")}>
          Bạn không có quyền truy cập vào trang này. Vui lòng đăng nhập đúng tài
          khoản hoặc quay lại trang chủ.
        </p>

        <Link to="/" className={cx("btn")}>
          Quay về trang chủ
        </Link>

        <Link to="/login" className={cx("btn", "secondaryBtn")}>
          Đăng nhập
        </Link>
      </div>
    </div>
  );
}

export default ErrorAdminPage;
