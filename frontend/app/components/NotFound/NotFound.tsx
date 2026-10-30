'use client';

import classNames from "classnames/bind";
import { useTranslations } from "next-intl";
import ButtonPrime from "@/app/components/Button/ButtonPrime";
import routes from "@/app/configs/Routes";
import styles from "./NotFound.module.scss";

const cx = classNames.bind(styles);

export default function NotFound() {
    const t = useTranslations("Common.notFound");
    return (
        <div className={cx("wrapper")}>
            <div className={cx("content")}>
                <p className={cx("code")}>404</p>

                <h1 className={cx("title")}>{t("title")}</h1>

                <p className={cx("desc")}>{t("description")}</p>

                <div className={cx("actions")}>
                    <ButtonPrime as="link" href={routes.home} variant="ink">
                        {t("backHome")}
                    </ButtonPrime>
                    <ButtonPrime as="link" href={routes.examTypes} variant="outline">
                        {t("examTypes")}
                    </ButtonPrime>
                </div>
            </div>
        </div>
    );
}
