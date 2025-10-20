import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Container,
  Table,
  Spinner,
  Alert,
  Button,
  Modal,
  Form,
} from "react-bootstrap";
import "./AlbumDetailPage.scss";

const AlbumDetailPage = () => {
  const { albumId } = useParams();
  const [vocabularies, setVocabularies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newVocab, setNewVocab] = useState({
    word: "",
    meaning: "",
    example: "",
  });
  const navigate = useNavigate();

  // 🟢 Lấy danh sách từ
  const fetchVocabularies = async () => {
    try {
      const res = await axios.get(`/api/vocabularies/album/${albumId}`, {
        withCredentials: true,
      });
      setVocabularies(res.data);
    } catch (err) {
      console.error("❌ Lỗi khi tải từ vựng:", err);
      setErrorMsg("Không thể tải danh sách từ vựng 😢");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (albumId) fetchVocabularies();
  }, [albumId]);

  // 🟢 Nhập liệu form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewVocab({ ...newVocab, [name]: value });
  };

  // 🟢 Gửi dữ liệu tạo từ mới
  const handleSave = async () => {
    if (!newVocab.word.trim() || !newVocab.meaning.trim()) {
      alert("Vui lòng nhập đầy đủ Từ và Nghĩa!");
      return;
    }

    try {
      const res = await axios.post(
        "/api/vocabularies",
        {
          albumId: albumId,
          word: newVocab.word,
          meaning: newVocab.meaning,
          example: newVocab.example,
          // ✅ Không cần gửi phonetic/voiceUrl, BE tự sinh
        },
        { withCredentials: true }
      );

      alert(`✅ Đã thêm từ '${res.data.word}' thành công!`);
      setShowModal(false);
      setNewVocab({ word: "", meaning: "", example: "" });
      fetchVocabularies();
    } catch (err) {
      console.error("❌ Lỗi khi thêm từ:", err);
      alert("Không thể thêm từ mới 😢");
    }
  };

  if (loading)
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" /> <p>Đang tải...</p>
      </div>
    );

  if (errorMsg) return <Alert variant="danger">{errorMsg}</Alert>;

  return (
    <Container className="my-5">
      {/* Header buttons */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Button variant="secondary" onClick={() => navigate(-1)}>
          ← Quay lại
        </Button>
        <Button variant="success" onClick={() => setShowModal(true)}>
          ➕ Thêm từ mới
        </Button>
      </div>

      <h2 className="fw-bold text-primary mb-4">📖 Danh sách từ vựng</h2>

      {vocabularies.length === 0 ? (
        <Alert variant="info">Album này chưa có từ vựng nào.</Alert>
      ) : (
        <Table striped bordered hover responsive className="shadow-sm">
          <thead className="table-primary">
            <tr>
              <th>#</th>
              <th>Từ vựng</th>
              <th>Phiên âm</th>
              <th>Nghĩa</th>
              <th>Ví dụ</th>
              <th>Phát âm</th>
            </tr>
          </thead>
          <tbody>
            {vocabularies.map((vocab, index) => (
              <tr key={vocab.vocabId}>
                <td>{index + 1}</td>
                <td className="fw-semibold text-capitalize">{vocab.word}</td>
                <td>{vocab.phonetic || "..."}</td>
                <td>{vocab.meaning}</td>
                <td>{vocab.example}</td>
                <td>
                  {vocab.word ? (
                    <audio controls preload="none">
                      <source
                        src={`http://localhost:8080/api/tts?text=${encodeURIComponent(
                          vocab.word
                        )}`}
                        type="audio/mpeg"
                      />
                      Trình duyệt không hỗ trợ phát âm thanh.
                    </audio>
                  ) : (
                    <span className="text-muted fst-italic">
                      Chưa có file
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* 🟢 Modal thêm từ */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Thêm từ vựng mới</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Từ vựng</Form.Label>
              <Form.Control
                name="word"
                value={newVocab.word}
                onChange={handleChange}
                placeholder="Ví dụ: love"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Nghĩa</Form.Label>
              <Form.Control
                name="meaning"
                value={newVocab.meaning}
                onChange={handleChange}
                placeholder="Tình yêu"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Ví dụ</Form.Label>
              <Form.Control
                name="example"
                value={newVocab.example}
                onChange={handleChange}
                placeholder="I love learning English."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Lưu
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AlbumDetailPage;
