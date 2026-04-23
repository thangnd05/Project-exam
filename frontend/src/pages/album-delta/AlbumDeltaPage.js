import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Table,
  Spinner,
  Alert,
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import PageHeader from '~/components/common/PageHeader/PageHeader';
import CreateVocabularyModal from '~/components/vocabulary/CreateVocabularyModal';
import UpdateVocabularyModal from '~/components/vocabulary/UpdateVocabularyModal';
import ConfirmDeleteModal from '~/components/modals/ConfirmDeleteModal';
import classNames from 'classnames/bind';
import {
  IoArrowBack,
  IoAdd,
  IoFlashOutline,
  IoTrashOutline,
  IoPencilOutline,
  IoChevronBack,
  IoChevronForward,
  IoListOutline,
  IoSchoolOutline,
  IoVolumeHighOutline
} from 'react-icons/io5';

import styles from './AlbumDeltaPage.module.scss';

const cx = classNames.bind(styles);

const AlbumDetailPage = () => {
  const backendBaseUrl = (axios.defaults.baseURL || process.env.REACT_APP_API_BASE_URL || '').replace(/\/$/, '');
  const { albumId } = useParams();
  const [vocabularies, setVocabularies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [vocabToDelete, setVocabToDelete] = useState(null);
  const [vocabToUpdate, setVocabToUpdate] = useState(null);
  const [flashMode, setFlashMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const navigate = useNavigate();

  const fetchVocabularies = useCallback(async () => {
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
  }, [albumId]);

  useEffect(() => {
    if (albumId) fetchVocabularies();

    // Auto-switch to Flashcard mode for mobile/tablet devices
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setFlashMode(true);
      }
    };

    handleResize(); // Check on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [albumId, fetchVocabularies]);

  const handleDeleteClick = (vocab) => {
    setVocabToDelete(vocab);
    setShowDeleteModal(true);
  };

  const handleEditClick = (vocab) => {
    setVocabToUpdate(vocab);
    setShowUpdateModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!vocabToDelete) return;
    try {
      await axios.delete(`/api/vocabularies/${vocabToDelete.vocabId}`, {
        withCredentials: true,
      });
      setVocabularies((prev) => prev.filter((v) => v.vocabId !== vocabToDelete.vocabId));
      toast.success(`Đã xóa từ "${vocabToDelete.word}" thành công!`);
    } catch (err) {
      console.error('❌ Lỗi khi xóa:', err);
      toast.error('Không thể xóa từ này. Vui lòng thử lại!');
    } finally {
      setShowDeleteModal(false);
      setVocabToDelete(null);
    }
  };

  const playAudio = (word) => {
    const ttsUrl = `${backendBaseUrl}/api/tts?text=${encodeURIComponent(word)}`;
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
        {/* === Standardized Page Header === */}
        <PageHeader
          title={flashMode ? '🎯 Học bằng Flashcard' : '📖 Danh sách từ vựng'}
          label="QUẢN LÝ TỪ VỰNG"
          onAction={() => setShowModal(true)}
          actionText="Thêm từ vựng"
          actionIcon={IoAdd}
        />

        <div className={cx('custom-actions')}>
          <button className={cx('btn-back')} onClick={() => navigate(-1)}>
            <IoArrowBack />
            Quay lại album
          </button>

          <div className={cx('mode-group')}>
            <button
              className={cx('btn-mode', { active: !flashMode })}
              onClick={() => navigate(`/practice/${albumId}`)}
              disabled={vocabularies.length === 0}
            >
              <IoSchoolOutline />
              Luyện tập
            </button>

            <button
              className={cx('btn-mode', { active: flashMode })}
              onClick={() => {
                setFlashMode(!flashMode);
                setFlipped(false);
              }}
              disabled={vocabularies.length === 0}
            >
              {flashMode ? <IoListOutline /> : <IoFlashOutline />}
              {flashMode ? 'Chế độ Danh sách' : 'Chế độ Flashcard'}
            </button>
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
                  {currentVocab.example && (
                    <div className={cx('example')}>"{currentVocab.example}"</div>
                  )}
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
                      {vocab.example || ''}
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
                      <div className="d-flex justify-content-center gap-2">
                        <button
                          className="btn btn-link text-primary p-0"
                          onClick={() => handleEditClick(vocab)}
                          title="Sửa từ vựng"
                        >
                          <IoPencilOutline size={22} />
                        </button>
                        <button
                          className="btn btn-link text-danger p-0"
                          onClick={() => handleDeleteClick(vocab)}
                          title="Xóa từ vựng"
                        >
                          <IoTrashOutline size={22} />
                        </button>
                      </div>
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

      {/* === Modern Modals === */}
      <CreateVocabularyModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={fetchVocabularies}
        albumId={albumId}
      />

      <UpdateVocabularyModal
        show={showUpdateModal}
        vocab={vocabToUpdate}
        onClose={() => {
          setShowUpdateModal(false);
          setVocabToUpdate(null);
        }}
        onSuccess={fetchVocabularies}
      />

      <ConfirmDeleteModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa từ vựng"
        message={`Bạn có chắc chắn muốn xóa từ "${vocabToDelete?.word}" khỏi album này?`}
      />
    </div>
  );
};

export default AlbumDetailPage;
