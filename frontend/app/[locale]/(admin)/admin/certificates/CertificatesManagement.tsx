'use client';

import { useMemo, useState } from 'react';
import { Badge, Button, Form } from 'react-bootstrap';
import { Edit, Plus, Trash2, ShieldX } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import ConfirmDeleteModal from '@/app/components/modal/ConfirmDeleteModal';
import ConfirmModal from '@/app/components/modal/ConfirmModal';
import CertificateTemplateFormModal, {
  type CertificateTemplateFormState,
} from './_components/CertificateTemplateFormModal';
import {
  AdminFieldError,
  AdminPageHeader,
  AdminTable,
  AdminTabs,
  AdminToolbar,
  StatCard,
  StatCardGroup,
} from '@/app/[locale]/(admin)/_components/common';
import type { AdminTableColumn } from '@/app/[locale]/(admin)/_components/common/AdminTable';
import { CertificateStatus } from '@/app/enums';
import type {
  CertificateResponse,
  CertificateTemplateRequest,
  CertificateTemplateResponse,
} from '@/app/types';
import { getApiErrorMessage } from '@/app/utils/apiError';
import {
  useCertificateTemplates,
  useIssuedCertificates,
} from './_hooks/useCertificateAdmin';

const PAGE_SIZE = 20;

const emptyForm: CertificateTemplateFormState = {
  examTypeId: '',
  passScore: '',
  title: '',
  subtitle: '',
  bodyText: '',
  footerNote: '',
  logoUrl: '',
  backgroundUrl: '',
  accentColor: '',
  issuerName: '',
  signatureName: '',
  signatureTitle: '',
  signatureImageUrl: '',
  validMonths: '',
  active: true,
};

const buildPayload = (formState: CertificateTemplateFormState): CertificateTemplateRequest => ({
  examTypeId: formState.examTypeId,
  passScore: Number(formState.passScore),
  title: formState.title.trim(),
  subtitle: formState.subtitle?.trim() || undefined,
  bodyText: formState.bodyText?.trim() || undefined,
  footerNote: formState.footerNote?.trim() || undefined,
  logoUrl: formState.logoUrl?.trim() || undefined,
  backgroundUrl: formState.backgroundUrl?.trim() || undefined,
  accentColor: formState.accentColor?.trim() || undefined,
  issuerName: formState.issuerName?.trim() || undefined,
  signatureName: formState.signatureName?.trim() || undefined,
  signatureTitle: formState.signatureTitle?.trim() || undefined,
  signatureImageUrl: formState.signatureImageUrl?.trim() || undefined,
  validMonths: formState.validMonths ? Number(formState.validMonths) : undefined,
  active: formState.active !== false,
});

const formatDate = (locale: string, value?: string) =>
  value ? new Date(value).toLocaleDateString(locale === 'en' ? 'en-US' : 'vi-VN') : '-';

