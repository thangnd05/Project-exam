import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner, Container } from 'react-bootstrap';
import { toast } from 'react-toastify';
import classNames from 'classnames/bind';
import { motion } from 'framer-motion';
import { IoAddCircleOutline, IoFolderOpenOutline, IoDocumentTextOutline, IoGridOutline, IoListOutline, IoAdd } from "react-icons/io5";
import { FaBook } from "react-icons/fa";

import styles from './MyAlbumPage.module.scss';

import CreateAlbumModal from './modals/CreateAlbumModal';
import UpdateAlbumModal from './modals/UpdateAlbumModal';
import ConfirmDeleteModal from '~/shared/ui/modal/ConfirmDeleteModal';
import PageHeader from '~/shared/ui/PageHeader/PageHeader';
import PageHeaderViewToggle from '~/shared/ui/PageHeader/PageHeaderViewToggle';
import AlbumManagementTable from './components/AlbumManagementTable/AlbumManagementTable';
import { useMyAlbums } from './hooks/useMyAlbums';

const cx = classNames.bind(styles);

const albumCardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay: i * 0.06,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

function MyAlbumsPage() {
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState(null);
  const [albumToDelete, setAlbumToDelete] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const navigate = useNavigate();

  const { albums, isLoading: loading, refetchAlbums, deleteAlbumMutation } = useMyAlbums();

  const handleDeleteAlbum = (album) => {
    setAlbumToDelete(album);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (!albumToDelete) return;

    deleteAlbumMutation.mutate(albumToDelete.albumId, {
      onSuccess: () => {
        toast.success("Xóa Album thành công!");
      },
      onError: (err) => {
        console.error(' Lỗi xóa album:', err);
        toast.error(" Có lỗi xảy ra khi xóa Album!");
      },
      onSettled: () => {
        setShowDeleteModal(false);
        setAlbumToDelete(null);
      },
    });
  };

  const handleEditAlbum = (album) => {
    setEditingAlbum(album);
    setShowEditModal(true);
  };

  if (loading)
    return (
      <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="grow" variant="primary" size="lg" />
        <p className="mt-3 fw-bold text-primary fs-4">Đang chuẩn bị kho tàng từ vựng...</p>
      </div>
    );

  return (
    <div className={cx('wrapper')}>
      <Container>

        <PageHeader
          title="THẺ GHI NHỚ"
          label="QUẢN LÝ ALBUM"
          actionText="Tạo album mới"
          actionIcon={IoAdd}
          onAction={() => setShowModal(true)}
        >
          <PageHeaderViewToggle
            activeKey={viewMode}
            onChange={setViewMode}
            options={[
              { key: 'grid', title: 'Dạng lưới', icon: IoGridOutline },
              { key: 'table', title: 'Dạng danh sách', icon: IoListOutline },
            ]}
          />
        </PageHeader>

        <div className={cx('content-section')}>
          {albums.length === 0 ? (
            <motion.div
              className={cx('empty-state')}
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className={cx('empty-icon')}>
                <IoFolderOpenOutline />
              </div>
              <h4>Chưa có album nào</h4>
              <p>Bắt đầu tạo album đầu tiên để lưu lại các từ vựng thú vị nhé!</p>
              <button className={cx('btn-create-empty')} onClick={() => setShowModal(true)}>
                <IoAddCircleOutline />
                Tạo album ngay
              </button>
            </motion.div>
          ) : viewMode === 'grid' ? (
            <div className={cx('album-grid')}>
              {albums.map((album, index) => (
                <motion.div
                  key={album.albumId}
                  className={cx('album-card')}
                  onClick={() => navigate(`/albums/${album.albumId}`)}
                  custom={index}
                  initial="hidden"
                  animate="visible"
                  variants={albumCardVariants}
                  whileHover={{ y: -6 }}
                >
                  <div className={cx('card-top')}>
                    <div className={cx('card-icon')}>
                      <FaBook />
                    </div>
                    <span className={cx('index')}>
                      {(index + 1).toString().padStart(2, '0')}
                    </span>
                  </div>

                  <h3 className={cx('album-title')}>{album.name}</h3>

                  <div className={cx('album-info')}>
                    <span>
                      {album.description || 'Hành trình chinh phục từ vựng mỗi ngày'}
                    </span>
                  </div>

                  <button className={cx('btn-view')}>
                    Bắt đầu học ngay
                  </button>
                </motion.div>
              ))}
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
        title="Xác nhận xóa Album"
        message={`Bạn có chắc chắn muốn xóa album "${albumToDelete?.name}"? Mọi từ vựng trong album sẽ bị ảnh hưởng.`}
      />
    </div>
  );
}

export default MyAlbumsPage;
