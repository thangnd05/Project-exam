'use client';

import { useRouter } from '@/app/i18n/navigation';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
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
} from '@/app/features/classes/hooks/useMyClasses';
import type { ClassStudentResponse } from '@/app/types';

const cx = classNames.bind(styles);

const MyClasses = () => {
  const [selectedClass, setSelectedClass] = useState<ClassStudentResponse | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const t = useTranslations('Classes');
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

  const message = classesMessage || (isError ? t('myClasses.connectFailed') : '');

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
        toast.success(t('myClasses.deleteSuccess'));
        setShowDeleteModal(false);
        setSelectedClass(null);
      },
      onError: (err) => {
        toast.error(err.response?.data?.error || t('myClasses.deleteFailed'));
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
        <Spinner animation="grow" variant="primary" />
        <p>{t('myClasses.loading')}</p>
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
        title={t('myClasses.title')}
        label={t('myClasses.label')}
        description={t('myClasses.description')}
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
        title={t('myClasses.deleteTitle')}
        message={t('myClasses.deleteMessage', { name: String(selectedClass?.className) })}
      />
    </>
  );
};

export default MyClasses;
