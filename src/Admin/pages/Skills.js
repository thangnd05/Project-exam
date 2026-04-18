import React, {useMemo, useState} from 'react';
import {Button, Form, Modal, Table} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {Edit, Plus, Search, Trash2} from 'lucide-react';

import {fakeSkills} from '../data/fakeData';
import styles from './Skills.module.scss';

const cx = classNames.bind(styles);

const defaultFormState = {
  name: '',
  description: '',
};

function SkillsManagement() {
  const [skillList, setSkillList] = useState(fakeSkills);
  const [keyword, setKeyword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSkillId, setEditingSkillId] = useState(null);
  const [formState, setFormState] = useState(defaultFormState);
  const [errorMessage, setErrorMessage] = useState('');

  const filteredSkills = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword) {
      return skillList;
    }
    return skillList.filter((skill) => {
      return (
        skill.name.toLowerCase().includes(normalizedKeyword) ||
        (skill.description || '').toLowerCase().includes(normalizedKeyword)
      );
    });
  }, [skillList, keyword]);

  const resetForm = () => {
    setFormState(defaultFormState);
    setEditingSkillId(null);
    setErrorMessage('');
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (skill) => {
    setEditingSkillId(skill.skill_id);
    setFormState({
      name: skill.name,
      description: skill.description || '',
    });
    setErrorMessage('');
    setShowModal(true);
  };

  const hasDuplicateSkillName = (skillName) => {
    const normalizedName = skillName.trim().toLowerCase();
    return skillList.some((skill) => {
      if (editingSkillId && skill.skill_id === editingSkillId) {
        return false;
      }
      return skill.name.trim().toLowerCase() === normalizedName;
    });
  };

  const handleSubmit = () => {
    const normalizedName = formState.name.trim();
    if (!normalizedName) {
      setErrorMessage('Tên kỹ năng không được để trống.');
      return;
    }

    if (hasDuplicateSkillName(normalizedName)) {
      setErrorMessage('Tên kỹ năng đã tồn tại, vui lòng chọn tên khác.');
      return;
    }

    if (editingSkillId) {
      setSkillList((previous) =>
        previous.map((skill) =>
          skill.skill_id === editingSkillId
            ? {
                ...skill,
                name: normalizedName,
                description: formState.description.trim(),
              }
            : skill,
        ),
      );
    } else {
      const nextSkillId =
        skillList.reduce((maxSkillId, skill) => Math.max(maxSkillId, skill.skill_id), 0) +
        1;
      setSkillList((previous) => [
        ...previous,
        {
          skill_id: nextSkillId,
          name: normalizedName,
          description: formState.description.trim(),
        },
      ]);
    }

    setShowModal(false);
    resetForm();
  };

  const handleDelete = (skillId) => {
    setSkillList((previous) => previous.filter((skill) => skill.skill_id !== skillId));
  };

  return (
    <div className={cx('skillsPage')}>
      <div className={cx('pageHeader')}>
        <div>
          <h1>Quản lý kỹ năng</h1>
          <p>Quản lý danh mục kỹ năng dùng cho phần thi và quy đổi điểm.</p>
        </div>
        <Button className={cx('createButton')} onClick={openCreateModal}>
          <Plus size={16} />
          Thêm kỹ năng
        </Button>
      </div>

      <div className={cx('searchContainer')}>
        <Search size={16} className={cx('searchIcon')} />
        <Form.Control
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Tìm theo tên kỹ năng hoặc mô tả..."
        />
      </div>

      <div className={cx('tableWrapper')}>
        <Table responsive hover>
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên kỹ năng</th>
              <th>Mô tả</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredSkills.map((skill) => (
              <tr key={skill.skill_id}>
                <td>{skill.skill_id}</td>
                <td>{skill.name}</td>
                <td>{skill.description || '-'}</td>
                <td>
                  <div className={cx('actionButtons')}>
                    <button title="Sửa" onClick={() => openEditModal(skill)}>
                      <Edit size={14} />
                    </button>
                    <button title="Xóa" onClick={() => handleDelete(skill.skill_id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      <Modal
        show={showModal}
        onHide={() => {
          setShowModal(false);
          resetForm();
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>{editingSkillId ? 'Cập nhật kỹ năng' : 'Tạo kỹ năng'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Tên kỹ năng</Form.Label>
            <Form.Control
              value={formState.name}
              onChange={(event) =>
                setFormState((previous) => ({...previous, name: event.target.value}))
              }
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Mô tả</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={formState.description}
              onChange={(event) =>
                setFormState((previous) => ({
                  ...previous,
                  description: event.target.value,
                }))
              }
            />
          </Form.Group>
          {errorMessage && <p className={cx('errorText')}>{errorMessage}</p>}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowModal(false);
              resetForm();
            }}
          >
            Hủy
          </Button>
          <Button onClick={handleSubmit}>{editingSkillId ? 'Lưu' : 'Tạo mới'}</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default SkillsManagement;
