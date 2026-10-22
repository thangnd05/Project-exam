'use client';

import type { ReactNode } from "react";
import classNames from "classnames/bind";
import { useTranslations } from "next-intl";
import style from "@/app/[locale]/(public)/_components/poliSer.module.scss";

const cx = classNames.bind(style);

const CONTACT_EMAIL = 'contact@frostscope.com';
const DISPUTE_EMAIL = 'dispute@frostscope.com';

const strong = (chunks: ReactNode) => <strong>{chunks}</strong>;

function Policy() {
  const t = useTranslations("Policy");
  const list = (key: "purpose.items" | "credits.items" | "security.items" | "rights.items") =>
    (t.raw(key) as string[]).map((item) => <li key={item}>{item}</li>);

  return (
    <article className={cx("page")}>
      <header className={cx("header")}>
        <h1 className={cx("title")}>{t("title")}</h1>
        <p className={cx("meta")}>
          {t("updated")}{" "}
          <a href={`mailto:${DISPUTE_EMAIL}`}>{DISPUTE_EMAIL}</a>
        </p>
      </header>

      <div className={cx("body")}>
        <p>{t("intro")}</p>

        <section className={cx("section")}>
          <h2>{t("collect.title")}</h2>
          <p>{t("collect.intro")}</p>
          <p>{t.rich("collect.account", { strong })}</p>
          <p>{t.rich("collect.assessment", { strong })}</p>
          <p>{t.rich("collect.technical", { strong })}</p>
        </section>

        <section className={cx("section")}>
          <h2>{t("purpose.title")}</h2>
          <p>{t("purpose.intro")}</p>
          <ul>{list("purpose.items")}</ul>
        </section>

        <section className={cx("section")}>
          <h2>{t("scopeRank.title")}</h2>
          <p>{t("scopeRank.intro")}</p>
          <p>{t.rich("scopeRank.public", { strong })}</p>
          <p>{t.rich("scopeRank.private", { strong })}</p>
        </section>

        <section className={cx("section")}>
          <h2>{t("credits.title")}</h2>
          <p>{t("credits.intro")}</p>
          <ul>{list("credits.items")}</ul>
        </section>

        <section className={cx("section")}>
          <h2>{t("ip.title")}</h2>
          <p>{t("ip.trademarks")}</p>
          <p>{t("ip.independent")}</p>
          <p>
            {t.rich("ip.copyright", {
              email: DISPUTE_EMAIL,
              link: (chunks) => <a href={`mailto:${DISPUTE_EMAIL}`} className={cx("mono")}>{chunks}</a>,
            })}
          </p>
        </section>

        <section className={cx("section")}>
          <h2>{t("noSale.title")}</h2>
          <p>{t.rich("noSale.commitment", { strong })}</p>
          <p>{t("noSale.processing")}</p>
        </section>

        <section className={cx("section")}>
          <h2>{t("security.title")}</h2>
          <p>{t("security.intro")}</p>
          <ul>{list("security.items")}</ul>
        </section>

        <section className={cx("section")}>
          <h2>{t("rights.title")}</h2>
          <p>{t("rights.intro")}</p>
          <ul>{list("rights.items")}</ul>
        </section>

        <section className={cx("section")}>
          <h2>{t("disputes.title")}</h2>
          <p>{t("disputes.intro")}</p>
          <p className={cx("contactLine")}>
            {t("disputes.inbox")} <a href={`mailto:${DISPUTE_EMAIL}`}>{DISPUTE_EMAIL}</a>
          </p>
          <p className={cx("note")}>{t("disputes.responseTime")}</p>
          <p>
            {t.rich("disputes.general", {
              email: CONTACT_EMAIL,
              link: (chunks) => <a href={`mailto:${CONTACT_EMAIL}`} className={cx("mono")}>{chunks}</a>,
            })}
          </p>
        </section>

        <section className={cx("section")}>
          <h2>{t("changes.title")}</h2>
          <p>{t("changes.body")}</p>
        </section>
      </div>
    </article>
  );
}

export default Policy;
