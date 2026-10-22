'use client';

import { Form, Row, Col } from 'react-bootstrap';
import { useTranslations } from 'next-intl';

import BaseModal from '@/app/components/modal/BaseModal';
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';
import CertificateCanvas from '@/app/features/certificates/CertificateCanvas/CertificateCanvas';
import type { ExamTypeResponse } from '@/app/types';

export interface CertificateTemplateFormState {
  examTypeId: string;
  passScore: number | string;
  title: string;
  subtitle: string;
  bodyText: string;
  footerNote: string;
  logoUrl: string;
  backgroundUrl: string;
  accentColor: string;
  issuerName: string;
  signatureName: string;
  signatureTitle: string;
  signatureImageUrl: string;
  validMonths: number | string;
  active: boolean;
}

interface CertificateTemplateFormModalProps {
  show: boolean;
  isEditing: boolean;
  formState: CertificateTemplateFormState;
  examTypes: ExamTypeResponse[];
  onChangeField: (field: string, value: string | boolean) => void;
  onClose: () => void;
  onSubmit: () => void;
  submitting: boolean;
}

function CertificateTemplateFormModal({
  show,
  isEditing,
  formState,
  examTypes,
  onChangeField,
  onClose,
  onSubmit,
  submitting,
}: CertificateTemplateFormModalProps) {
  const t = useTranslations('AdminSystem.certificates.form');
  const tCommon = useTranslations('Common');
  const previewDesign = {
    title: formState.title || t('previewTitle'),
    subtitle: formState.subtitle,
    bodyText: formState.bodyText,
    footerNote: formState.footerNote,
    logoUrl: formState.logoUrl,
    backgroundUrl: formState.backgroundUrl,
    accentColor: formState.accentColor,
    issuerName: formState.issuerName,
    signatureName: formState.signatureName,
    signatureTitle: formState.signatureTitle,
    signatureImageUrl: formState.signatureImageUrl,
    examTypeName:
      examTypes.find((type) => type.examTypeId === formState.examTypeId)?.name || t('previewExamType'),
  };

  return (
    <BaseModal
      show={show}
      onClose={onClose}
      title={isEditing ? t('editTitle') : t('createTitle')}
      maxWidth={980}
      footer={
        <ModalActionFooter
          onCancel={onClose}
          onSubmit={onSubmit}
          cancelLabel={tCommon('cancelShort')}
          submitLabel={isEditing ? tCommon('save') : t('create')}
          loading={submitting}
        />
      }
    >
      <Row className="g-4">
        <Col lg={6}>
          <Form.Group className="mb-3">
            <Form.Label>{t('examType')} *</Form.Label>
            <Form.Select
              value={formState.examTypeId}
              onChange={(event) => onChangeField('examTypeId', event.target.value)}
              disabled={isEditing}
            >
              <option value="">{t('selectExamType')}</option>
              {examTypes.map((type) => (
                <option key={type.examTypeId} value={type.examTypeId}>
                  {type.name}
                </option>
              ))}
            </Form.Select>
            <Form.Text className="text-muted">
              {t('examTypeHelp')}
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>{t('passScore')} *</Form.Label>
            <Form.Control
              type="number"
              value={formState.passScore}
              onChange={(event) => onChangeField('passScore', event.target.value)}
              placeholder={t('passScorePlaceholder')}
            />
            <Form.Text className="text-muted">
              {t('passScoreHelp')}
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>{t('title')} *</Form.Label>
            <Form.Control
              value={formState.title}
              onChange={(event) => onChangeField('title', event.target.value)}
              placeholder={t('titlePlaceholder')}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>{t('subtitle')}</Form.Label>
            <Form.Control
              value={formState.subtitle}
              onChange={(event) => onChangeField('subtitle', event.target.value)}
              placeholder={t('subtitlePlaceholder')}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>{t('bodyText')}</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={formState.bodyText}
              onChange={(event) => onChangeField('bodyText', event.target.value)}
              placeholder="for successfully completing and passing the {examType} examination"
            />
            <Form.Text className="text-muted">
              {t.rich('bodyTextHelp', {
                token: '{examType}',
                code: (chunks) => <code>{chunks}</code>,
              })}
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>{t('footerNote')}</Form.Label>
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
                <Form.Label>{t('validMonths')}</Form.Label>
                <Form.Control
                  type="number"
                  value={formState.validMonths}
                  onChange={(event) => onChangeField('validMonths', event.target.value)}
                  placeholder={t('validMonthsPlaceholder')}
                />
              </Form.Group>
            </Col>
            <Col xs={6}>
              <Form.Group className="mb-3">
                <Form.Label>{t('accentColor')}</Form.Label>
                <Form.Control
                  type="color"
                  value={formState.accentColor || '#a88b3a'}
                  onChange={(event) => onChangeField('accentColor', event.target.value)}
                  title={t('accentColorHint')}
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group>
            <Form.Check
              type="switch"
              id="certificate-template-active"
              label={t('activeLabel')}
              checked={formState.active !== false}
              onChange={(event) => onChangeField('active', event.target.checked)}
            />
          </Form.Group>
        </Col>

        <Col lg={6}>
          <Form.Group className="mb-3">
            <Form.Label>{t('issuerName')}</Form.Label>
            <Form.Control
              value={formState.issuerName}
              onChange={(event) => onChangeField('issuerName', event.target.value)}
              placeholder={t('issuerPlaceholder')}
            />
          </Form.Group>

          <Row>
            <Col xs={6}>
              <Form.Group className="mb-3">
                <Form.Label>{t('signatureName')}</Form.Label>
                <Form.Control
                  value={formState.signatureName}
                  onChange={(event) => onChangeField('signatureName', event.target.value)}
                />
              </Form.Group>
            </Col>
            <Col xs={6}>
              <Form.Group className="mb-3">
                <Form.Label>{t('signatureTitle')}</Form.Label>
                <Form.Control
                  value={formState.signatureTitle}
                  onChange={(event) => onChangeField('signatureTitle', event.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>{t('logoUrl')}</Form.Label>
            <Form.Control
              value={formState.logoUrl}
              onChange={(event) => onChangeField('logoUrl', event.target.value)}
              placeholder="https://..."
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>{t('signatureImageUrl')}</Form.Label>
            <Form.Control
              value={formState.signatureImageUrl}
              onChange={(event) => onChangeField('signatureImageUrl', event.target.value)}
              placeholder="https://..."
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>{t('backgroundUrl')}</Form.Label>
            <Form.Control
              value={formState.backgroundUrl}
              onChange={(event) => onChangeField('backgroundUrl', event.target.value)}
              placeholder="https://..."
            />
          </Form.Group>

          <Form.Label>{t('preview')}</Form.Label>
          <CertificateCanvas
            design={previewDesign}
            recipientName={t('previewRecipient')}
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
