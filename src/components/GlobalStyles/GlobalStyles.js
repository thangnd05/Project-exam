import classNames from "classnames/bind";
import style from "./GlobalStyles.module.scss"

const cx=classNames.bind(style)


function GlobalStyles({children}) {
    return children;
}

export default GlobalStyles;