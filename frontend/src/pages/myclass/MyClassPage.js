import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Spinner, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import classNames from 'classnames/bind';

import styles from './MyClassPage.module.scss';
import routes from '../../config/Routes';
import ClassListContainer from './components/ClassListContainer/ClassListContainer';
import EditClassModal from './modals/EditClassModal';
import ConfirmDeleteModal from '../../components/common/modal/ConfirmDeleteModal';
import {
  myClassesKeys,
  useMyClasses,
  useDeleteClass,
} from './hooks/useMyClasses';

const cx = classNames.bind(styles);

const MyClassesPage = () => {
  const [selectedClass, setSelectedClass] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading: loading, isError } = useMyClasses();
  const deleteMutation = useDeleteClass();

  const teachingClasses = data?.teachingClasses ?? [];
  const learningClasses = data?.learningClasses ?? [];
  const message = data?.message || (isError ? 'Không thể kết nối đến máy chủ 😢' : '');

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

  const handleConfirmDelete = () => {
    if (!selectedClass) return;

    deleteMutation.mutate(selectedClass.classId, {
      onSuccess: () => {
        toast.success(' Xóa lớp học thành công!');
        setShowDeleteModal(false);
        setSelectedClass(null);
      },
      onError: (err) => {
        toast.error(err.response?.data?.error || ' Xóa lớp học thất bại!');
      },
    });
  };

  const handleManageStudents = (classId) => {
    const path = routes.classMemberManagement.replace(':classId', classId);
    navigate(path);
  };

  const handleEditSuccess = () => {
    qc.invalidateQueries({ queryKey: myClassesKeys.all });
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
