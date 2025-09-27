// src/pages/test/TestStartPage.jsx
import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import classNames from "classnames/bind";
import style from "./TestStartPage.module.scss";

const cx = classNames.bind(style);

function TestStartPage() {
  const { testId } = useParams();
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({}); // { questionId: answerValue }
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!testId) return;

    axios
      .get(`/api/tests/user/${testId}`)
      .then((res) => setTest(res.data))
      .catch((err) => console.error("Lỗi khi lấy test:", err));
  }, [testId]);

  const handleChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    // Gửi đáp án lên backend nếu muốn lưu
    console.log("Submit answers:", answers);
    setSubmitted(true);
  };

  if (!test) return <p>Loading test...</p>;

  return (
    <div className={cx("container")}>
      <h3 className={cx("title")}>{test.title}</h3>
      {test.parts.map((part) => (
        <div key={part.testPartId} className={cx("part")}>
          <h4>Phần: {part.examPartId}</h4>
          {part.questions.map((q, index) => (
            <div key={q.questionId} className={cx("question-card")}>
              <p>
                {index + 1}. {q.questionText}
              </p>

              {/* Passage nếu có */}
              {q.passage && <p className={cx("passage")}>{q.passage.content}</p>}

              {/* MCQ */}
              {q.questionType === "MCQ" &&
                q.answers.map((a) => (
                  <div key={a.answerId}>
                    <label>
                      <input
                        type="radio"
                        name={`q-${q.questionId}`}
                        value={a.answerId}
                        disabled={submitted}
                        checked={answers[q.questionId] === a.answerId}
                        onChange={() => handleChange(q.questionId, a.answerId)}
                      />
                      {a.answerLabel}. {a.answerText}

                      {/* Hiển thị đáp án đúng khi đã submit */}
                      {submitted && a.isCorrect && (
                        <span className={cx("correct")}> ✔</span>
                      )}
                    </label>
                  </div>
                ))}

              {/* FILL_BLANK */}
              {q.questionType === "FILL_BLANK" && (
                <div>
                  <input
                    type="text"
                    value={answers[q.questionId] || ""}
                    disabled={submitted}
                    onChange={(e) => handleChange(q.questionId, e.target.value)}
                  />
                  {submitted && q.answers[0]?.isCorrect && (
                    <span className={cx("correct")}>
                      {" "}Đáp án: {q.answers[0].answerText}
                    </span>
                  )}
                </div>
              )}

              {/* ESSAY */}
              {q.questionType === "ESSAY" && (
                <div>
                  <textarea
                    value={answers[q.questionId] || ""}
                    disabled={submitted}
                    onChange={(e) => handleChange(q.questionId, e.target.value)}
                  />
                  {submitted && q.answers.length > 0 && (
                    <div className={cx("correct")}>
                      Đáp án gợi ý: {q.answers.map(a => a.answerText).join("; ")}
                    </div>
                  )}
                </div>
              )}

              {/* Explanation nếu có */}
              {submitted && q.explanation && (
                <p className={cx("explanation")}>Giải thích: {q.explanation}</p>
              )}
            </div>
          ))}
        </div>
      ))}

      {!submitted && (
        <button className={cx("btn-submit")} onClick={handleSubmit}>
          Nộp bài
        </button>
      )}
    </div>
  );
}

export default TestStartPage;
