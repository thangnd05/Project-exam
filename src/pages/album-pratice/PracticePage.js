import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  Container,
  Card,
  Button,
  Spinner,
  Alert,
  Form,
  Toast,
  ToastContainer,
} from "react-bootstrap";

const PracticePage = () => {
  const { albumId } = useParams();
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState(null);
  const [userAnswer, setUserAnswer] = useState({ english: "", vietnamese: "" });
  const [result, setResult] = useState(null);
  const [finished, setFinished] = useState(false);
  const [loadingNext, setLoadingNext] = useState(false);
  const [markingKnown, setMarkingKnown] = useState(false);
  const [knownMessage, setKnownMessage] = useState("");

  // 🟢 Lấy câu hỏi ngẫu nhiên
  const fetchQuestion = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/practice-questions/generate/${albumId}`);
      if (res.status === 204 || !res.data) {
        setFinished(true);
        setQuestion(null);
      } else {
        setQuestion(res.data);
      }
    } catch (err) {
      console.error("❌ Lỗi lấy câu hỏi:", err);
    } finally {
      setLoading(false);
      setResult(null);
      setSelectedOption(null);
      setUserAnswer({ english: "", vietnamese: "" });
    }
  };

  useEffect(() => {
    fetchQuestion();
  }, [albumId]);

  // 🧮 Gửi đáp án
  const handleSubmit = async () => {
    if (!question) return;

    const payload =
      question.type === "MULTICHOICE"
        ? {
            vocabId: question.vocabId,
            type: question.type,
            selectedOptionText: question.options[selectedOption],
          }
        : {
            vocabId: question.vocabId,
            type: question.type,
            userEnglish: userAnswer.english,
            userVietnamese: userAnswer.vietnamese,
          };

    try {
      const res = await axios.post("/api/practice-questions/check", payload);
      setResult(res.data);
    } catch (err) {
      console.error("❌ Lỗi khi chấm:", err);
    }
  };

  // ➡️ Câu kế tiếp
  const handleNext = async () => {
    setLoadingNext(true);
    await fetchQuestion();
    setLoadingNext(false);
  };

  // 🆕 Đánh dấu từ đã biết + hiện popup
  const handleMarkKnown = async () => {
    if (!question) return;
    try {
      setMarkingKnown(true);
      await axios.post(
        `/api/practice-questions/mark-known/${question.vocabId}`,
        {},
        { withCredentials: true }
      );

      setKnownMessage("🎉 Bạn đã đánh dấu từ này là đã biết thành công!");
      setTimeout(() => setKnownMessage(""), 2000);
      setTimeout(async () => {
        await fetchQuestion();
      }, 1500);
    } catch (err) {
      console.error("❌ Lỗi khi đánh dấu đã biết:", err);
      setKnownMessage("⚠️ Có lỗi xảy ra khi đánh dấu từ này!");
    } finally {
      setMarkingKnown(false);
    }
  };

  // 🕓 Loading
  if (loading)
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" /> <p>Đang tải câu hỏi...</p>
      </div>
    );

  // ✅ Khi học xong hết
  if (finished)
    return (
      <Container className="text-center my-5">
        <h3 className="text-success">
          🎉 Bạn đã hoàn thành tất cả từ trong album này!
        </h3>
        <Button className="mt-3" onClick={() => window.history.back()}>
          ← Quay lại Album
        </Button>
      </Container>
    );

  // ⚠️ Không có câu hỏi
  if (!question)
    return (
      <Alert variant="warning" className="text-center mt-5">
        Không có câu hỏi nào khả dụng.
      </Alert>
    );

  // 💅 UI chính
  return (
    <Container className="my-5">
      {/* 💬 Popup Toast */}
      <ToastContainer position="top-center" className="p-3">
        <Toast
          show={!!knownMessage}
          onClose={() => setKnownMessage("")}
          delay={2000}
          autohide
          bg={knownMessage.includes("lỗi") ? "danger" : "success"}
        >
          <Toast.Body className="text-white fw-semibold text-center">
            {knownMessage}
          </Toast.Body>
        </Toast>
      </ToastContainer>

      <Card className="p-4 shadow-sm">
        <h4 className="mb-3 text-primary">{question.questionText}</h4>

        {/* 🔈 Audio nghe từ (giữ nguyên dùng API /api/tts) */}
        <audio key={question.vocabId} controls preload="none" className="mb-3">
          <source
            src={`http://localhost:8080/api/tts?text=${encodeURIComponent(
              question.word || ""
            )}`}
            type="audio/mpeg"
          />
        </audio>



        {/* 🧠 MULTICHOICE */}
        {question.type === "MULTICHOICE" ? (
          <>
            {question.options?.map((opt, idx) => (
              <Form.Check
                key={idx}
                type="radio"
                name="option"
                label={opt}
                checked={selectedOption === idx}
                onChange={() => setSelectedOption(idx)}
                className="mb-2"
              />
            ))}
          </>
        ) : (
          // ✍️ LISTENING_EN
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nhập từ tiếng Anh</Form.Label>
              <Form.Control
                value={userAnswer.english}
                onChange={(e) =>
                  setUserAnswer({ ...userAnswer, english: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Nghĩa tiếng Việt</Form.Label>
              <Form.Control
                value={userAnswer.vietnamese}
                onChange={(e) =>
                  setUserAnswer({ ...userAnswer, vietnamese: e.target.value })
                }
              />
            </Form.Group>
          </Form>
        )}

        {/* 🧩 Kết quả */}
        {result ? (
          <Alert
            variant={result.correct ? "success" : "danger"}
            className="mt-4"
          >
            {result.correct ? "✅ Chính xác!" : "❌ Sai rồi!"}
            <br /> Trạng thái học: <b>{result.status}</b> <br /> 
            Số lần đúng liên tiếp: <b>{result.correctCount}</b>

            {/* 🟡 Nếu sai, hiển thị thêm đáp án đúng */}
            {!result.correct && (
              <div className="mt-2">
                <hr />
                <b>Đáp án đúng:</b> <br />
                Từ tiếng Anh: <span className="text-primary">{question.word}</span> <br />
                🇻🇳 Nghĩa: <span className="text-success">{question.meaning}</span>
              </div>
            )}
          </Alert>
        ) : (
          <Button
            className="mt-4"
            onClick={handleSubmit}
            disabled={
              question.type === "MULTICHOICE" && selectedOption === null
            }
          >
            Gửi câu trả lời
          </Button>
        )}

        {/* ➡️ Nút chuyển câu */}
        {result && (
          <Button
            variant="secondary"
            className="mt-3 ms-2"
            onClick={handleNext}
            disabled={loadingNext}
          >
            {loadingNext ? "Đang tải..." : "Câu tiếp ➡️"}
          </Button>
        )}

        {/* ✅ Nút "Đã biết từ này" */}
        <Button
          variant="outline-success"
          className="mt-3 ms-2"
          onClick={handleMarkKnown}
          disabled={markingKnown}
        >
          {markingKnown ? "Đang đánh dấu..." : "✅ Đã biết từ này"}
        </Button>
      </Card>
    </Container>
  );
};

export default PracticePage;
