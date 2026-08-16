'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAlbumVocabularies, useDeleteVocabulary } from './_hooks/useAlbumVocabularies';
import { getTtsUrl } from '@/app/utils/mediaUrl';
import {
  Container,
  Table,
  Spinner,
  Alert,
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import PageHeader from '@/app/components/PageHeader/PageHeader';
import CreateVocabularyModal from './_components/CreateVocabularyModal';
import BulkCreateVocabularyModal from './_components/BulkCreateVocabularyModal';
import UpdateVocabularyModal from './_components/UpdateVocabularyModal';
import ConfirmDeleteModal from '@/app/components/modal/ConfirmDeleteModal';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import classNames from 'classnames/bind';
import { IoAdd, IoFlashOutline, IoTrashOutline, IoPencilOutline, IoChevronBack, IoChevronForward, IoListOutline, IoSchoolOutline, IoVolumeHighOutline, IoCodeSlashOutline } from 'react-icons/io5';
import type { VocabularyResponse } from '@/app/types';

import styles from './AlbumDetail.module.scss';

const cx = classNames.bind(styles);

const AlbumDetail = () => {
  const { albumId } = useParams<{ albumId: string }>();
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [vocabToDelete, setVocabToDelete] = useState<VocabularyResponse | null>(null);
  const [vocabToUpdate, setVocabToUpdate] = useState<VocabularyResponse | null>(null);
  const [flashMode, setFlashMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const router = useRouter();

  const {
    vocabularies = [],
    isLoading: loading,
    isError,
    refetch: fetchVocabularies,
  } = useAlbumVocabularies(albumId);
  const errorMsg = isError ? 'Không thể tải danh sách từ vựng ' : '';
  const deleteMutation = useDeleteVocabulary(albumId);

  useEffect(() => {

    if (window.innerWidth < 768) {
      setFlashMode(true);
    }
  }, []);

  const handleDeleteClick = (vocab: VocabularyResponse) => {
    setVocabToDelete(vocab);
    setShowDeleteModal(true);
  };

  const handleEditClick = (vocab: VocabularyResponse) => {
    setVocabToUpdate(vocab);
    setShowUpdateModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!vocabToDelete) return;
    try {
      await deleteMutation.mutateAsync(vocabToDelete.vocabId);
      toast.success(`Đã xóa từ "${vocabToDelete.word}" thành công!`);
    } catch (err) {
      console.error(' Lỗi khi xóa:', err);
      toast.error('Không thể xóa từ này. Vui lòng thử lại!');
    } finally {
      setShowDeleteModal(false);
      setVocabToDelete(null);
    }
  };

  const playAudio = (word?: string) => {
    const audio = new Audio(getTtsUrl(word));
    audio.play();
  };

  if (loading)
    return (
      <div className={cx('loading-box')}>
        <Spinner animation="grow" variant="primary" size={'lg' as any} />
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

        <PageHeader
          title={flashMode ? 'Học bằng Flashcard' : 'Danh sách từ vựng'}
          label="QUẢN LÝ TỪ VỰNG"
          onAction={() => setShowModal(true)}
          actionText="Thêm từ vựng"
          actionIcon={IoAdd}
          onSecondaryAction={() => setShowBulkModal(true)}
          secondaryActionText="Nhập JSON"
          secondaryActionIcon={IoCodeSlashOutline}
        />

        <div className={cx('custom-actions')}>
          <ButtonPrime variant="ghost" onClick={() => router.back()}>
            <IoChevronBack />
            Quay lại album
          </ButtonPrime>

          <div className={cx('mode-group')}>
            <button
              className={cx('btn-mode', { active: !flashMode })}
              onClick={() => router.push(`/practice/${albumId}`)}
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
                    className={cx('btn-play', 'btn-play-lg')}
                    onClick={(e) => {
                      e.stopPropagation();
                      playAudio(currentVocab.word);
                    }}
                  >
                    <IoVolumeHighOutline size={24} />
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
              </div>
            )}
          </div>
        )}
      </Container>

      <CreateVocabularyModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={fetchVocabularies}
        albumId={albumId}
      />

      <BulkCreateVocabularyModal
        show={showBulkModal}
        onClose={() => setShowBulkModal(false)}
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

export default AlbumDetail;
