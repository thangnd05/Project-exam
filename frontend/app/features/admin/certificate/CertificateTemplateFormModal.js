'use client';

import { Form, Row, Col } from 'react-bootstrap';

import BaseModal from '@/app/components/modal/BaseModal';
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';
import CertificateCanvas from '@/app/components/CertificateCanvas/CertificateCanvas';

/**
 * Form mẫu chứng chỉ. Khung xem trước dùng đúng component vẽ chứng chỉ thật nên
 * admin thấy trước chính xác cái người học sẽ nhận.
 */
function CertificateTemplateFormModal({
  show,
  isEditing,
  formState,
  examTypes,
  onChangeField,
  onClose,
  onSubmit,
  submitting,
}) {
  const previewDesign = {
    title: formState.title || 'Chứng nhận hoàn thành',
    subtitle: formState.subtitle,
    footerNote: formState.footerNote,
    logoUrl: formState.logoUrl,
    backgroundUrl: formState.backgroundUrl,
    accentColor: formState.accentColor,
    issuerName: formState.issuerName,
    signatureName: formState.signatureName,
    signatureTitle: formState.signatureTitle,
    signatureImageUrl: formState.signatureImageUrl,
    examTypeName:
      examTypes.find((type) => type.examTypeId === formState.examTypeId)?.name || 'Loại đề',
  };

  return (
    <BaseModal
      show={show}
      onClose={onClose}
      title={isEditing ? 'Cập nhật mẫu chứng chỉ' : 'Tạo mẫu chứng chỉ'}
      maxWidth={980}
      footer={
        <ModalActionFooter
          onCancel={onClose}
          onSubmit={onSubmit}
          cancelLabel="Hủy"
          submitLabel={isEditing ? 'Lưu' : 'Tạo mới'}
          loading={submitting}
        />
      }
    >
      <Row className="g-4">
        <Col lg={6}>
          <Form.Group className="mb-3">
            <Form.Label>Loại đề *</Form.Label>
            <Form.Select
              value={formState.examTypeId}
              onChange={(event) => onChangeField('examTypeId', event.target.value)}
              disabled={isEditing}
            >
              <option value="">-- Chọn loại đề --</option>
              {examTypes.map((type) => (
                <option key={type.examTypeId} value={type.examTypeId}>
                  {type.name}
                </option>
              ))}
            </Form.Select>
            <Form.Text className="text-muted">
              Mỗi loại đề chỉ có một mẫu, và không đổi được sau khi tạo.
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Điểm đạt *</Form.Label>
            <Form.Control
              type="number"
              value={formState.passScore}
              onChange={(event) => onChangeField('passScore', event.target.value)}
              placeholder="VD: 720"
            />
            <Form.Text className="text-muted">
              Đạt từ mốc này trở lên là được cấp chứng chỉ. Thang điểm theo cách chấm của
              loại đề (AWS: 100-1000, chuẩn AWS là 720).
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Tên chứng chỉ *</Form.Label>
            <Form.Control
              value={formState.title}
              onChange={(event) => onChangeField('title', event.target.value)}
              placeholder="VD: AWS Certified Solutions Architect  Associate"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Dòng phụ</Form.Label>
            <Form.Control
              value={formState.subtitle}
              onChange={(event) => onChangeField('subtitle', event.target.value)}
              placeholder="VD: Chứng nhận hoàn thành bài thi thử toàn phần"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Ghi chú cuối chứng chỉ</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={formState.footerNote}
              onChange={(event) => onChangeField('footerNote', event.target.value)}
            />
          </Form.Group>

          <Row>
            <Col xs={6}>
              <Form.Group className="mb-3">
                <Form.Label>Thời hạn (tháng)</Form.Label>
                <Form.Control
                  type="number"
                  value={formState.validMonths}
                  onChange={(event) => onChangeField('validMonths', event.target.value)}
                  placeholder="Bỏ trống = vô thời hạn"
                />
              </Form.Group>
            </Col>
            <Col xs={6}>
              <Form.Group className="mb-3">
                <Form.Label>Màu nhấn</Form.Label>
                <Form.Control
                  type="color"
                  value={formState.accentColor || '#a88b3a'}
                  onChange={(event) => onChangeField('accentColor', event.target.value)}
                  title="Màu viền và tiêu đề chứng chỉ"
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group>
            <Form.Check
              type="switch"
              id="certificate-template-active"
              label="Đang bật (tắt thì ngừng cấp chứng chỉ mới)"
              checked={formState.active !== false}
              onChange={(event) => onChangeField('active', event.target.checked)}
            />
          </Form.Group>
        </Col>

        <Col lg={6}>
          <Form.Group className="mb-3">
            <Form.Label>Đơn vị cấp</Form.Label>
            <Form.Control
              value={formState.issuerName}
              onChange={(event) => onChangeField('issuerName', event.target.value)}
              placeholder="VD: English Exam Platform"
            />
          </Form.Group>

          <Row>
            <Col xs={6}>
              <Form.Group className="mb-3">
                <Form.Label>Người ký</Form.Label>
                <Form.Control
                  value={formState.signatureName}
                  onChange={(event) => onChangeField('signatureName', event.target.value)}
                />
              </Form.Group>
            </Col>
            <Col xs={6}>
              <Form.Group className="mb-3">
                <Form.Label>Chức danh</Form.Label>
                <Form.Control
                  value={formState.signatureTitle}
                  onChange={(event) => onChangeField('signatureTitle', event.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Logo (URL)</Form.Label>
            <Form.Control
              value={formState.logoUrl}
              onChange={(event) => onChangeField('logoUrl', event.target.value)}
              placeholder="https://..."
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Ảnh chữ ký (URL)</Form.Label>
            <Form.Control
              value={formState.signatureImageUrl}
              onChange={(event) => onChangeField('signatureImageUrl', event.target.value)}
              placeholder="https://..."
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Ảnh nền (URL)</Form.Label>
            <Form.Control
              value={formState.backgroundUrl}
              onChange={(event) => onChangeField('backgroundUrl', event.target.value)}
              placeholder="https://..."
            />
          </Form.Group>

          <Form.Label>Xem trước</Form.Label>
          <CertificateCanvas
            design={previewDesign}
            recipientName="Nguyễn Văn A"
            certificateCode="EXAM-2026-XXXXXX"
            issuedAt={new Date().toISOString()}
            watermark="PREVIEW"
          />
        </Col>
      </Row>
    </BaseModal>
  );
}

export default CertificateTemplateFormModal;
