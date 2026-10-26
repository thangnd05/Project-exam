'use client';

import { useParams } from 'next/navigation';
import { useRouter } from '@/app/i18n/navigation';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Container } from 'react-bootstrap';
import classNames from 'classnames/bind';
import { toast } from 'react-toastify';
import { BookOpen, FileText, Calendar, Plus, LayoutGrid, List, CircleAlert } from 'lucide-react';

import styles from './ChapterOfClass.module.scss';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import EmptyState from '@/app/components/EmptyState/EmptyState';
import CreateChapterModal from './_components/CreateChapterModal';
import UpdateChapterModal from './_components/UpdateChapterModal';
import ConfirmDeleteModal from '@/app/components/modal/ConfirmDeleteModal';
import PageHeader from '@/app/components/PageHeader/PageHeader';
import PageHeaderViewToggle from '@/app/components/PageHeader/PageHeaderViewToggle';
import ChapterManagementTable from './_components/ChapterManagementTable/ChapterManagementTable';
import routes from '@/app/configs/Routes';
import { useChaptersOfClass } from './_hooks/useChaptersOfClass';
import type { ChapterResponse } from '@/app/types';
import { getApiErrorMessage } from '@/app/utils/apiError';
import Loading from '@/app/components/Loading/Loading';
import { formatDate } from '@/app/utils/format-date-time';

const cx = classNames.bind(styles);

const ChapterOfClass = () => {
  const { classId } = useParams<{ classId: string }>();
  const t = useTranslations('Classes');
  const tCommon = useTranslations('Common');
  const router = useRouter();

  const {
    chapters,
    className,
    classQr,
    isLoading: loading,
    isError,
    deleteChapterMutation,
    refetchChapters,
  } = useChaptersOfClass(classId);

  const [showCreateChapter, setShowCreateChapter] = useState(false);
  const [showUpdateChapter, setShowUpdateChapter] = useState(false);
  const [showDeleteChapter, setShowDeleteChapter] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<ChapterResponse | null>(null);
  const [viewMode, setViewMode] = useState('grid');

  const handleViewTests = (chapterId: string) => {
    const path = routes.classChapterTests
      .replace(':classId', classId)
      .replace(':chapterId', chapterId);

    router.push(path);
  };

  const handleEditChapter = (chapter: ChapterResponse) => {
    setSelectedChapter(chapter);
    setShowUpdateChapter(true);
  };

  const handleDeleteChapterClick = (chapter: ChapterResponse) => {
    setSelectedChapter(chapter);
    setShowDeleteChapter(true);
  };

  const handleConfirmDeleteChapter = async () => {
    if (!selectedChapter?.chapterId) {
      return;
    }

    try {
      await deleteChapterMutation.mutateAsync(selectedChapter.chapterId);
      toast.success(t('chapters.deleteSuccess'));
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('chapters.deleteFailed')));
    } finally {
      setShowDeleteChapter(false);
      setSelectedChapter(null);
    }
  };

  if (loading) {
    return (
      <Loading label={t('chapters.loading')} />
    );
  }

  return (
    <div className={cx('wrapper')}>
      <Container className={cx('container')}>
        <button className={cx('btn-back')} onClick={() => router.back()}>
          {t('chapters.backToClass')}
        </button>

        <PageHeader
          title={className || t('chapters.defaultTitle')}
          label={t('chapters.label')}
          badgeLabel={t('chapters.classCode', { code: classQr })}
          actionText={t('chapters.create')}
          actionIcon={Plus}
          onAction={() => setShowCreateChapter(true)}
        >
          <PageHeaderViewToggle
            activeKey={viewMode}
            onChange={setViewMode}
            options={[
              { key: 'grid', title: t('common.viewGrid'), icon: LayoutGrid },
              { key: 'list', title: t('chapters.viewList'), icon: List },
            ]}
          />
        </PageHeader>

        {isError ? (
          <EmptyState
            tone="danger"
            icon={CircleAlert}
            title={tCommon('loadErrorTitle')}
            description={t('chapters.loadFailed')}
            action={
              <ButtonPrime variant="outline" onClick={() => refetchChapters()}>
                {tCommon('error.retry')}
              </ButtonPrime>
            }
          />
        ) : chapters.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={t('chapters.emptyTitle')}
            description={t('chapters.emptyDescription')}
          />
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
                        <BookOpen size="1em" />
                      </div>
                      <span className={cx('index')}>
                        {(index + 1).toString().padStart(2, '0')}
                      </span>
                    </div>

                    <h3 className={cx('chapter-title')}>{chapter.title}</h3>

                    <div className={cx('chapter-info')}>
                      <Calendar size="1em" />
                      <span>
                        {t('chapters.updatedAt', {
                          date: formatDate(chapter.createdAt),
                        })}
                      </span>
                    </div>

                    <button
                      className={cx('btn-view')}
                      onClick={() => handleViewTests(chapter.chapterId)}
                    >
                      {t('chapters.startLearning')}
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
          refetchChapters();
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
        onSuccess={refetchChapters}
      />

      <ConfirmDeleteModal
        show={showDeleteChapter}
        onClose={() => {
          setShowDeleteChapter(false);
          setSelectedChapter(null);
        }}
        onConfirm={handleConfirmDeleteChapter}
        title={t('chapters.deleteTitle')}
        message={t('chapters.deleteMessage', { title: selectedChapter?.title || '' })}
      />
    </div>
  );
};

export default ChapterOfClass;
