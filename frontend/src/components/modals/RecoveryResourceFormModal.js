import React from 'react';
import {Badge, Button, Form, Modal} from 'react-bootstrap';

const RESOURCE_TYPES = [
  {value: 'VIDEO', label: 'Video'},
  {value: 'DOCUMENT', label: 'Tài liệu (PDF, Doc...)'},
  {value: 'LINK', label: 'Đường dẫn ngoài'},
];

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
    <Modal show={show} onHide={onClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{isEditing ? 'Cập nhật tài liệu' : 'Thêm tài liệu mới'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
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
          <Form.Label>Loại tài liệu</Form.Label>
          <Form.Select
            value={formState.resourceType}
            onChange={(e) => onChangeField('resourceType', e.target.value)}
          >
            {RESOURCE_TYPES.map((rt) => (
              <option key={rt.value} value={rt.value}>{rt.label}</option>
            ))}
          </Form.Select>
        </Form.Group>

        {formState.resourceType === 'LINK' ? (
          <Form.Group className="mb-3">
            <Form.Label>URL</Form.Label>
            <Form.Control
              value={formState.url}
              onChange={(e) => onChangeField('url', e.target.value)}
              placeholder="https://..."
            />
          </Form.Group>
        ) : (
          <Form.Group className="mb-3">
            <Form.Label>Upload file {formState.resourceType === 'VIDEO' ? '(video/audio)' : '(PDF, Doc...)'}</Form.Label>
            <Form.Control
              type="file"
              accept={formState.resourceType === 'VIDEO' ? 'video/*,audio/*' : '.pdf,.doc,.docx'}
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
            <Form.Group className="mt-2">
              <Form.Label className="small text-muted">Hoặc nhập URL thủ công</Form.Label>
              <Form.Control
                size="sm"
                value={formState.url}
                onChange={(e) => onChangeField('url', e.target.value)}
                placeholder="https://..."
              />
            </Form.Group>
          </Form.Group>
        )}

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
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={submitting}>
          Hủy
        </Button>
        <Button onClick={onSubmit} disabled={submitting}>
          {submitting ? 'Đang lưu...' : isEditing ? 'Lưu' : 'Tạo mới'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default RecoveryResourceFormModal;
