'use client';

import type { ReactNode } from "react";
import classNames from "classnames/bind";
import { useTranslations } from "next-intl";
import style from "@/app/[locale]/(public)/_components/poliSer.module.scss";

const cx = classNames.bind(style);

const DISPUTE_EMAIL = 'dispute@frostscope.com';

const strong = (chunks: ReactNode) => <strong>{chunks}</strong>;
const em = (chunks: ReactNode) => <em>{chunks}</em>;

function Service() {
  const t = useTranslations("Service");
  const list = (key: "account.items" | "paid.items" | "liability.items" | "termination.items") =>
    (t.raw(key) as string[]).map((item) => <li key={item}>{item}</li>);

  return (
    <article className={cx("page")}>
      <header className={cx("header")}>
        <h1 className={cx("title")}>{t("title")}</h1>
      </header>

      <div className={cx("body")}>
        <p>{t("intro")}</p>

        <section className={cx("section")}>
          <h2>{t("nature.title")}</h2>
          <p>{t("nature.body")}</p>
          <p>{t.rich("nature.simulation", { strong })}</p>
          <p>{t("nature.noRepresentation")}</p>
        </section>

        <section className={cx("section")}>
          <h2>{t("ip.title")}</h2>
          <p>{t.rich("ip.trademarks", { strong })}</p>
          <p>{t("ip.usage")}</p>
          <p>{t.rich("ip.ownership", { strong })}</p>
        </section>

        <section className={cx("section")}>
          <h2>{t("account.title")}</h2>
          <p>{t("account.intro")}</p>
          <ul>{list("account.items")}</ul>
        </section>

        <section className={cx("section")}>
          <h2>{t("credits.title")}</h2>
          <p>{t("credits.intro")}</p>
          <ul>
            <li>{t("credits.internal")}</li>
            <li>{t.rich("credits.noCash", { strong })}</li>
            <li>{t("credits.enforcement")}</li>
          </ul>
        </section>

        <section className={cx("section")}>
          <h2>{t("conduct.title")}</h2>
          <p>{t("conduct.intro")}</p>
          <p>{t.rich("conduct.integrity", { strong })}</p>
          <p>{t.rich("conduct.displayName", { strong })}</p>
          <p>{t.rich("conduct.anonymous", { strong, em })}</p>
        </section>

        <section className={cx("section")}>
          <h2>{t("paid.title")}</h2>
          <p>{t("paid.intro")}</p>
          <ul>{list("paid.items")}</ul>
        </section>

        <section className={cx("section")}>
          <h2>{t("liability.title")}</h2>
          <p>{t("liability.intro")}</p>
          <ul>{list("liability.items")}</ul>
        </section>

        <section className={cx("section")}>
          <h2>{t("termination.title")}</h2>
          <p>{t("termination.intro")}</p>
          <ul>{list("termination.items")}</ul>
        </section>

        <section className={cx("section")}>
          <h2>{t("disputes.title")}</h2>
          <p>{t("disputes.intro")}</p>
          <p>{t("disputes.channel")}</p>
          <p className={cx("contactLine")}>
            {t("disputes.inbox")} <a href={`mailto:${DISPUTE_EMAIL}`}>{DISPUTE_EMAIL}</a>
          </p>
          <p className={cx("note")}>{t("disputes.responseTime")}</p>
          <p>{t("disputes.resolution")}</p>
        </section>

        <section className={cx("section")}>
          <h2>{t("changes.title")}</h2>
          <p>{t("changes.body")}</p>
        </section>
      </div>
    </article>
  );
}

export default Service;
