'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from "react";
import classNames from "classnames/bind";
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

  const tabs = useMemo(() => {
    const parts = enhanced?.partBreakdown || [];
    const partTabs = parts.map((p) => ({
      key: p.examPartId,
      label: p.partName || "Phần",
      tags: p.tags || EMPTY_LIST,
    }));

    return partTabs;
  }, [enhanced]);

  const [active, setActive] = useState<string | undefined>(() => tabs[0]?.key);

  const current = tabs.find((t) => t.key === active) || tabs[0];
  const rows = useMemo(() => {
    const list = [...(current?.tags || [])];
    list.sort((a, b) => (a.tagName || "").localeCompare(b.tagName || "", "vi"));
    return list;
  }, [current]);

  const totals = useMemo(() => computeTotals(current?.tags || []), [current]);

  const hasData = tabs.some((t) => (t.tags || []).length > 0);
  if (!hasData) return null;

  const goToQuestion = (questionId: string) => {
    router.push(`/tests/result/${userTestId}/review#rq-${questionId}`);
  };

  return (
    <div className={cx("wrapper")}>
      <h2 className={cx("title")}>Phân tích chi tiết</h2>

      <div className={cx("tabs")}>
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            className={cx("tab", { active: t.key === current?.key })}
            onClick={() => setActive(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={cx("table-scroll")}>
        <table className={cx("table")}>
          <thead>
            <tr>
              <th className={cx("col-name")}>Phân loại câu hỏi</th>
              <th>Số câu đúng</th>
              <th>Số câu sai</th>
              <th>Số câu bỏ qua</th>
              <th>Độ chính xác</th>
              <th className={cx("col-list")}>Danh sách câu hỏi</th>
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
                        title={`Câu ${q.questionNumber}  xem giải thích`}
                      >
                        {q.questionNumber}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}

            <tr className={cx("total-row")}>
              <td className={cx("col-name")}>Total</td>
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
