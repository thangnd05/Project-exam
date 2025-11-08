import React, {useEffect, useState} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Table,
  Spinner,
  Alert,
  Button,
  Modal,
  Form,
  Card,
} from 'react-bootstrap';
import './AlbumDetailPage.scss';

const AlbumDetailPage = () => {
  const {albumId} = useParams();
  const [vocabularies, setVocabularies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [flashMode, setFlashMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [newVocab, setNewVocab] = useState({
    word: '',
    meaning: '',
    example: '',
  });
  const navigate = useNavigate();

  const fetchVocabularies = async () => {
    try {
      const res = await axios.get(`/api/vocabularies/album/${albumId}`, {
        withCredentials: true,
      });
      setVocabularies(res.data);
    } catch (err) {
      console.error('❌ Lỗi khi tải từ vựng:', err);
      setErrorMsg('Không thể tải danh sách từ vựng 😢');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (albumId) fetchVocabularies();
  }, [albumId]);

  const handleChange = (e) => {
    const {name, value} = e.target;
    setNewVocab({...newVocab, [name]: value});
  };

  const handleSave = async () => {
    if (!newVocab.word.trim() || !newVocab.meaning.trim()) {
      alert('Vui lòng nhập đầy đủ Từ và Nghĩa!');
      return;
    }

    try {
      await axios.post(
        '/api/vocabularies',
        {albumId, ...newVocab},
        {withCredentials: true},
      );
      alert(`✅ Đã thêm từ '${newVocab.word}' thành công!`);
      setShowModal(false);
      setNewVocab({word: '', meaning: '', example: ''});
      fetchVocabularies();
    } catch (err) {
      console.error('❌ Lỗi khi thêm từ:', err);
      alert('Không thể thêm từ mới 😢');
    }
  };

  const handleDelete = async (vocabId, word) => {
    if (!window.confirm(`Bạn có chắc muốn xóa từ "${word}"?`)) return;
    try {
      await axios.delete(`/api/vocabularies/${vocabId}`, {
        withCredentials: true,
      });
      setVocabularies((prev) => prev.filter((v) => v.vocabId !== vocabId));
    } catch {
      alert('Không thể xóa từ này 😢');
    }
  };

  if (loading)
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" /> <p>Đang tải...</p>
      </div>
    );

  if (errorMsg) return <Alert variant="danger">{errorMsg}</Alert>;

  // 🧠 Flashcard hiện tại
  const currentVocab = vocabularies[currentIndex];

  return (
    <Container className="my-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Button variant="secondary" onClick={() => navigate(-1)}>
          ← Quay lại
        </Button>

        <div className="d-flex gap-2">
          <Button
            variant="info"
            onClick={() => navigate(`/practice/${albumId}`)}
            disabled={vocabularies.length === 0}
          >
            🧩 Luyện tập
          </Button>

          <Button
            variant="outline-primary"
            onClick={() => setFlashMode(!flashMode)}
            disabled={vocabularies.length === 0}
          >
            🃏 {flashMode ? 'Thoát Flashcard' : 'Học bằng Flashcard'}
          </Button>

          <Button variant="success" onClick={() => setShowModal(true)}>
            ➕ Thêm từ mới
          </Button>
        </div>
      </div>

      <h2 className="fw-bold text-primary mb-4">
        {flashMode ? '🎯 Học bằng Flashcard' : '📖 Danh sách từ vựng'}
      </h2>

      {/* 🧩 Flashcard View */}
      {flashMode ? (
        <div className="text-center">
          <div
            className="flashcard-container mx-auto"
            style={{width: '350px', height: '230px', perspective: '1000px'}}
            onClick={() => setFlipped(!flipped)}
          >
            <div className={`flashcard-inner ${flipped ? 'flipped' : ''}`}>
              {/* Mặt trước */}
              <div className="flashcard-front d-flex flex-column justify-content-center align-items-center p-4">
                <h3 className="fw-bold text-primary text-capitalize">
                  {currentVocab.word}
                </h3>
                <p className="text-muted">{currentVocab.phonetic || '...'}</p>

                {/* ✅ Dùng key để buộc React reload audio */}
                <audio
                  key={currentVocab.word}
                  controls
                  preload="none"
                  className="mt-2"
                >
                  <source
                    src={`http://localhost:8080/api/tts?text=${encodeURIComponent(
                      currentVocab.word,
                    )}`}
                    type="audio/mpeg"
                  />
                </audio>
              </div>

              {/* Mặt sau */}
              <div className="flashcard-back d-flex flex-column justify-content-center align-items-center p-4">
                <h5 className="text-dark">{currentVocab.meaning}</h5>
                <p className="fst-italic mt-2 text-secondary">
                  {currentVocab.example}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 d-flex justify-content-center gap-3">
            <Button
              variant="outline-secondary"
              disabled={currentIndex === 0}
              onClick={() => {
                setFlipped(false);
                setCurrentIndex((prev) => prev - 1);
              }}
            >
              ⬅️ Trước
            </Button>
            <Button
              variant="outline-secondary"
              disabled={currentIndex === vocabularies.length - 1}
              onClick={() => {
                setFlipped(false);
                setCurrentIndex((prev) => prev + 1);
              }}
            >
              Tiếp ➡️
            </Button>
          </div>
        </div>
      ) : (
        // 🧾 Danh sách bảng
        <Table striped bordered hover responsive className="shadow-sm">
          <thead className="table-primary text-center">
            <tr>
              <th>#</th>
              <th>Từ vựng</th>
              <th>Phiên âm</th>
              <th>Nghĩa</th>
              <th>Ví dụ</th>
              <th>Phát âm</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {vocabularies.map((vocab, index) => (
              <tr key={vocab.vocabId}>
                <td>{index + 1}</td>
                <td>{vocab.word}</td>
                <td>{vocab.phonetic}</td>
                <td>{vocab.meaning}</td>
                <td>{vocab.example}</td>
                <td>
                  <audio controls preload="none">
                    <source
                      src={`http://localhost:8080/api/tts?text=${encodeURIComponent(
                        vocab.word,
                      )}`}
                      type="audio/mpeg"
                    />
                  </audio>
                </td>
                <td className="text-center">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(vocab.vocabId, vocab.word)}
                  >
                    🗑️ Xóa
                  </Button>
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
