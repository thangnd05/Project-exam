'use client';

import { useMemo, useRef, useState } from 'react';
import {Form} from 'react-bootstrap';
import {useTranslations} from 'next-intl';
import {Braces, Plus, Trash2} from 'lucide-react';

import ButtonPrime from '@/app/components/Button/ButtonPrime';
import ConfirmDeleteModal from '@/app/components/modal/ConfirmDeleteModal';
import BaseModal from '@/app/components/modal/BaseModal';
import ModalActionFooter from '@/app/components/modal/ModalActionFooter';
import {
  AdminExamTypePicker,
  AdminCard,
  AdminFieldError,
  AdminPageHeader,
  AdminTable,
  AdminToolbar,
} from '@/app/[locale]/(admin)/_components/common';

import {useScoringConversion, type ScoringRuleItem} from './_hooks/useScoringConversion';

const defaultFormState = {
  exam_type_id: '',
  skill_id: '',
  num_correct: '',
  converted_score: '',
};

function ScoringConversionManagement() {
  const t = useTranslations('AdminContent.scoringConversion');
  const tc = useTranslations('Common');
  const [keyword, setKeyword] = useState('');
  const [examTypeFilter, setExamTypeFilter] = useState('all');
  const [activeSkillId, setActiveSkillId] = useState('all');
  const [formState, setFormState] = useState(defaultFormState);
  const [showJsonCreateForm, setShowJsonCreateForm] = useState(false);
  const [jsonCreateValue, setJsonCreateValue] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const jsonTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [deletingRule, setDeletingRule] = useState<ScoringRuleItem | null>(null);

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

  // Chọn kỹ năng cụ thể thì điền sẵn kỹ năng đó vào form
  const selectSkill = (skillId: string) => {
    setActiveSkillId(skillId);
    if (skillId !== 'all') {
      setFormState((previous) => ({...previous, skill_id: skillId}));
    }
  };

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

  const getExamTypeName = (examTypeId: string) => {
    return (
      examTypes.find((examType) => examType.exam_type_id === examTypeId)?.name || '-'
    );
  };

  const getSkillName = (skillId: string) => {
    return skills.find((skill) => skill.skill_id === skillId)?.name || '-';
  };

  const isDuplicateRule = (examTypeId: string, skillId: string, numCorrect: number) => {
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
      setErrorMessage(t('errors.required'));
      return;
    }

    if (isDuplicateRule(examTypeId, skillId, numCorrect)) {
      setErrorMessage(t('errors.duplicate'));
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
    } catch {
      setErrorMessage(t('errors.createFailed'));
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
    } catch {
      setErrorMessage(t('errors.deleteFailed'));
    }
  };

  const handleCreateByJson = async () => {
    if (!jsonCreateValue.trim()) {
      setErrorMessage(t('errors.jsonEmpty'));
      return;
    }
    try {
      const parsedData = JSON.parse(jsonCreateValue);
      if (!Array.isArray(parsedData)) {
        setErrorMessage(t('errors.jsonNotArray'));
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
        setErrorMessage(t('errors.jsonMissingFields'));
        return;
      }

      await bulkCreateMutation.mutateAsync(normalizedPayload);
      setJsonCreateValue('');
      setShowJsonCreateForm(false);
      setErrorMessage('');
    } catch {
      setErrorMessage(t('errors.jsonCreateFailed'));
    }
  };

  const columns = [
    {
      key: 'exam_type',
      header: t('columns.examType'),
      render: (rule: ScoringRuleItem) => getExamTypeName(rule.exam_type_id),
    },
    {key: 'skill', header: t('columns.skill'), render: (rule: ScoringRuleItem) => getSkillName(rule.skill_id)},
    {key: 'num_correct', header: t('columns.numCorrect'), render: (rule: ScoringRuleItem) => rule.num_correct},
    {
      key: 'converted_score',
      header: t('columns.convertedScore'),
      render: (rule: ScoringRuleItem) => rule.converted_score,
    },
  ];

  return (
    <div className="d-flex flex-column gap-3">
      <AdminPageHeader
        title={t('title')}
        description={t('description')}
      >
        <ButtonPrime
          onClick={() => {
            setShowJsonCreateForm((previous) => !previous);
            setErrorMessage('');
            setTimeout(() => jsonTextareaRef.current?.focus(), 0);
          }}
        >
          <Braces size={16} />
          {t('createByJson')}
        </ButtonPrime>
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
        title={t('jsonModalTitle')}
        maxWidth={600}
        footer={
          <ModalActionFooter
            onCancel={() => {
              setShowJsonCreateForm(false);
              setJsonCreateValue('');
              setErrorMessage('');
            }}
            onSubmit={handleCreateByJson}
            cancelLabel={tc('cancelShort')}
            submitLabel={t('jsonSubmit')}
            loading={submitting}
          />
        }
      >
        <AdminFieldError message={errorMessage} />
        <p className="text-secondary mb-3">
          {t('jsonHelp')} <code>[{'{'}"examTypeId","skillId","numCorrect","convertedScore"{'}'}]</code>
        </p>
        <Form.Control
          as="textarea"
          ref={jsonTextareaRef}
          rows={12}
          style={{fontFamily: 'var(--font-mono)', fontSize: '1.4rem'}}
          placeholder='[{"examTypeId":"...","skillId":"...","numCorrect":0,"convertedScore":5}]'
          value={jsonCreateValue}
          onChange={(event) => setJsonCreateValue(event.target.value)}
        />
      </BaseModal>

      <AdminToolbar
        searchValue={keyword}
        onSearchChange={setKeyword}
        searchPlaceholder={t('searchPlaceholder')}
        filters={
          <AdminExamTypePicker
            value={examTypeFilter}
            onChange={setExamTypeFilter}
            clearable
            clearValue="all"
          />
        }
      />
      <div className="d-flex flex-wrap gap-2">
        <ButtonPrime
          size="sm"
          variant={activeSkillId === 'all' ? 'primary' : 'soft'}
          onClick={() => selectSkill('all')}
        >
          {t('allSkills')}
        </ButtonPrime>
        {skills.map((skill) => (
          <ButtonPrime
            key={skill.skill_id}
            size="sm"
            variant={activeSkillId === skill.skill_id ? 'primary' : 'soft'}
            onClick={() => selectSkill(skill.skill_id)}
          >
            {skill.name}
          </ButtonPrime>
        ))}
      </div>

      <AdminCard>
        <h5>{t('addTitle')}</h5>
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
            <option value="">{t('selectExamType')}</option>
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
            <option value="">{t('selectSkill')}</option>
            {skills.map((skill) => (
              <option key={skill.skill_id} value={skill.skill_id}>
                {skill.name}
              </option>
            ))}
          </Form.Select>
          <Form.Control
            type="number"
            placeholder={t('columns.numCorrect')}
            value={formState.num_correct}
            onChange={(event) =>
              setFormState((previous) => ({...previous, num_correct: event.target.value}))
            }
          />
          <Form.Control
            type="number"
            placeholder={t('columns.convertedScore')}
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
            {t('add')}
          </ButtonPrime>
        </div>
        <AdminFieldError message={errorMessage} />
      </AdminCard>

      <AdminTable
        showIndex
        paginated
        itemLabel={t('itemLabel')}
        columns={columns}
        data={filteredRules}
        loading={loading}
        getRowKey={(rule: ScoringRuleItem) => rule.conversion_id}
        rowActions={(rule: ScoringRuleItem) => (
          <ButtonPrime size="icon" variant="dangerGhost" title={t('delete')} onClick={() => setDeletingRule(rule)}>
            <Trash2 size={14} />
          </ButtonPrime>
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
        title={t('deleteTitle')}
        message={t('deleteMessage')}
      />
    </div>
  );
}

export default ScoringConversionManagement;
