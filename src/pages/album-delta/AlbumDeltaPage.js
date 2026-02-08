import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Table,
  Spinner,
  Alert,
  Button,
  Modal,
  Form,
} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {
  IoArrowBack,
  IoAdd,
  IoPlay,
  IoFlashOutline,
  IoTrashOutline,
  IoChevronBack,
  IoChevronForward,
  IoListOutline,
  IoSchoolOutline,
  IoVolumeHighOutline
} from 'react-icons/io5';

import styles from './AlbumDeltaPage.module.scss';

const cx = classNames.bind(styles);

const AlbumDetailPage = () => {
  const { albumId } = useParams();
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
  const audioRef = useRef(null);

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
    const { name, value } = e.target;
    setNewVocab({ ...newVocab, [name]: value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        '/api/vocabularies',
        { albumId, ...newVocab },
        { withCredentials: true },
      );
      setShowModal(false);
      setNewVocab({ word: '', meaning: '', example: '' });
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

  const playAudio = (word) => {
    const ttsUrl = `http://localhost:8080/api/tts?text=${encodeURIComponent(word)}`;
    const audio = new Audio(ttsUrl);
    audio.play();
  };

  if (loading)
    return (
      <div className={cx('loading-box')}>
        <Spinner animation="grow" variant="primary" size="lg" />
        <p>Đang mài giũa kiến thức...</p>
      </div>
    );

  if (errorMsg) return (
    <Container className="mt-5">
      <Alert variant="danger">{errorMsg}</Alert>
    </Container>
  );

  const currentVocab = vocabularies[currentIndex];

  return (
    <div className={cx('wrapper')}>
      <Container>
        {/* === Modern Header === */}
        <div className={cx('header')}>
          <div className={cx('title-section')}>
            <button className={cx('btn-back')} onClick={() => navigate(-1)}>
              <IoArrowBack />
              Album của tôi
            </button>
            <h2 className="mt-3">
              {flashMode ? '🎯 Học bằng Flashcard' : '📖 Danh sách từ vựng'}
            </h2>
          </div>

          <div className={cx('actions')}>
            <Button
              className={cx('btn-outline')}
              onClick={() => navigate(`/practice/${albumId}`)}
              disabled={vocabularies.length === 0}
            >
              <IoSchoolOutline />
              Luyện tập
            </Button>

            <Button
              className={cx('btn-outline')}
              onClick={() => {
                setFlashMode(!flashMode);
                setFlipped(false);
              }}
              disabled={vocabularies.length === 0}
            >
              {flashMode ? <IoListOutline /> : <IoFlashOutline />}
              {flashMode ? 'Chế độ Danh sách' : 'Chế độ Flashcard'}
            </Button>

            <Button className={cx('btn-primary')} onClick={() => setShowModal(true)}>
              <IoAdd />
              Thêm từ vựng
            </Button>
          </div>
        </div>

        {/* === Content View === */}
        {flashMode ? (
          <div className={cx('flashcard-wrapper')}>
            <div
              className={cx('flashcard')}
              onClick={() => setFlipped(!flipped)}
            >
              <div className={cx('flashcard-inner', { flipped })}>
                <div className={cx('flashcard-front')}>
                  <div className={cx('word')}>{currentVocab.word}</div>
                  <div className={cx('phonetic')}>/{currentVocab.phonetic || '...'}/</div>
                  <button
                    className={cx('btn-play')}
                    onClick={(e) => {
                      e.stopPropagation();
                      playAudio(currentVocab.word);
                    }}
                    style={{ marginTop: '20px', border: 'none', background: '#f1f5f9', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <IoVolumeHighOutline size={24} color="#0061f2" />
                  </button>
                </div>

                <div className={cx('flashcard-back')}>
                  <div className={cx('meaning')}>{currentVocab.meaning}</div>
                  <div className={cx('example')}>"{currentVocab.example || 'Chưa có ví dụ.'}"</div>
                </div>
              </div>
            </div>

            <div className={cx('card-controls')}>
              <button
                className={cx('btn-nav')}
                disabled={currentIndex === 0}
                onClick={() => {
                  setFlipped(false);
                  setCurrentIndex((prev) => prev - 1);
                }}
              >
                <IoChevronBack />
              </button>
              <div className={cx('progress-text')}>
                {currentIndex + 1} / {vocabularies.length}
              </div>
              <button
                className={cx('btn-nav')}
                disabled={currentIndex === vocabularies.length - 1}
                onClick={() => {
                  setFlipped(false);
                  setCurrentIndex((prev) => prev + 1);
                }}
              >
                <IoChevronForward />
              </button>
            </div>
          </div>
        ) : (
          <div className={cx('table-container')}>
            <Table responsive hover>
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Từ vựng</th>
                  <th>Nghĩa</th>
                  <th>Ví dụ</th>
                  <th>Phát âm</th>
                  <th className="text-center">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {vocabularies.map((vocab, index) => (
                  <tr key={vocab.vocabId}>
                    <td className="text-muted fw-bold">{index + 1}</td>
                    <td>
                      <div className={cx('word-main')}>{vocab.word}</div>
                      <div className={cx('phonetic')}>/{vocab.phonetic}/</div>
                    </td>
                    <td className="fw-semibold">{vocab.meaning}</td>
                    <td className="text-muted fst-italic" style={{ maxWidth: '300px' }}>
                      {vocab.example || '...'}
                    </td>
                    <td className={cx('audio-cell')}>
                      <div
                        className={cx('btn-play')}
                        onClick={() => playAudio(vocab.word)}
                      >
                        <IoVolumeHighOutline size={20} />
                      </div>
                    </td>
                    <td className="text-center">
                      <button
                        className="btn btn-link text-danger p-0"
                        onClick={() => handleDelete(vocab.vocabId, vocab.word)}
                      >
                        <IoTrashOutline size={22} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {vocabularies.length === 0 && (
              <div className="text-center py-5 text-muted">
                <IoSchoolOutline size={64} className="mb-3 opacity-25" />
                <h5>Album này còn trống</h5>
                <p>Hãy thêm những từ vựng đầu tiên để bắt đầu học nhé!</p>
              </div>
            )}
          </div>
        )}
      </Container>

      {/* === Modal Thêm từ Modern === */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Form onSubmit={handleSave}>
          <Modal.Header closeButton>
            <Modal.Title>
              <IoAdd className="me-2" />
              Thêm từ vựng mới
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-4">
              <Form.Label>Từ vựng (Tiếng Anh)</Form.Label>
              <Form.Control
                name="word"
                value={newVocab.word}
                onChange={handleChange}
                placeholder="Ví dụ: Excellence"
                required
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Nghĩa (Tiếng Việt)</Form.Label>
              <Form.Control
                name="meaning"
                value={newVocab.meaning}
                onChange={handleChange}
                placeholder="Ví dụ: Sự xuất sắc"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Ví dụ minh họa</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="example"
                value={newVocab.example}
                onChange={handleChange}
                placeholder="Ví dụ: He strive for excellence in everything."
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowModal(false)}>
              Để sau
            </Button>
            <Button type="submit" className={cx('btn-primary')}>
              Lưu từ vựng
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default AlbumDetailPage;
