import classNames from "classnames/bind";
import styles from "./DefaultLayout.module.scss";
import Header from "../Header";
import Footer from "../Footer";
import ScrollToTop from "../SconllToTop";

const cx = classNames.bind(styles);

function DefaultLayout({ children, noContainer = false }) {
  return (
    <div className={cx("wrapper")}>
      <Header />

      {/* Main full width */}
      <main className={cx("main")}>
        {noContainer ? (
          // ✅ Full width page (Home landing...)
          children
        ) : (
          // ✅ Normal pages inside container
          <div className="container-lg">{children}</div>
        )}
      </main>

      <Footer />
      <ScrollToTop />
    </div>
  );
}

export default DefaultLayout;