function CertificatesManagement() {
  const t = useTranslations('AdminSystem.certificates');
  const locale = useLocale();
  const [tab, setTab] = useState('templates');
  const [errorMessage, setErrorMessage] = useState('');

  const {
    templates,
    examTypes,
    isLoading,
    isError,
    createMutation,
    updateMutation,
    deleteMutation,
  } = useCertificateTemplates();

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<CertificateTemplateFormState>(emptyForm);
  const [deletingTemplate, setDeletingTemplate] = useState<CertificateTemplateResponse | null>(null);
  const [templateSearch, setTemplateSearch] = useState('');

  const [issuedPage, setIssuedPage] = useState(0);
  const [issuedKeyword, setIssuedKeyword] = useState('');
  const [issuedStatus, setIssuedStatus] = useState('');
  const [revokingCertificate, setRevokingCertificate] = useState<CertificateResponse | null>(null);
  const [deletingCertificate, setDeletingCertificate] = useState<CertificateResponse | null>(null);

  const issuedParams = useMemo(
    () => ({
      page: issuedPage,
      size: PAGE_SIZE,
      keyword: issuedKeyword.trim() || undefined,
      status: issuedStatus || undefined,
    }),
    [issuedPage, issuedKeyword, issuedStatus],
  );

  const {
    certificates,
    totalPages,
    totalElements,
    isLoading: issuedLoading,
    isError: issuedError,
    revokeMutation,
    deleteMutation: deleteIssuedMutation,
  } = useIssuedCertificates(issuedParams);

  const filteredTemplates = templates.filter((item) => {
    const keyword = templateSearch.trim().toLowerCase();
    if (!keyword) return true;
    return (
      (item.title || '').toLowerCase().includes(keyword) ||
      (item.examTypeName || '').toLowerCase().includes(keyword)
    );
  });

  const totalIssued = templates.reduce((sum, item) => sum + (item.issuedCount || 0), 0);
  const activeTemplates = templates.filter((item) => item.active).length;

  const handleChangeField = (field: string, value: string | boolean) =>
    setFormState((prev) => ({ ...prev, [field]: value }));

  const openCreateModal = () => {
    setEditingId(null);
    setFormState(emptyForm);
    setErrorMessage('');
    setShowFormModal(true);
  };

  const openEditModal = (item: CertificateTemplateResponse) => {
    setEditingId(item.templateId);
    setFormState({
      examTypeId: item.examTypeId || '',
      passScore: item.passScore ?? '',
      title: item.title || '',
      subtitle: item.subtitle || '',
      bodyText: item.bodyText || '',
      footerNote: item.footerNote || '',
      logoUrl: item.logoUrl || '',
      backgroundUrl: item.backgroundUrl || '',
      accentColor: item.accentColor || '',
      issuerName: item.issuerName || '',
      signatureName: item.signatureName || '',
      signatureTitle: item.signatureTitle || '',
      signatureImageUrl: item.signatureImageUrl || '',
      validMonths: item.validMonths ?? '',
      active: item.active !== false,
    });
    setErrorMessage('');
    setShowFormModal(true);
  };

  const handleSubmit = async () => {
    if (!formState.examTypeId) {
      setErrorMessage(t('errors.examTypeRequired'));
      return;
    }
    if (formState.passScore === '' || Number.isNaN(Number(formState.passScore))) {
      setErrorMessage(t('errors.passScoreNumber'));
      return;
    }
    if (!formState.title.trim()) {
      setErrorMessage(t('errors.titleRequired'));
      return;
    }

    setErrorMessage('');
    try {
      const payload = buildPayload(formState);
      if (editingId) {
        await updateMutation.mutateAsync({ templateId: editingId, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      setShowFormModal(false);
      setFormState(emptyForm);
      setEditingId(null);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t('errors.saveFailed')));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTemplate) return;
    try {
      await deleteMutation.mutateAsync(deletingTemplate.templateId);
      setDeletingTemplate(null);
    } catch {
      setErrorMessage(t('errors.deleteTemplateFailed'));
    }
  };

  const handleConfirmDeleteIssued = async () => {
    if (!deletingCertificate) return;
    try {
      await deleteIssuedMutation.mutateAsync(deletingCertificate.certificateId);
      setDeletingCertificate(null);
    } catch {
      setErrorMessage(t('errors.deleteCertificateFailed'));
    }
  };

  const handleConfirmRevoke = async () => {
    if (!revokingCertificate) return;
    try {
      await revokeMutation.mutateAsync({
        certificateId: revokingCertificate.certificateId,
        reason: 'Thu hồi bởi quản trị viên',
      });
      setRevokingCertificate(null);
    } catch {
      setErrorMessage(t('errors.revokeFailed'));
    }
  };

  const templateColumns: AdminTableColumn[] = [
    { key: 'examTypeName', header: t('columns.examType'), render: (item: CertificateTemplateResponse) => item.examTypeName || '-' },
    { key: 'title', header: t('columns.title') },
    {
      key: 'passScore',
      header: t('columns.passScore'),
      render: (item: CertificateTemplateResponse) => <Badge bg="primary">{item.passScore}</Badge>,
    },
    {
      key: 'validMonths',
      header: t('columns.validity'),
      render: (item: CertificateTemplateResponse) => (item.validMonths ? t('validMonths', { count: item.validMonths }) : t('noExpiry')),
    },
    { key: 'issuedCount', header: t('columns.issued'), render: (item: CertificateTemplateResponse) => item.issuedCount ?? 0 },
    {
      key: 'active',
      header: t('columns.status'),
      render: (item: CertificateTemplateResponse) =>
        item.active ? (
          <Badge bg="success">{t('enabled')}</Badge>
        ) : (
          <Badge bg="secondary">{t('disabled')}</Badge>
        ),
    },
  ];

  const issuedColumns: AdminTableColumn[] = [
    { key: 'recipientName', header: t('columns.recipient') },
    {
      key: 'certificateCode',
      header: t('columns.code'),
      render: (item: CertificateResponse) => <code>{item.certificateCode}</code>,
    },
    { key: 'testTitle', header: t('columns.test'), render: (item: CertificateResponse) => item.testTitle || '-' },
    { key: 'score', header: t('columns.score') },
    { key: 'issuedAt', header: t('columns.issuedAt'), render: (item: CertificateResponse) => formatDate(locale, item.issuedAt) },
    {
      key: 'status',
      header: t('columns.status'),
      render: (item: CertificateResponse) => {
        if (item.status === CertificateStatus.REVOKED) return <Badge bg="danger">{t('statusRevoked')}</Badge>;
        if (item.expired) return <Badge bg="warning" text="dark">{t('statusExpired')}</Badge>;
        return <Badge bg="success">{t('statusActive')}</Badge>;
      },
    },
  ];

  return (
    <div className="d-flex flex-column gap-3">
      <AdminPageHeader
        title={t('title')}
        description={t('description')}
      >
        {tab === 'templates' && (
          <Button onClick={openCreateModal}>
            <Plus size={16} className="me-1" />
            {t('addTemplate')}
          </Button>
        )}
      </AdminPageHeader>

      <StatCardGroup>
        <StatCard label={t('stats.templates')} value={templates.length} />
        <StatCard label={t('stats.activeTemplates')} value={activeTemplates} />
        <StatCard label={t('stats.validCertificates')} value={totalIssued} />
      </StatCardGroup>

      <AdminFieldError message={errorMessage} />
      {isError && <AdminFieldError message={t('errors.loadTemplates')} />}
      {issuedError && <AdminFieldError message={t('errors.loadIssued')} />}

      <AdminTabs
        activeKey={tab}
        onSelect={setTab as (key?: string) => void}
        items={[
          {key: 'templates', label: t('tabs.templates')},
          {key: 'issued', label: t('tabs.issued')},
        ]}
      />

      {tab === 'templates' ? (
        <>
          <AdminToolbar
            searchValue={templateSearch}
            onSearchChange={setTemplateSearch}
            searchPlaceholder={t('templateSearchPlaceholder')}
          />
          <AdminTable
            columns={templateColumns}
            data={filteredTemplates}
            loading={isLoading}
            getRowKey={(item: CertificateTemplateResponse) => item.templateId}
            emptyText={t('templatesEmpty')}
            rowActions={(item: CertificateTemplateResponse) => (
              <>
                <Button variant="light" size="sm" onClick={() => openEditModal(item)}>
                  <Edit size={16} />
                </Button>
                <Button
                  variant="light"
                  size="sm"
                  onClick={() => setDeletingTemplate(item)}
                >
                  <Trash2 size={16} />
                </Button>
              </>
            )}
          />
        </>
      ) : (
        <>
          <AdminToolbar
            searchValue={issuedKeyword}
            onSearchChange={(value: string) => {
              setIssuedKeyword(value);
              setIssuedPage(0);
            }}
            searchPlaceholder={t('issuedSearchPlaceholder')}
          >
            <Form.Select
              value={issuedStatus}
              onChange={(event) => {
                setIssuedStatus(event.target.value);
                setIssuedPage(0);
              }}
              style={{ width: 200 }}
            >
              <option value="">{t('allStatuses')}</option>
              <option value="ACTIVE">{t('statusActive')}</option>
              <option value="REVOKED">{t('statusRevoked')}</option>
            </Form.Select>
          </AdminToolbar>

          <AdminTable
            columns={issuedColumns}
            data={certificates}
            loading={issuedLoading}
            getRowKey={(item: CertificateResponse) => item.certificateId}
            emptyText={t('issuedEmpty')}
            itemLabel={t('itemLabel')}
            pageSize={PAGE_SIZE}
            page={issuedPage}
            totalPages={totalPages}
            totalElements={totalElements}
            onPageChange={setIssuedPage}
            rowActions={(item: CertificateResponse) => (
              <>
                {item.status === CertificateStatus.ACTIVE && (
                  <Button
                    variant="light"
                    size="sm"
                    title={t('revokeTitle')}
                    onClick={() => setRevokingCertificate(item)}
                  >
                    <ShieldX size={16} />
                  </Button>
                )}
                <Button
                  variant="light"
                  size="sm"
                  title={t('deletePermanently')}
                  onClick={() => setDeletingCertificate(item)}
                >
                  <Trash2 size={16} />
                </Button>
              </>
            )}
          />
        </>
      )}

      <CertificateTemplateFormModal
        show={showFormModal}
        isEditing={Boolean(editingId)}
        formState={formState}
        examTypes={examTypes}
        onChangeField={handleChangeField}
        onClose={() => setShowFormModal(false)}
        onSubmit={handleSubmit}
        submitting={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmDeleteModal
        show={Boolean(deletingTemplate)}
        onClose={() => setDeletingTemplate(null)}
        onConfirm={handleConfirmDelete}
        message={t('deleteTemplateMessage', { title: deletingTemplate?.title || '' })}
      />

      <ConfirmDeleteModal
        show={Boolean(deletingCertificate)}
        onClose={() => setDeletingCertificate(null)}
        onConfirm={handleConfirmDeleteIssued}
        message={t('deleteCertificateMessage', {
          code: deletingCertificate?.certificateCode || '',
          name: deletingCertificate?.recipientName || '',
        })}
      />

      <ConfirmModal
        show={Boolean(revokingCertificate)}
        onClose={() => setRevokingCertificate(null)}
        onConfirm={handleConfirmRevoke}
        title={t('revokeTitle')}
        message={t('revokeMessage', {
          code: revokingCertificate?.certificateCode || '',
          name: revokingCertificate?.recipientName || '',
        })}
        confirmText={t('revoke')}
        variant="danger"
      />
    </div>
  );
}

export default CertificatesManagement;
