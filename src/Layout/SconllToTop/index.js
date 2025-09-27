import { useEffect, useState } from "react";
import classNames from "classnames/bind";
import styles from "./ScrollToTop.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUp } from "@fortawesome/free-solid-svg-icons";
const cx = classNames.bind(styles);

function ScrollToTop() {
  const [showScroll, setShowScroll] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 200) { // Hiển thị khi cuộn xuống 200px
        setShowScroll(true);
      } else {
        setShowScroll(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  

  return (
    showScroll && (
      <button className={cx("scrollTopBtn")} onClick={scrollToTop}>
        <FontAwesomeIcon icon={faArrowUp}/>
      </button>
    )
  );
}

export default ScrollToTop;
