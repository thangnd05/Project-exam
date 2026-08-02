import { useEffect, useMemo, useRef, useState } from 'react';
import {Button, Form} from 'react-bootstrap';
import {Braces, Plus, Trash2} from 'lucide-react';
import classNames from 'classnames/bind';

import ButtonPrime from '~/shared/ui/Button/ButtonPrime';
import ConfirmDeleteModal from '~/shared/ui/modal/ConfirmDeleteModal';
import BaseModal from '~/shared/ui/modal/BaseModal';
import ModalActionFooter from '~/shared/ui/modal/ModalActionFooter';
import {
  AdminCard,
  AdminFieldError,
  AdminPageHeader,
  AdminTable,
  AdminToolbar,
} from '../components/common';
import styles from '../components/common/adminKit.module.scss';

const cx = classNames.bind(styles);
import {useScoringConversion} from '~/features/admin/exam-content/hooks/useScoringConversion';

const defaultFormState = {
  exam_type_id: '',
  skill_id: '',
  num_correct: '',
  converted_score: '',
};

function ScoringConversionManagementPage() {
  const [keyword, setKeyword] = useState('');
  const [examTypeFilter, setExamTypeFilter] = useState('all');
  const [activeSkillId, setActiveSkillId] = useState('all');
  const [formState, setFormState] = useState(defaultFormState);
  const [showJsonCreateForm, setShowJsonCreateForm] = useState(false);
  const [jsonCreateValue, setJsonCreateValue] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const jsonTextareaRef = useRef(null);
  const [deletingRule, setDeletingRule] = useState(null);

  const {
    examTypes,
    skills,
    scoringRules,
    isLoading: loading,
    createMutation,
    deleteMutation,
    bulkCreateMutation,
  } = useScoringConversion(activeSkillId, examTypeFilter);

  const submitting =
    createMutation.isPending ||
    deleteMutation.isPending ||
    bulkCreateMutation.isPending;

  useEffect(() => {
    if (activeSkillId !== 'all') {
      setFormState((previous) => ({...previous, skill_id: activeSkillId}));
    }
  }, [activeSkillId]);

  const filteredRules = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return scoringRules.filter((rule) => {
      const examTypeName =
        examTypes.find((examType) => examType.exam_type_id === rule.exam_type_id)?.name ||
        '';
      const skillName =
        skills.find((skill) => skill.skill_id === rule.skill_id)?.name || '';

      const matchExamType =
        examTypeFilter === 'all' || String(rule.exam_type_id) === examTypeFilter;
      const matchKeyword =
        normalizedKeyword.length === 0 ||
        examTypeName.toLowerCase().includes(normalizedKeyword) ||
        skillName.toLowerCase().includes(normalizedKeyword) ||
        String(rule.num_correct).includes(normalizedKeyword) ||
        String(rule.converted_score).includes(normalizedKeyword);

      return matchExamType && matchKeyword;
    });
  }, [examTypeFilter, examTypes, keyword, scoringRules, skills]);

  const getExamTypeName = (examTypeId) => {
    return (
      examTypes.find((examType) => examType.exam_type_id === examTypeId)?.name || '-'
    );
  };

  const getSkillName = (skillId) => {
    return skills.find((skill) => skill.skill_id === skillId)?.name || '-';
  };

  const isDuplicateRule = (examTypeId, skillId, numCorrect) => {
    return scoringRules.some(
      (rule) =>
        rule.exam_type_id === examTypeId &&
        rule.skill_id === skillId &&
        rule.num_correct === numCorrect,
    );
  };

  const resetForm = () => {
    setFormState(defaultFormState);
    setErrorMessage('');
  };

  const handleAddRule = async () => {
    const examTypeId = formState.exam_type_id;
    const skillId = formState.skill_id;
    const numCorrect = Number(formState.num_correct);
    const convertedScore = Number(formState.converted_score);

    if (!examTypeId || !skillId || Number.isNaN(numCorrect) || Number.isNaN(convertedScore)) {
      setErrorMessage('Vui lòng nhập đầy đủ dữ liệu quy đổi.');
      return;
    }

    if (isDuplicateRule(examTypeId, skillId, numCorrect)) {
      setErrorMessage('Bộ quy đổi đã tồn tại với exam type, skill và số câu đúng này.');
      return;
    }

    setErrorMessage('');
    try {
      await createMutation.mutateAsync({
        examTypeId,
        skillId,
        numCorrect: numCorrect,
        convertedScore: convertedScore,
      });
      resetForm();
    } catch (error) {
      setErrorMessage('Không thể thêm cấu hình quy đổi.');
    }
  };

  const handleDeleteRule = async () => {
    if (!deletingRule) {
      return;
    }

    setErrorMessage('');
    try {
      await deleteMutation.mutateAsync(deletingRule.conversion_id);
      setDeletingRule(null);
    } catch (error) {
      setErrorMessage('Không thể xóa cấu hình quy đổi.');
    }
  };

  const handleCreateByJson = async () => {
    if (!jsonCreateValue.trim()) {
      setErrorMessage('Vui lòng nhập JSON trước khi tạo.');
      return;
    }
    try {
      const parsedData = JSON.parse(jsonCreateValue);
      if (!Array.isArray(parsedData)) {
        setErrorMessage('JSON không hợp lệ. Dữ liệu phải là mảng.');
        return;
      }

      const normalizedPayload = parsedData.map((item) => ({
        examTypeId: String(item?.exam_type_id ?? item?.examTypeId ?? '').trim(),
        skillId: String(item?.skill_id ?? item?.skillId ?? '').trim(),
        numCorrect: Number(item?.num_correct ?? item?.numCorrect),
        convertedScore: Number(item?.converted_score ?? item?.convertedScore),
      }));

      const hasInvalidItem = normalizedPayload.some(
        (item) =>
          !item.examTypeId ||
          !item.skillId ||
          Number.isNaN(item.numCorrect) ||
          Number.isNaN(item.convertedScore),
      );
      if (hasInvalidItem) {
        setErrorMessage(
          'JSON có phần tử thiếu dữ liệu. Cần đủ examTypeId, skillId, numCorrect, convertedScore.',
        );
        return;
      }

      await bulkCreateMutation.mutateAsync(normalizedPayload);
      setJsonCreateValue('');
      setShowJsonCreateForm(false);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage('Không thể tạo từ JSON. Vui lòng kiểm tra định dạng và dữ liệu.');
    }
  };

  const columns = [
    {
      key: 'exam_type',
      header: 'Loại kỳ thi',
      render: (rule) => getExamTypeName(rule.exam_type_id),
    },
    {key: 'skill', header: 'Kỹ năng', render: (rule) => getSkillName(rule.skill_id)},
    {key: 'num_correct', header: 'Số câu đúng', render: (rule) => rule.num_correct},
    {
      key: 'converted_score',
      header: 'Điểm quy đổi',
      render: (rule) => rule.converted_score,
    },
  ];

  return (
    <div className="d-flex flex-column gap-3">
      <AdminPageHeader
        title="Quản lý quy đổi điểm"
        description="Thiết lập score theo exam type, kỹ năng và số câu trả lời đúng."
      >
        <Button
          onClick={() => {
            setShowJsonCreateForm((previous) => !previous);
            setErrorMessage('');
            setTimeout(() => jsonTextareaRef.current?.focus(), 0);
          }}
        >
          <Braces size={16} />
          Tạo bằng JSON
        </Button>
      </AdminPageHeader>

      <BaseModal
        show={showJsonCreateForm}
        onClose={() => {
          if (submitting) {
            return;
          }
          setShowJsonCreateForm(false);
          setJsonCreateValue('');
          setErrorMessage('');
        }}
        title="Tạo quy đổi điểm bằng JSON"
        maxWidth={600}
        footer={
          <ModalActionFooter
            onCancel={() => {
              setShowJsonCreateForm(false);
              setJsonCreateValue('');
              setErrorMessage('');
            }}
            onSubmit={handleCreateByJson}
            cancelLabel="Hủy"
            submitLabel="Tạo dữ liệu"
            loading={submitting}
          />
        }
      >
        <AdminFieldError message={errorMessage} />
        <p className="text-secondary mb-3">
          Dán mảng JSON theo format: <code>[{'{'}"examTypeId","skillId","numCorrect","convertedScore"{'}'}]</code>
        </p>
        <Form.Control
          as="textarea"
          ref={jsonTextareaRef}
          rows={12}
          style={{fontFamily: 'monospace', fontSize: '1.4rem'}}
          placeholder='[{"examTypeId":"...","skillId":"...","numCorrect":0,"convertedScore":5}]'
          value={jsonCreateValue}
          onChange={(event) => setJsonCreateValue(event.target.value)}
        />
      </BaseModal>

      <AdminToolbar
        searchValue={keyword}
        onSearchChange={setKeyword}
        searchPlaceholder="Tìm theo exam type, skill hoặc điểm..."
      >
        <Form.Select
          value={examTypeFilter}
          onChange={(event) => setExamTypeFilter(event.target.value)}
        >
          <option value="all">Tất cả loại kỳ thi</option>
          {examTypes.map((examType) => (
            <option key={examType.exam_type_id} value={examType.exam_type_id}>
              {examType.name}
            </option>
          ))}
        </Form.Select>
      </AdminToolbar>
      <div className="d-flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          className={cx('pillBtn', {active: activeSkillId === 'all'})}
          onClick={() => setActiveSkillId('all')}
        >
          Tất cả kỹ năng
        </Button>
        {skills.map((skill) => (
          <Button
            key={skill.skill_id}
            type="button"
            size="sm"
            className={cx('pillBtn', {active: activeSkillId === skill.skill_id})}
            onClick={() => setActiveSkillId(skill.skill_id)}
          >
            {skill.name}
          </Button>
        ))}
      </div>

      <AdminCard>
        <h5>Thêm cấu hình quy đổi</h5>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 150px 150px auto',
            gap: '10px',
            alignItems: 'center',
          }}
        >
          <Form.Select
            value={formState.exam_type_id}
            onChange={(event) =>
              setFormState((previous) => ({...previous, exam_type_id: event.target.value}))
            }
          >
            <option value="">Chọn loại kỳ thi</option>
            {examTypes.map((examType) => (
              <option key={examType.exam_type_id} value={examType.exam_type_id}>
                {examType.name}
              </option>
            ))}
          </Form.Select>
          <Form.Select
            value={formState.skill_id}
            onChange={(event) =>
              setFormState((previous) => ({...previous, skill_id: event.target.value}))
            }
          >
            <option value="">Chọn kỹ năng</option>
            {skills.map((skill) => (
              <option key={skill.skill_id} value={skill.skill_id}>
                {skill.name}
              </option>
            ))}
          </Form.Select>
          <Form.Control
            type="number"
            placeholder="Số câu đúng"
            value={formState.num_correct}
            onChange={(event) =>
              setFormState((previous) => ({...previous, num_correct: event.target.value}))
            }
          />
          <Form.Control
            type="number"
            placeholder="Điểm quy đổi"
            value={formState.converted_score}
            onChange={(event) =>
              setFormState((previous) => ({
                ...previous,
                converted_score: event.target.value,
              }))
            }
          />
          <ButtonPrime onClick={handleAddRule}>
            <Plus size={16} />
            Thêm
          </ButtonPrime>
        </div>
        <AdminFieldError message={errorMessage} />
      </AdminCard>

      <AdminTable
        showIndex
        paginated
        itemLabel="mốc quy đổi"
        columns={columns}
        data={filteredRules}
        loading={loading}
        getRowKey={(rule) => rule.conversion_id}
        rowActions={(rule) => (
          <button className="danger" title="Xóa" onClick={() => setDeletingRule(rule)}>
            <Trash2 size={14} />
          </button>
        )}
      />
      <ConfirmDeleteModal
        show={Boolean(deletingRule)}
        onClose={() => {
          if (submitting) {
            return;
          }
          setDeletingRule(null);
        }}
        onConfirm={handleDeleteRule}
        title="Xác nhận xóa quy đổi"
        message="Bạn có chắc muốn xóa cấu hình quy đổi này không?"
      />
    </div>
  );
}

export default ScoringConversionManagementPage;
