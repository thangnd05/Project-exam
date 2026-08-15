'use client';

import {Form} from 'react-bootstrap';
import BaseModal from '@/app/components/modal/BaseModal';
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';
import TagSelector from '@/app/components/TagSelector/TagSelector';

function RecoveryResourceFormModal({
  show,
  isEditing,
  formState,
  examTypes,
  formExamTypeId,
  onExamTypeChange,
  availableTags,
  availableParts,
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

        <Form.Group className="mb-3">
          <Form.Label>Loại kỳ thi (để chọn tag / Part)</Form.Label>
          <Form.Select
            value={formExamTypeId}
            onChange={(e) => onExamTypeChange(e.target.value)}
          >
            <option value="">— Chọn loại kỳ thi </option>
            {examTypes.map((et) => (
              <option key={et.id} value={et.id}>
                {et.name}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        {formExamTypeId && (
          <Form.Group className="mb-3">
            <Form.Label>Gắn Part (tùy chọn)</Form.Label>
            <Form.Select
              value={formState.examPartId || ''}
              onChange={(e) => onChangeField('examPartId', e.target.value)}
            >
              <option value="">— Không gắn Part </option>
              {availableParts.map((part) => (
                <option key={part.examPartId} value={part.examPartId}>
                  {part.name}
                </option>
              ))}
            </Form.Select>
            <Form.Text className="text-muted">
              Dùng cho tài liệu giới thiệu / cách làm của một Part (VD: &quot;Cách làm Part 1&quot;).
            </Form.Text>
          </Form.Group>
        )}

        <Form.Group className="mb-3">
          {!formExamTypeId ? (
            <Form.Text className="text-muted">
              Chọn loại kỳ thi ở trên để gắn hoặc thay đổi tag cho tài liệu.
            </Form.Text>
          ) : availableTags.length > 0 ? (
            <TagSelector
              tags={availableTags}
              selectedIds={selectedTagIds}
              onToggle={onToggleTag}
              label="Gắn Tag (liên kết kiến thức)"
            />
          ) : (
            <Form.Text className="text-muted">
              Loại kỳ thi này chưa có tag. Tạo tag tại mục Quản lý Tag trước.
            </Form.Text>
          )}
        </Form.Group>
    </BaseModal>
  );
}

export default RecoveryResourceFormModal;
