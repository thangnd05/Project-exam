import { useMemo, useState } from 'react';
import { Badge, Button, Form, Nav } from 'react-bootstrap';
import { Edit, Plus, Trash2, ShieldX } from 'lucide-react';

import ConfirmDeleteModal from '~/shared/ui/modal/ConfirmDeleteModal';
import ConfirmModal from '~/shared/ui/modal/ConfirmModal';
import CertificateTemplateFormModal from './CertificateTemplateFormModal';
import {
  AdminFieldError,
  AdminPageHeader,
  AdminTable,
  AdminToolbar,
  StatCard,
  StatCardGroup,
} from '../components/common';
import {
  useCertificateTemplates,
  useIssuedCertificates,
} from './hooks/useCertificateAdmin';

const PAGE_SIZE = 20;

const emptyForm = {
  examTypeId: '',
  passScore: '',
  title: '',
  subtitle: '',
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

const buildPayload = (formState) => ({
  examTypeId: formState.examTypeId,
  passScore: Number(formState.passScore),
  title: formState.title.trim(),
  subtitle: formState.subtitle?.trim() || null,
  footerNote: formState.footerNote?.trim() || null,
  logoUrl: formState.logoUrl?.trim() || null,
  backgroundUrl: formState.backgroundUrl?.trim() || null,
  accentColor: formState.accentColor?.trim() || null,
  issuerName: formState.issuerName?.trim() || null,
  signatureName: formState.signatureName?.trim() || null,
  signatureTitle: formState.signatureTitle?.trim() || null,
  signatureImageUrl: formState.signatureImageUrl?.trim() || null,
  validMonths: formState.validMonths ? Number(formState.validMonths) : null,
  active: formState.active !== false,
});

const formatDate = (value) => (value ? new Date(value).toLocaleDateString('vi-VN') : '-');

function CertificatesManagementPage() {
  const [tab, setTab] = useState('templates');
  const [errorMessage, setErrorMessage] = useState('');

  // ---- mẫu chứng chỉ
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
  const [editingId, setEditingId] = useState(null);
  const [formState, setFormState] = useState(emptyForm);
  const [deletingTemplate, setDeletingTemplate] = useState(null);
  const [templateSearch, setTemplateSearch] = useState('');

  // ---- chứng chỉ đã cấp
  const [issuedPage, setIssuedPage] = useState(0);
  const [issuedKeyword, setIssuedKeyword] = useState('');
  const [issuedStatus, setIssuedStatus] = useState('');
  const [revokingCertificate, setRevokingCertificate] = useState(null);
  const [deletingCertificate, setDeletingCertificate] = useState(null);

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

  const handleChangeField = (field, value) =>
    setFormState((prev) => ({ ...prev, [field]: value }));

  const openCreateModal = () => {
    setEditingId(null);
    setFormState(emptyForm);
    setErrorMessage('');
    setShowFormModal(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.templateId);
    setFormState({
      examTypeId: item.examTypeId || '',
      passScore: item.passScore ?? '',
      title: item.title || '',
      subtitle: item.subtitle || '',
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
      setErrorMessage('Vui lòng chọn loại đề.');
      return;
    }
    if (formState.passScore === '' || Number.isNaN(Number(formState.passScore))) {
      setErrorMessage('Điểm đạt phải là một con số.');
      return;
    }
    if (!formState.title.trim()) {
      setErrorMessage('Tên chứng chỉ không được để trống.');
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
      const message =
        error.response?.data?.message || 'Không thể lưu mẫu chứng chỉ. Vui lòng thử lại.';
      setErrorMessage(typeof message === 'string' ? message : JSON.stringify(message));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTemplate) return;
    try {
      await deleteMutation.mutateAsync(deletingTemplate.templateId);
      setDeletingTemplate(null);
    } catch (error) {
      setErrorMessage('Không thể xoá mẫu chứng chỉ này.');
    }
  };

  const handleConfirmDeleteIssued = async () => {
    if (!deletingCertificate) return;
    try {
      await deleteIssuedMutation.mutateAsync(deletingCertificate.certificateId);
      setDeletingCertificate(null);
    } catch (error) {
      setErrorMessage('Không thể xoá chứng chỉ này.');
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
    } catch (error) {
      setErrorMessage('Không thể thu hồi chứng chỉ này.');
    }
  };

  const templateColumns = [
    { key: 'examTypeName', header: 'Loại đề', render: (item) => item.examTypeName || '-' },
    { key: 'title', header: 'Tên chứng chỉ' },
    {
      key: 'passScore',
      header: 'Điểm đạt',
      render: (item) => <Badge bg="primary">{item.passScore}</Badge>,
    },
    {
      key: 'validMonths',
      header: 'Thời hạn',
      render: (item) => (item.validMonths ? `${item.validMonths} tháng` : 'Vô thời hạn'),
    },
    { key: 'issuedCount', header: 'Đã cấp', render: (item) => item.issuedCount ?? 0 },
    {
      key: 'active',
      header: 'Trạng thái',
      render: (item) =>
        item.active ? (
          <Badge bg="success">Đang bật</Badge>
        ) : (
          <Badge bg="secondary">Đang tắt</Badge>
        ),
    },
  ];

  const issuedColumns = [
    { key: 'recipientName', header: 'Người nhận' },
    {
      key: 'certificateCode',
      header: 'Mã chứng chỉ',
      render: (item) => <code>{item.certificateCode}</code>,
    },
    { key: 'testTitle', header: 'Bài thi', render: (item) => item.testTitle || '-' },
    { key: 'score', header: 'Điểm' },
    { key: 'issuedAt', header: 'Ngày cấp', render: (item) => formatDate(item.issuedAt) },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (item) => {
        if (item.status === 'REVOKED') return <Badge bg="danger">Đã thu hồi</Badge>;
        if (item.expired) return <Badge bg="warning" text="dark">Hết hạn</Badge>;
        return <Badge bg="success">Còn hiệu lực</Badge>;
      },
    },
  ];

  return (
    <div className="d-flex flex-column gap-3">
      <AdminPageHeader
        title="Chứng chỉ"
        description="Cấu hình mẫu chứng chỉ theo loại đề và quản lý các chứng chỉ đã cấp cho người học."
      >
        {tab === 'templates' && (
          <Button onClick={openCreateModal}>
            <Plus size={16} className="me-1" />
            Thêm mẫu chứng chỉ
          </Button>
        )}
      </AdminPageHeader>

      <StatCardGroup>
        <StatCard label="Mẫu chứng chỉ" value={templates.length} />
        <StatCard label="Mẫu đang bật" value={activeTemplates} />
        <StatCard label="Chứng chỉ còn hiệu lực" value={totalIssued} />
      </StatCardGroup>

      <AdminFieldError message={errorMessage} />
      {isError && <AdminFieldError message="Không tải được danh sách mẫu chứng chỉ." />}
      {/* Không báo lỗi thì bảng rỗng trông y hệt "chưa cấp chứng chỉ nào". */}
      {issuedError && <AdminFieldError message="Không tải được danh sách chứng chỉ đã cấp." />}

      <Nav variant="tabs" activeKey={tab} onSelect={(key) => setTab(key || 'templates')}>
        <Nav.Item>
          <Nav.Link eventKey="templates">Mẫu chứng chỉ</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="issued">Chứng chỉ đã cấp</Nav.Link>
        </Nav.Item>
      </Nav>

      {tab === 'templates' ? (
        <>
          <AdminToolbar
            searchValue={templateSearch}
            onSearchChange={setTemplateSearch}
            searchPlaceholder="Tìm theo tên chứng chỉ hoặc loại đề..."
          />
          <AdminTable
            columns={templateColumns}
            data={filteredTemplates}
            loading={isLoading}
            getRowKey={(item) => item.templateId}
            emptyText="Chưa có mẫu chứng chỉ nào. Hãy tạo mẫu cho loại đề bạn muốn cấp chứng chỉ."
            rowActions={(item) => (
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
            onSearchChange={(value) => {
              setIssuedKeyword(value);
              setIssuedPage(0);
            }}
            searchPlaceholder="Tìm theo tên người nhận hoặc mã chứng chỉ..."
          >
            <Form.Select
              value={issuedStatus}
              onChange={(event) => {
                setIssuedStatus(event.target.value);
                setIssuedPage(0);
              }}
              style={{ width: 200 }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">Còn hiệu lực</option>
              <option value="REVOKED">Đã thu hồi</option>
            </Form.Select>
          </AdminToolbar>

          <AdminTable
            columns={issuedColumns}
            data={certificates}
            loading={issuedLoading}
            getRowKey={(item) => item.certificateId}
            emptyText="Chưa có chứng chỉ nào được cấp."
            itemLabel="chứng chỉ"
            pageSize={PAGE_SIZE}
            page={issuedPage}
            totalPages={totalPages}
            totalElements={totalElements}
            onPageChange={setIssuedPage}
            rowActions={(item) => (
              <>
                {item.status === 'ACTIVE' && (
                  <Button
                    variant="light"
                    size="sm"
                    title="Thu hồi chứng chỉ"
                    onClick={() => setRevokingCertificate(item)}
                  >
                    <ShieldX size={16} />
                  </Button>
                )}
                <Button
                  variant="light"
                  size="sm"
                  title="Xoá hẳn chứng chỉ"
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
        message={`Xoá mẫu chứng chỉ "${deletingTemplate?.title || ''}"? Loại đề này sẽ ngừng cấp chứng chỉ mới. Chứng chỉ đã cấp vẫn giữ nguyên vì đã lưu bản chụp riêng.`}
      />

      <ConfirmDeleteModal
        show={Boolean(deletingCertificate)}
        onClose={() => setDeletingCertificate(null)}
        onConfirm={handleConfirmDeleteIssued}
        message={`Xoá hẳn chứng chỉ ${deletingCertificate?.certificateCode || ''} của ${
          deletingCertificate?.recipientName || ''
        }? Mã này sẽ không tra cứu được nữa và không khôi phục lại được. Nếu chỉ muốn vô hiệu hoá mà vẫn giữ dấu vết thì dùng thu hồi.`}
      />

      <ConfirmModal
        show={Boolean(revokingCertificate)}
        onClose={() => setRevokingCertificate(null)}
        onConfirm={handleConfirmRevoke}
        title="Thu hồi chứng chỉ"
        message={`Thu hồi chứng chỉ ${revokingCertificate?.certificateCode || ''} của ${
          revokingCertificate?.recipientName || ''
        }? Trang tra cứu sẽ báo chứng chỉ không còn giá trị, và người này có thể được cấp lại nếu đạt ở lần thi sau.`}
        confirmText="Thu hồi"
        variant="danger"
      />
    </div>
  );
}

export default CertificatesManagementPage;
