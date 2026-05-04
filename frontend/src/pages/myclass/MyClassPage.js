import React, { useEffect, useState } from 'react';
import axios from '../../api/axiosClient';
import { useNavigate } from 'react-router-dom';
import { Spinner, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import classNames from 'classnames/bind';

import styles from './MyClassPage.module.scss';
import routes from '../../config/Routes';
import ClassListContainer from '../../components/common/ClassListContainer/ClassListContainer';
import EditClassModal from '../../components/modals/EditClassModal';
import ConfirmDeleteModal from '../../components/modals/ConfirmDeleteModal';

const cx = classNames.bind(styles);

const MyClassesPage = () => {
  const [teachingClasses, setTeachingClasses] = useState([]);
  const [learningClasses, setLearningClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [selectedClass, setSelectedClass] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMyClasses = async () => {
      try {
        const res = await axios.get('/api/class-members/my-classes');
        if (res.data.message) {
          setMessage(res.data.message);
        } else {
          setTeachingClasses(res.data.teachingClasses || []);
          setLearningClasses(res.data.learningClasses || []);
        }
      } catch (err) {
        console.error(' Lỗi khi tải danh sách lớp học:', err);
        setMessage('Không thể kết nối đến máy chủ 😢');
      } finally {
        setLoading(false);
      }
    };
    fetchMyClasses();
  }, []);

  const handleViewTests = (classId) => {
    const path = routes.classChapterPage.replace(':classId', classId);
    navigate(path);
  };

  const handleManageMembers = (e, classId) => {
    e.stopPropagation();
    const path = routes.classMemberManagement.replace(':classId', classId);
    navigate(path);
  };

  const handleEditClass = (classData) => {
    setSelectedClass(classData);
    setShowEditModal(true);
  };

  const handleDeleteClass = (classData) => {
    setSelectedClass(classData);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedClass) return;

    try {
      await axios.delete(`/api/classes/${selectedClass.classId}`);
      toast.success(' Xóa lớp học thành công!');

      // Remove from local state
      setTeachingClasses((prev) =>
        prev.filter((c) => c.classId !== selectedClass.classId),
      );
      setShowDeleteModal(false);
      setSelectedClass(null);
    } catch (err) {
      toast.error(err.response?.data?.error || ' Xóa lớp học thất bại!');
    }
  };

  const handleManageStudents = (classId) => {
    const path = routes.classMemberManagement.replace(':classId', classId);
    navigate(path);
  };

  const handleEditSuccess = (updatedClass) => {
    setTeachingClasses((prev) =>
      prev.map((c) =>
        c.classId === updatedClass.classId ? { ...c, ...updatedClass } : c,
      ),
    );
  };

  if (loading) {
    return (
      <div className={cx('loading-container')}>
        <Spinner animation="grow" variant="primary" size="lg" />
        <p>Đang chuẩn bị giảng đường của bạn...</p>
      </div>
    );
  }

  return (
    <>
      {message && (
        <Alert variant="warning" className="rounded-pill text-center mx-5 mt-5">
          {message}
        </Alert>
      )}

      <ClassListContainer
        title="Lớp học của tôi"
        label="Quản lý lớp học"
        description="Quản lý và tiếp cận kho học liệu từ các khóa học bạn tham gia"
        teachingClasses={teachingClasses}
        learningClasses={learningClasses}
        onViewTests={handleViewTests}
        onManageMembers={handleManageMembers}
        onEditClass={handleEditClass}
        onDeleteClass={handleDeleteClass}
        onManageStudents={handleManageStudents}
      />

      <EditClassModal
        show={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedClass(null);
        }}
        classData={selectedClass}
        onSuccess={handleEditSuccess}
      />

      <ConfirmDeleteModal
        show={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedClass(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Xóa lớp học"
        message={`Bạn có chắc chắn muốn xóa lớp "${selectedClass?.className}"? Hành động này không thể hoàn tác.`}
      />
    </>
  );
};

export default MyClassesPage;
