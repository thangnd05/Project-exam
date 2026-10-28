'use client';

import {useMemo, useState} from 'react';
import {Form} from 'react-bootstrap';
import {Eye, Send} from 'lucide-react';
import {toast} from 'react-toastify';
import {useTranslations} from 'next-intl';
import classNames from 'classnames/bind';
import RichTextEditor from '@/app/components/RichTextEditor/RichTextEditor';

import BaseModal from '@/app/components/modal/BaseModal';
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import {AdminFieldError} from '@/app/[locale]/(admin)/_components/common';
import {EmailType} from '@/app/enums';
import type {EmailResponse} from '@/app/types';
import {getApiErrorMessage} from '@/app/utils/apiError';
import {useEmailMutations} from '@/app/[locale]/(admin)/admin/emails/_hooks/useAdminEmails';
import styles from './EmailEditorModal.module.scss';

const cx = classNames.bind(styles);

type EmailFormState = {
  name: string;
  description: string;
  subject: string;
  bodyHtml: string;
  active: boolean;
};

const emptyForm: EmailFormState = {name: '', description: '', subject: '', bodyHtml: '', active: true};

const QUILL_MODULES = {
  toolbar: [
    [{header: [1, 2, 3, false]}, {size: ['small', false, 'large', 'huge']}],
    ['bold', 'italic', 'underline', 'strike'],
    [{color: []}, {background: []}],
    [{list: 'ordered'}, {list: 'bullet'}],
    [{align: ''}, {align: 'center'}, {align: 'right'}, {align: 'justify'}],
    ['link', 'blockquote'],
    ['clean'],
  ],
};

const QUILL_FORMATS = [
  'header', 'size',
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'list', 'align',
  'link', 'blockquote',
];

type EmailEditorModalProps = {
  show: boolean;
  email: EmailResponse | null;
  onClose: () => void;
};

