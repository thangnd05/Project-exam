import React from 'react';
import {Badge, Form} from 'react-bootstrap';
import BaseModal from '~/components/common/modal/BaseModal';
import ModalActionFooter from '~/components/common/modal/ModalActionFooter';

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
            onChange={(e) => onFileChange(e.target.files[0] || null)}
          />
          {selectedFile && (
            <Form.Text className="text-muted">{selectedFile.name}</Form.Text>
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
            <Form.Label>Gắn Tag (liên kết kiến thức)</Form.Label>
            <div className="d-flex flex-wrap gap-2">
              {availableTags.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.tagId);
                return (
                  <Badge
                    key={tag.tagId}
                    bg={isSelected ? 'primary' : 'light'}
                    text={isSelected ? 'white' : 'dark'}
                    role="button"
                    className="border px-2 py-1 fw-medium tag-badge"
                    onClick={() => onToggleTag(tag.tagId)}
                  >
                    {tag.name}
                  </Badge>
                );
              })}
            </div>
          </Form.Group>
        )}
    </BaseModal>
  );
}

export default RecoveryResourceFormModal;
