'use client';

import classNames from "classnames/bind";
import ButtonPrime from "~/shared/ui/Button/ButtonPrime";
import styles from "./errorPage.module.scss";

const cx = classNames.bind(styles);

export default function NotFoundPage() {
    return (
        <div className={cx("wrapper")}>
            <div className={cx("card")}>
                <div className={cx("mascotWrap")}>
                    <svg
                        className={cx("mascotSvg")}
                        width="170"
                        height="170"
                        viewBox="0 0 160 160"
                        fill="none"
                        aria-hidden="true"
                    >

                        <ellipse
                            className={cx("shadow")}
                            cx="80"
                            cy="146"
                            rx="42"
                            ry="8"
                            fill="var(--primary)"
                        />
                        <g className={cx("mascot")}>

                            <rect
                                x="26"
                                y="30"
                                width="108"
                                height="100"
                                rx="42"
                                fill="url(#nf-body)"
                            />

                            <circle cx="52" cy="92" r="8" fill="#ffb0c4" opacity="0.75" />
                            <circle cx="108" cy="92" r="8" fill="#ffb0c4" opacity="0.75" />

                            <circle className={cx("eye")} cx="62" cy="76" r="6.5" fill="#1e293b" />
                            <circle className={cx("eye")} cx="98" cy="76" r="6.5" fill="#1e293b" />
                            <circle cx="64" cy="74" r="2" fill="#ffffff" />
                            <circle cx="100" cy="74" r="2" fill="#ffffff" />

                            <ellipse cx="80" cy="102" rx="5" ry="6" fill="#1e293b" />
                        </g>

                        <text
                            className={cx("question")}
                            x="128"
                            y="42"
                            fontSize="34"
                            fontWeight="800"
                            fill="var(--primary)"
                            textAnchor="middle"
                        >
                            ?
                        </text>
                        <defs>
                            <linearGradient id="nf-body" x1="26" y1="30" x2="134" y2="130" gradientUnits="userSpaceOnUse">
                                <stop stopColor="var(--brand-100)" />
                                <stop offset="1" stopColor="var(--brand-200)" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

                <h1 className={cx("code")}>404</h1>

                <h2 className={cx("title")}>Ơ, trang này đi đâu mất rồi?</h2>

                <p className={cx("desc")}>
                    Đường dẫn bạn truy cập không tồn tại hoặc đã bị xóa. Hãy giúp mình click vào nút bên dưới
                </p>

                <ButtonPrime as="link" href="/" variant="primary" size="lg">
                    Quay về trang chủ
                </ButtonPrime>
            </div>
        </div>
    );
}
