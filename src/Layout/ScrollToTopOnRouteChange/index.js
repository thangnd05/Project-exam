import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollHandler = () => {
    const location = useLocation();

    useEffect(() => {
        const saveScrollPosition = () => {
            sessionStorage.setItem("scroll_" + location.pathname, window.scrollY);
        };

        return () => {
            saveScrollPosition(); // Lưu vị trí khi component unmount
        };
    }, [location.pathname]);

    useEffect(() => {
        const scrollPosition = sessionStorage.getItem("scroll_" + location.pathname);

        if (scrollPosition !== null) {
            window.scrollTo(0, parseInt(scrollPosition, 10));
        } else {
            window.scrollTo(0, 0);
        }
    }, [location.pathname]);

    return null;
};

export default ScrollHandler;
