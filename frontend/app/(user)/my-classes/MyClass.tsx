'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Spinner, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import classNames from 'classnames/bind';

import styles from './MyClass.module.scss';
import routes from '@/app/configs/Routes';
import ClassListContainer from './_components/ClassListContainer/ClassListContainer';
import EditClassModal from './_components/EditClassModal';
import ConfirmDeleteModal from '@/app/components/modal/ConfirmDeleteModal';
import {
  myClassesKeys,
  useMyClasses,
  useDeleteClass,
} from '@/app/hooks/useMyClasses';
import type { ClassStudentResponse } from '@/app/types';

const cx = classNames.bind(styles);

const MyClasses = () => {
  const [selectedClass, setSelectedClass] = useState<ClassStudentResponse | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const router = useRouter();
  const qc = useQueryClient();

  const {
    teachingClasses,
    learningClasses,
    message: classesMessage,
    isLoading: loading,
    isError,
  } = useMyClasses();
  const deleteMutation = useDeleteClass();

  const message = classesMessage || (isError ? 'Không thể kết nối đến máy chủ ' : '');

  const handleViewTests = (classId: string) => {
    const path = routes.classChapterPage.replace(':classId', classId);
    router.push(path);
  };

  const handleManageMembers = (e: React.MouseEvent, classId: string) => {
    e.stopPropagation();
    const path = routes.classMemberManagement.replace(':classId', classId);
    router.push(path);
  };

  const handleEditClass = (classData: ClassStudentResponse) => {
    setSelectedClass(classData);
    setShowEditModal(true);
  };

  const handleDeleteClass = (classData: ClassStudentResponse) => {
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

  const handleManageStudents = (classId: string) => {
    const path = routes.classMemberManagement.replace(':classId', classId);
    router.push(path);
  };

  const handleEditSuccess = () => {
    qc.invalidateQueries({ queryKey: myClassesKeys.all });
  };

  if (loading) {
    return (
      <div className={cx('loading-container')}>
        {/* size 'lg' as any: type react-bootstrap chỉ nhận 'sm' nhưng bản JS cũ truyền 'lg' */}
        <Spinner animation="grow" variant="primary" size={'lg' as any} />
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

export default MyClasses;
