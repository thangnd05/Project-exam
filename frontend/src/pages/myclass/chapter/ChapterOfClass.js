import React, { useCallback, useEffect, useState } from 'react';
import axios from '../../../api/axiosClient';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Spinner, Alert } from 'react-bootstrap';
import classNames from 'classnames/bind';
import { toast } from 'react-toastify';
import {
  IoBookOutline,
  IoArrowBackOutline,
  IoDocumentTextOutline,
  IoCalendarOutline,
  IoAdd,
  IoGridOutline,
  IoListOutline,
} from 'react-icons/io5';

import styles from './ChapterOfClass.module.scss';
import CreateChapterModal from '~/components/modals/CreateChapterModal';
import UpdateChapterModal from '~/components/modals/UpdateChapterModal';
import ConfirmDeleteModal from '~/components/modals/ConfirmDeleteModal';
import PageHeader from '~/components/common/PageHeader/PageHeader';
import PageHeaderViewToggle from '~/components/common/PageHeader/PageHeaderViewToggle';
import ChapterManagementTable from '~/components/common/ChapterManagementTable/ChapterManagementTable';
import routes from '~/config/Routes';

const cx = classNames.bind(styles);

const ChapterOfClass = () => {
  const { classId } = useParams();
  const navigate = useNavigate();

  const [chapters, setChapters] = useState([]);
  const [className, setClassName] = useState('');
  const [classQr, setClassQr] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showCreateChapter, setShowCreateChapter] = useState(false);
  const [showUpdateChapter, setShowUpdateChapter] = useState(false);
  const [showDeleteChapter, setShowDeleteChapter] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  const handleViewTests = (chapterId) => {
    const path = routes.classChapterTests
      .replace(':classId', classId)
      .replace(':chapterId', chapterId);

    navigate(path);
  };

  const handleEditChapter = (chapter) => {
    setSelectedChapter(chapter);
    setShowUpdateChapter(true);
  };

  const handleDeleteChapterClick = (chapter) => {
    setSelectedChapter(chapter);
    setShowDeleteChapter(true);
  };

  const handleConfirmDeleteChapter = async () => {
    if (!selectedChapter?.chapterId) {
      return;
    }

    try {
      await axios.delete(`/api/chapters/${selectedChapter.chapterId}`);
      toast.success('Xóa chương thành công!');
      fetchChapters();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        'Không thể xóa chương. Vui lòng thử lại.',
      );
    } finally {
      setShowDeleteChapter(false);
      setSelectedChapter(null);
    }
  };

  const fetchChapters = useCallback(async () => {
    try {
      const res = await axios.get(`/api/chapters/class/${classId}`);
      setChapters(res.data || []);
    } catch (err) {
      console.error(' Lỗi load chapter:', err);
      setMessage('Không thể tải danh sách chương 😢');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    const fetchClassInfo = async () => {
      try {
        const res = await axios.get(`/api/classes/${classId}`);
        if (res.data?.className) {
          setClassName(res.data.className);
        }
        setClassQr(res.data?.classQr || '');
      } catch (err) {
        console.error(' Lỗi load class info:', err);
      }
    };

    fetchClassInfo();
    fetchChapters();
  }, [classId, fetchChapters]);

  if (loading) {
    return (
      <div className={cx('loading')}>
        <Spinner animation="border" />
        <p>Đang tải chương học...</p>
      </div>
    );
  }

  return (
    <div className={cx('wrapper')}>
      <Container className={cx('container')}>
        <button className={cx('btn-back')} onClick={() => navigate(-1)}>
          <IoArrowBackOutline />
          Quay lại lớp học
        </button>

        <PageHeader
          title={className || 'Chương trình học tập'}
          label="Danh sách nội dung học tập"
          badgeLabel={`Mã classQr: ${classQr}`}
          actionText="Tạo chương mới"
          actionIcon={IoAdd}
          onAction={() => setShowCreateChapter(true)}
        >
          <PageHeaderViewToggle
            activeKey={viewMode}
            onChange={setViewMode}
            options={[
              { key: 'grid', title: 'Dạng lưới', icon: IoGridOutline },
              { key: 'list', title: 'Dạng danh sách', icon: IoListOutline },
            ]}
          />
        </PageHeader>

        {message && (
          <Alert variant="danger" className="text-center shadow-sm">
            {message}
          </Alert>
        )}

        {chapters.length === 0 ? (
          <div className={cx('empty')}>
            <IoDocumentTextOutline size={100} />
            <h4>Lớp học hiện tại chưa có chương mục nào</h4>
            <p>Vui lòng quay lại sau hoặc liên hệ giáo viên</p>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className={cx('chapter-grid')}>
                {chapters.map((chapter, index) => (
                  <div
                    key={chapter.chapterId}
                    className={cx('chapter-card')}
                    onClick={() => handleViewTests(chapter.chapterId)}
                  >
                    <div className={cx('card-top')}>
                      <div className={cx('card-icon')}>
                        <IoBookOutline />
                      </div>
                      <span className={cx('index')}>
                        {(index + 1).toString().padStart(2, '0')}
                      </span>
                    </div>

                    <h3 className={cx('chapter-title')}>{chapter.title}</h3>

                    <div className={cx('chapter-info')}>
                      <IoCalendarOutline />
                      <span>
                        Cập nhật:{' '}
                        {new Date(chapter.createdAt).toLocaleDateString(
                          'vi-VN',
                        )}
                      </span>
                    </div>

                    <button
                      className={cx('btn-view')}
                      onClick={() => handleViewTests(chapter.chapterId)}
                    >
                      Bắt đầu học ngay
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <ChapterManagementTable
                chapters={chapters}
                onViewTests={handleViewTests}
                onEdit={handleEditChapter}
                onDelete={handleDeleteChapterClick}
              />
            )}
          </>
        )}
      </Container>

      <CreateChapterModal
        show={showCreateChapter}
        onClose={() => setShowCreateChapter(false)}
        classId={classId}
        onSuccess={() => {
          fetchChapters();
          setShowCreateChapter(false);
        }}
      />

      <UpdateChapterModal
        show={showUpdateChapter}
        onClose={() => {
          setShowUpdateChapter(false);
          setSelectedChapter(null);
        }}
        chapter={selectedChapter}
        classId={classId}
        onSuccess={fetchChapters}
      />

      <ConfirmDeleteModal
        show={showDeleteChapter}
        onClose={() => {
          setShowDeleteChapter(false);
          setSelectedChapter(null);
        }}
        onConfirm={handleConfirmDeleteChapter}
        title="Xác nhận xóa chương"
        message={`Bạn có chắc chắn muốn xóa chương "${selectedChapter?.title || ''
          }"?`}
      />
    </div>
  );
};

export default ChapterOfClass;
