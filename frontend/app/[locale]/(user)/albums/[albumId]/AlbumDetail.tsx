'use client';

import { useParams } from 'next/navigation';
import { useRouter } from '@/app/i18n/navigation';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAlbumVocabularies, useDeleteVocabulary } from './_hooks/useAlbumVocabularies';
import { getTtsUrl } from '@/app/utils/mediaUrl';
import { Container, Table } from 'react-bootstrap';
import { toast } from 'react-toastify';
import PageHeader from '@/app/components/PageHeader/PageHeader';
import CreateVocabularyModal from './_components/CreateVocabularyModal';
import BulkCreateVocabularyModal from './_components/BulkCreateVocabularyModal';
import UpdateVocabularyModal from './_components/UpdateVocabularyModal';
import ConfirmDeleteModal from '@/app/components/modal/ConfirmDeleteModal';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import EmptyState from '@/app/components/EmptyState/EmptyState';
import classNames from 'classnames/bind';
import { Plus, Trash2, Pencil, ChevronLeft, ChevronRight, GraduationCap, Volume2, CircleAlert } from 'lucide-react';
import type { VocabularyResponse } from '@/app/types';
import { BREAKPOINTS } from '@/app/assets/styles/breakpoints';

import styles from './AlbumDetail.module.scss';
import Loading from '@/app/components/Loading/Loading';

const cx = classNames.bind(styles);

const AlbumDetail = () => {
  const t = useTranslations('Vocabulary');
  const tCommon = useTranslations('Common');
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
  const errorMsg = isError ? t('albumDetail.loadError') : '';
  const deleteMutation = useDeleteVocabulary(albumId);

  useEffect(() => {
    // Màn hình nhỏ thì mặc định mở chế độ flashcard.
    if (window.innerWidth < BREAKPOINTS.md) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- đọc kích thước cửa sổ (chỉ có ở client), không tính được lúc render SSR
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
      toast.success(t('albumDetail.toast.deleted', { word: vocabToDelete.word ?? '' }));
    } catch (err) {
      console.error(' Lỗi khi xóa:', err);
      toast.error(t('albumDetail.toast.deleteError'));
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
      <Loading label={t('albumDetail.loading')} />
    );

  if (errorMsg) return (
    <Container className="mt-5">
      <EmptyState
        tone="danger"
        icon={CircleAlert}
        title={tCommon('loadErrorTitle')}
        description={errorMsg}
        action={
          <ButtonPrime variant="outline" onClick={() => fetchVocabularies()}>
            {tCommon('error.retry')}
          </ButtonPrime>
        }
      />
    </Container>
  );

  const currentVocab = vocabularies[currentIndex];

  return (
    <div className={cx('wrapper')}>
      <Container>

        <PageHeader
          title={flashMode ? t('albumDetail.flashcardTitle') : t('albumDetail.listTitle')}
          label={t('albumDetail.label')}
          onAction={() => setShowModal(true)}
          actionText={t('albumDetail.addWord')}
          actionIcon={Plus}
          onSecondaryAction={() => setShowBulkModal(true)}
          secondaryActionText={t('albumDetail.importJson')}
        />

        <div className={cx('custom-actions')}>
          <ButtonPrime variant="ghost" onClick={() => router.back()}>
            <ChevronLeft size="1em" />
            {t('albumDetail.backToAlbum')}
          </ButtonPrime>

          <div className={cx('mode-group')}>
            <ButtonPrime
              variant={!flashMode ? 'primary' : 'ghost'}
              className={cx('btn-mode')}
              onClick={() => router.push(`/practice/${albumId}`)}
              disabled={vocabularies.length === 0}
            >
              {t('albumDetail.practice')}
            </ButtonPrime>

            <ButtonPrime
              variant={flashMode ? 'primary' : 'ghost'}
              className={cx('btn-mode')}
              onClick={() => {
                setFlashMode(!flashMode);
                setFlipped(false);
              }}
              disabled={vocabularies.length === 0}
            >
              {flashMode ? t('albumDetail.listMode') : t('albumDetail.flashcardMode')}
            </ButtonPrime>
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
                  <ButtonPrime
                    variant="soft"
                    size="icon"
                    className={cx('btn-play-lg')}
                    onClick={(e) => {
                      e.stopPropagation();
                      playAudio(currentVocab.word);
                    }}
                    aria-label={t('albumDetail.table.pronunciation')}
                  >
                    <Volume2 size={24} />
                  </ButtonPrime>
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
              <ButtonPrime
                variant="soft"
                size="icon"
                disabled={currentIndex === 0}
                onClick={() => {
                  setFlipped(false);
                  setCurrentIndex((prev) => prev - 1);
                }}
              >
                <ChevronLeft size={24} />
              </ButtonPrime>
              <div className={cx('progress-text')}>
                {currentIndex + 1} / {vocabularies.length}
              </div>
              <ButtonPrime
                variant="soft"
                size="icon"
                disabled={currentIndex === vocabularies.length - 1}
                onClick={() => {
                  setFlipped(false);
                  setCurrentIndex((prev) => prev + 1);
                }}
              >
                <ChevronRight size={24} />
              </ButtonPrime>
            </div>
          </div>
        ) : (
          <div className={cx('table-container')}>
            <Table responsive hover>
              <thead>
                <tr>
                  <th>{t('albumDetail.table.index')}</th>
                  <th>{t('albumDetail.table.word')}</th>
                  <th>{t('albumDetail.table.meaning')}</th>
                  <th>{t('albumDetail.table.example')}</th>
                  <th>{t('albumDetail.table.pronunciation')}</th>
                  <th className="text-center">{t('albumDetail.table.actions')}</th>
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
                      <ButtonPrime
                        variant="soft"
                        size="icon"
                        onClick={() => playAudio(vocab.word)}
                        aria-label={t('albumDetail.table.pronunciation')}
                      >
                        <Volume2 size={20} />
                      </ButtonPrime>
                    </td>
                    <td className="text-center">
                      <div className="d-flex justify-content-center gap-2">
                        <ButtonPrime
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(vocab)}
                          title={t('albumDetail.editWord')}
                        >
                          <Pencil size={20} />
                        </ButtonPrime>
                        <ButtonPrime
                          variant="dangerGhost"
                          size="icon"
                          onClick={() => handleDeleteClick(vocab)}
                          title={t('albumDetail.deleteWord')}
                        >
                          <Trash2 size={20} />
                        </ButtonPrime>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {vocabularies.length === 0 && (
              <div className="text-center py-5 text-muted">
                <GraduationCap size={64} className="mb-3 opacity-25" />
                <h5>{t('albumDetail.empty')}</h5>
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
        title={t('albumDetail.deleteTitle')}
        message={t('albumDetail.deleteMessage', { word: vocabToDelete?.word ?? '' })}
      />
    </div>
  );
};

export default AlbumDetail;
