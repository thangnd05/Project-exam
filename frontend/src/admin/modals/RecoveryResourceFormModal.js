import React from 'react';
import {Form} from 'react-bootstrap';
import BaseModal from '~/components/common/modal/BaseModal';
import ModalActionFooter from '~/components/common/modal/ModalActionFooter';
import TagSelector from '~/components/common/TagSelector/TagSelector';

function RecoveryResourceFormModal({
  show,
  isEditing,
  formState,
  availableTags,
  selectedFile,
  onChangeField,
  onFileChange,
  onToggleTag,
  onClose,
  onSubmit,
  submitting,
}) {
  const selectedTagIds = formState.tagIds || [];

  return (
    <BaseModal
      show={show}
      onClose={onClose}
      title={isEditing ? 'Cập nhật tài liệu' : 'Thêm tài liệu mới'}
      maxWidth={800}
      footer={
        <ModalActionFooter
          onCancel={onClose}
          onSubmit={onSubmit}
          cancelLabel="Hủy"
          submitLabel={isEditing ? 'Lưu' : 'Tạo mới'}
          loadingLabel="Đang lưu..."
          loading={submitting}
        />
      }
    >
        <Form.Group className="mb-3">
          <Form.Label>Tiêu đề</Form.Label>
          <Form.Control
            value={formState.title}
            onChange={(e) => onChangeField('title', e.target.value)}
            placeholder="VD: Mẹo giải bài tập Giới từ TOEIC..."
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Mô tả</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={formState.description}
            onChange={(e) => onChangeField('description', e.target.value)}
            placeholder="Mô tả chi tiết nội dung tài liệu..."
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Upload file</Form.Label>
          <Form.Control
            type="file"
            accept=".md,.markdown,.pdf,.doc,.docx,image/*,audio/*,video/*,text/markdown"
            onChange={(e) => onFileChange(e.target.files[0] || null)}
          />
          <Form.Text className="text-muted">
            Hỗ trợ Markdown (.md), PDF, Word, ảnh, audio, video.
          </Form.Text>
          {selectedFile && (
            <Form.Text className="text-muted d-block">{selectedFile.name}</Form.Text>
          )}
          {isEditing && !selectedFile && formState.url && (
            <Form.Text className="text-muted d-block mt-1">
              File hiện tại: <a href={formState.url} target="_blank" rel="noreferrer">Xem file</a>
            </Form.Text>
          )}
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Hoặc nhập URL</Form.Label>
          <Form.Control
            value={formState.url}
            onChange={(e) => onChangeField('url', e.target.value)}
            placeholder="https://..."
          />
        </Form.Group>

        {availableTags.length > 0 && (
          <Form.Group className="mb-3">
            <TagSelector
              tags={availableTags}
              selectedIds={selectedTagIds}
              onToggle={onToggleTag}
              label="Gắn Tag (liên kết kiến thức)"
            />
          </Form.Group>
        )}
    </BaseModal>
  );
}

export default RecoveryResourceFormModal;
