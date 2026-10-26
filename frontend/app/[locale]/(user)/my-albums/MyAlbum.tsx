'use client';

import { useRouter } from '@/app/i18n/navigation';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Container } from 'react-bootstrap';
import { toast } from 'react-toastify';
import classNames from 'classnames/bind';
import { motion, type Variants } from 'framer-motion';
import { FolderOpen, LayoutGrid, List, Plus } from "lucide-react";

import styles from './MyAlbum.module.scss';

import CreateAlbumModal from './_components/CreateAlbumModal';
import UpdateAlbumModal from './_components/UpdateAlbumModal';
import ConfirmDeleteModal from '@/app/components/modal/ConfirmDeleteModal';
import PageHeader from '@/app/components/PageHeader/PageHeader';
import PageHeaderViewToggle from '@/app/components/PageHeader/PageHeaderViewToggle';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import EmptyState from '@/app/components/EmptyState/EmptyState';
import AlbumManagementTable from './_components/AlbumManagementTable/AlbumManagementTable';
import { useMyAlbums } from './_hooks/useAlbums';
import type { VocabularyAlbumResponse } from '@/app/types';
import Loading from '@/app/components/Loading/Loading';

const cx = classNames.bind(styles);

const buildRingGradient = (pct: number) => {
  const p = Math.max(0, Math.min(100, pct));
  return `conic-gradient(var(--primary) ${p}%, #e9eef5 ${p}% 100%)`;
};

const albumCardVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay: i * 0.06,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

function MyAlbum() {
  const t = useTranslations('Vocabulary');
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<VocabularyAlbumResponse | null>(null);
  const [albumToDelete, setAlbumToDelete] = useState<VocabularyAlbumResponse | null>(null);
  const [viewMode, setViewMode] = useState('grid');
  const router = useRouter();

  const { albums, isLoading: loading, refetchAlbums, deleteAlbumMutation } = useMyAlbums();

  const handleDeleteAlbum = (album: VocabularyAlbumResponse) => {
    setAlbumToDelete(album);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (!albumToDelete) return;

    deleteAlbumMutation.mutate(albumToDelete.albumId, {
      onSuccess: () => {
        toast.success(t('myAlbums.toast.deleted'));
      },
      onError: (err) => {
        console.error(' Lỗi xóa album:', err);
        toast.error(t('myAlbums.toast.deleteError'));
      },
      onSettled: () => {
        setShowDeleteModal(false);
        setAlbumToDelete(null);
      },
    });
  };

  const handleEditAlbum = (album: VocabularyAlbumResponse) => {
    setEditingAlbum(album);
    setShowEditModal(true);
  };

  if (loading)
    return (
      <Loading label={t('myAlbums.loading')} />
    );

  return (
    <div className={cx('wrapper')}>
      <Container>

        <PageHeader
          title={t('myAlbums.title')}
          label={t('myAlbums.label')}
          actionText={t('myAlbums.createAction')}
          actionIcon={Plus}
          onAction={() => setShowModal(true)}
        >
          <PageHeaderViewToggle
            activeKey={viewMode}
            onChange={setViewMode}
            options={[
              { key: 'grid', title: t('myAlbums.gridView'), icon: LayoutGrid },
              { key: 'table', title: t('myAlbums.listView'), icon: List },
            ]}
          />
        </PageHeader>

        <div className={cx('content-section')}>
          {albums.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title={t('myAlbums.emptyTitle')}
              description={t('myAlbums.emptyDescription')}
              action={
                <ButtonPrime variant="primary" onClick={() => setShowModal(true)}>
                  {t('myAlbums.createNow')}
                </ButtonPrime>
              }
            />
          ) : viewMode === 'grid' ? (
            <div className={cx('album-grid')}>
              {albums.map((album, index) => {
                const total = album.totalWords || 0;
                const mastered = album.masteredWords || 0;
                const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;
                const hasStarted = mastered > 0;
                return (
                  <motion.div
                    key={album.albumId}
                    className={cx('album-card')}
                    onClick={() => router.push(`/albums/${album.albumId}`)}
                    custom={index}
                    initial="hidden"
                    animate="visible"
                    variants={albumCardVariants}
                    whileHover={{ y: -6 }}
                  >
                    <div className={cx('card-top')}>
                      <h3 className={cx('album-title')}>{album.name}</h3>
                      <span className={cx('index')}>
                        {(index + 1).toString().padStart(2, '0')}
                      </span>
                    </div>

                    <div className={cx('progress-body')}>
                      <div
                        className={cx('gauge-ring')}
                        style={{ background: buildRingGradient(pct) }}
                      >
                        <div className={cx('gauge-hole')}>
                          <span className={cx('gauge-pct')}>{pct}%</span>
                        </div>
                      </div>

                      <div className={cx('progress-stats')}>
                        <div className={cx('stat-total')}>
                          <span className={cx('stat-num')}>{total}</span>
                          <span className={cx('stat-unit')}>{t('myAlbums.wordUnit', { count: total })}</span>
                        </div>
                        <div className={cx('stat-sub')}>
                          {t.rich('myAlbums.mastered', {
                            count: mastered,
                            strong: (chunks) => <strong>{chunks}</strong>,
                          })}
                        </div>
                      </div>
                    </div>

                    <div className={cx('cta')}>
                      <ButtonPrime variant="primary" fullWidth>
                        {hasStarted ? t('myAlbums.continue') : t('myAlbums.start')}
                      </ButtonPrime>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <AlbumManagementTable
              albums={albums}
              onDelete={handleDeleteAlbum}
              onEdit={handleEditAlbum}
            />
          )}
        </div>
      </Container>

      <CreateAlbumModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={refetchAlbums}
      />

      <UpdateAlbumModal
        show={showEditModal}
        album={editingAlbum}
        onClose={() => {
          setShowEditModal(false);
          setEditingAlbum(null);
        }}
        onSuccess={refetchAlbums}
      />

      <ConfirmDeleteModal
        show={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setAlbumToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title={t('myAlbums.deleteTitle')}
        message={t('myAlbums.deleteMessage', { name: albumToDelete?.name ?? '' })}
      />
    </div>
  );
}

export default MyAlbum;
