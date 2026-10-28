'use client';

import { useRouter } from '@/app/i18n/navigation';
import { useMemo, useState } from "react";
import classNames from "classnames/bind";
import { useLocale, useTranslations } from "next-intl";
import styles from "./TagAnalysisTable.module.scss";
import type { EnhancedResultResponse, TagBreakdownResponse } from '@/app/types';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';

const cx = classNames.bind(styles);

const computeTotals = (tags: TagBreakdownResponse[]) => {
  const seen = new Map<string, string | undefined>();
  tags.forEach((t) =>
    (t.questions || []).forEach((q) => seen.set(q.questionId, q.status)),
  );
  let correct = 0,
    wrong = 0,
    skipped = 0;
  seen.forEach((st) => {
    if (st === "correct") correct += 1;
    else if (st === "wrong") wrong += 1;
    else skipped += 1;
  });
  return { correct, wrong, skipped, total: seen.size };
};

const accuracy = (correct: number, total: number) =>
  total > 0 ? ((correct / total) * 100).toFixed(2) : "0.00";

type TagAnalysisTableProps = {
  enhanced?: EnhancedResultResponse | null;
  userTestId?: string;
};

function TagAnalysisTable({ enhanced, userTestId }: TagAnalysisTableProps) {
  const router = useRouter();
  const t = useTranslations("TestTaking.tagAnalysis");
  const locale = useLocale();
  const fallbackPartLabel = t("fallbackPart");

  const tabs = useMemo(() => {
    const parts = enhanced?.partBreakdown || [];
    const partTabs = parts.map((p) => ({
      key: p.examPartId,
      label: p.partName || fallbackPartLabel,
      tags: p.tags || EMPTY_LIST,
    }));

    return partTabs;
  }, [enhanced, fallbackPartLabel]);

  const [active, setActive] = useState<string | undefined>(() => tabs[0]?.key);

  const current = tabs.find((t) => t.key === active) || tabs[0];
  const rows = useMemo(() => {
    const list = [...(current?.tags || [])];
    list.sort((a, b) => (a.tagName || "").localeCompare(b.tagName || "", locale));
    return list;
  }, [current, locale]);

  const totals = useMemo(() => computeTotals(current?.tags || []), [current]);

  const hasData = tabs.some((t) => (t.tags || []).length > 0);
  if (!hasData) return null;

  const goToQuestion = (questionId: string) => {
    router.push(`/tests/result/${userTestId}/review#rq-${questionId}`);
  };

  return (
    <div className={cx("wrapper")}>
      <h2 className={cx("title")}>{t("title")}</h2>

      <div className={cx("tabs")}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={cx("tab", { active: tab.key === current?.key })}
            onClick={() => setActive(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={cx("table-scroll")}>
        <table className={cx("table")}>
          <thead>
            <tr>
              <th className={cx("col-name")}>{t("columns.category")}</th>
              <th>{t("columns.correct")}</th>
              <th>{t("columns.wrong")}</th>
              <th>{t("columns.skipped")}</th>
              <th>{t("columns.accuracy")}</th>
              <th className={cx("col-list")}>{t("columns.questions")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((tag) => (
              <tr key={tag.tagId}>
                <td className={cx("col-name")}>{tag.tagName}</td>
                <td>{tag.correct}</td>
                <td>{tag.wrong}</td>
                <td>{tag.skipped}</td>
                <td>{accuracy(tag.correct, tag.total)}%</td>
                <td className={cx("col-list")}>
                  <div className={cx("q-circles")}>
                    {(tag.questions || []).map((q) => (
                      <button
                        key={q.questionId}
                        type="button"
                        className={cx("q-circle", q.status)}
                        onClick={() => goToQuestion(q.questionId)}
                        title={t("questionTitle", { number: q.questionNumber })}
                      >
                        {q.questionNumber}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}

            <tr className={cx("total-row")}>
              <td className={cx("col-name")}>{t("total")}</td>
              <td>{totals.correct}</td>
              <td>{totals.wrong}</td>
              <td>{totals.skipped}</td>
              <td>{accuracy(totals.correct, totals.total)}%</td>
              <td className={cx("col-list")} />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TagAnalysisTable;