function EmailEditorModal({show, email, onClose}: EmailEditorModalProps) {
  const t = useTranslations('AdminSystem.emails.editor');
  const tCommon = useTranslations('Common');
  const isAuto = email?.type === EmailType.AUTO;
  const isEditing = Boolean(email?.emailId);
  const isLayout = email?.code === 'LAYOUT_BASE';

  const [form, setForm] = useState<EmailFormState>(emptyForm);
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [testEmail, setTestEmail] = useState('');

  const {createEmail, updateEmail, previewEmail, testSendEmail} = useEmailMutations();

  // Nạp lại form mỗi khi mở modal hoặc đổi email đang sửa
  const [prevShow, setPrevShow] = useState(false);
  const [prevEmail, setPrevEmail] = useState(email);
  if (show !== prevShow || email !== prevEmail) {
    setPrevShow(show);
    setPrevEmail(email);
    if (show) {
      setForm(
        email
          ? {
              name: email.name || '',
              description: email.description || '',
              subject: email.subject || '',
              bodyHtml: email.bodyHtml || '',
              active: email.active !== false,
            }
          : emptyForm,
      );
      setErrorMessage('');
      setPreviewHtml('');
      setTestEmail('');
    }
  }

  const setField = (field: keyof EmailFormState, value: string | boolean) =>
    setForm((previous) => ({...previous, [field]: value}));

  const hasHandwrittenLayout = useMemo(
    () => /<(div|table|td)\b/i.test(form.bodyHtml),
    [form.bodyHtml],
  );

  const validate = () => {
    if (!form.subject.trim()) {
      setErrorMessage(t('errors.subjectRequired'));
      return false;
    }
    if (!form.bodyHtml.trim()) {
      setErrorMessage(t('errors.bodyRequired'));
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setErrorMessage('');
    if (!validate()) {
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        subject: form.subject.trim(),
        bodyHtml: form.bodyHtml,
        active: form.active,
      };
      if (isEditing) {
        await updateEmail({emailId: email!.emailId, payload});
      } else {
        await createEmail(payload);
      }
      toast.success(t('saved'));
      onClose();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t('errors.saveFailed')));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreview = async () => {
    setErrorMessage('');
    if (!validate()) {
      return;
    }
    try {
      const result = await previewEmail({subject: form.subject, bodyHtml: form.bodyHtml});
      setPreviewHtml(result.bodyHtml ?? '');
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t('errors.previewFailed')));
    }
  };

  const handleTestSend = async () => {
    setErrorMessage('');
    if (!isEditing) {
      setErrorMessage(t('errors.saveBeforeTest'));
      return;
    }
    if (!validate()) {
      return;
    }
    try {
      await testSendEmail({
        emailId: email!.emailId,
        payload: {subject: form.subject, bodyHtml: form.bodyHtml, toEmail: testEmail || undefined},
      });
      toast.info(t('testQueued'));
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t('errors.testFailed')));
    }
  };

  const insertVariable = (variable: string) => {
    setField('bodyHtml', `${form.bodyHtml}{{${variable}}}`);
  };

  return (
    <BaseModal
      show={show}
      onClose={submitting ? undefined : onClose}
      title={isEditing ? t('editTitle', {name: email?.name || email?.subject || ''}) : t('createTitle')}
      maxWidth={860}
      footer={
        <ModalActionFooter
          onCancel={onClose}
          onSubmit={handleSubmit}
          cancelLabel={tCommon('close')}
          submitLabel={t('submit')}
          loading={submitting}
        />
      }
    >
      {isAuto && (
        <div className="alert alert-info py-2 small">
          {t.rich('autoTemplate', {
            code: email!.code ?? '',
            description: email!.description ?? '',
            b: (chunks) => <b>{chunks}</b>,
          })}
        </div>
      )}

      {!isAuto && (
        <Form.Group className="mb-3">
          <Form.Label>{t('name')}</Form.Label>
          <Form.Control
            value={form.name}
            placeholder={t('namePlaceholder')}
            onChange={(event) => setField('name', event.target.value)}
          />
        </Form.Group>
      )}

      <Form.Group className="mb-3">
        <Form.Label>{t('subject')}</Form.Label>
        <Form.Control
          value={form.subject}
          onChange={(event) => setField('subject', event.target.value)}
        />
      </Form.Group>

      <Form.Label>{t('body')}</Form.Label>

      {!isLayout && hasHandwrittenLayout && (
        <div className="alert alert-warning py-2 small">
          {t('handwrittenWarning')}
        </div>
      )}

      {!isLayout ? (
        <div className={cx('editor', 'mb-3')}>
          <RichTextEditor
            theme="snow"
            value={form.bodyHtml}
            onChange={(value, _delta, source) => {
              if (source === 'user') {
                setField('bodyHtml', value);
              }
            }}
            modules={QUILL_MODULES}
            formats={QUILL_FORMATS}
            placeholder={t('bodyPlaceholder')}
          />
        </div>
      ) : (
        <Form.Group className="mb-2">
          <Form.Control
            as="textarea"
            rows={12}
            className="font-monospace small"
            value={form.bodyHtml}
            onChange={(event) => setField('bodyHtml', event.target.value)}
          />
        </Form.Group>
      )}

      {isLayout && (
        <div className="alert alert-secondary py-2 small">
          {t.rich('layoutHint', {
            token: '{{content}}',
            code: (chunks) => <code>{chunks}</code>,
          })}
        </div>
      )}

      {(email?.availableVars?.length ?? 0) > 0 && (
        <div className="mb-3 small text-muted">
          {t('variablesHint')}{' '}
          {email!.availableVars!.map((variable) => (
            <ButtonPrime
              key={variable}
              size="sm"
              variant="soft"
              className="me-1 mb-1"
              onClick={() => insertVariable(variable)}
            >
              {`{{${variable}}}`}
            </ButtonPrime>
          ))}
        </div>
      )}

      <Form.Check
        type="switch"
        className="mb-3"
        label={isAuto ? t('activeAuto') : t('active')}
        checked={form.active}
        onChange={(event) => setField('active', event.target.checked)}
      />

      <div className="d-flex flex-wrap align-items-end gap-2 mb-3">
        <ButtonPrime type="button" variant="ghost" onClick={handlePreview}>
          <Eye size={16} className="me-1" />
          {t('preview')}
        </ButtonPrime>
        <div className="flex-fill" style={{minWidth: '20rem'}}>
          <Form.Label className="small mb-1">{t('testTo')}</Form.Label>
          <Form.Control
            type="email"
            placeholder={t('testToPlaceholder')}
            value={testEmail}
            onChange={(event) => setTestEmail(event.target.value)}
          />
        </div>
        <ButtonPrime type="button" variant="outline" onClick={handleTestSend}>
          <Send size={16} className="me-1" />
          {t('testSend')}
        </ButtonPrime>
      </div>

      {previewHtml && (
        <div className="mb-2">
          <div className="small text-muted mb-1">
            {t('previewHint')}
          </div>
          <iframe
            title={t('previewFrameTitle')}
            srcDoc={previewHtml}
            sandbox=""
            style={{width: '100%', height: '32rem', border: '1px solid var(--border-color)', borderRadius: '0.8rem'}}
          />
        </div>
      )}

      <AdminFieldError message={errorMessage} />
    </BaseModal>
  );
}

export default EmailEditorModal;
