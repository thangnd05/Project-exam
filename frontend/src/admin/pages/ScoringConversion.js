import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Button, Form, Spinner, Table} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {Braces, Plus, Search, Trash2} from 'lucide-react';

import {getExamTypes} from '../../api/examTypeApi';
import {
  createScoringConversion,
  createScoringConversionsBulk,
  deleteScoringConversion,
  getScoringConversions,
  getScoringConversionsBySkill,
} from '../../api/scoringConversionApi';
import {getSkills} from '../../api/skillApi';
import ConfirmDeleteModal from '../../components/common/modal/ConfirmDeleteModal';
import styles from './ScoringConversion.module.scss';

const cx = classNames.bind(styles);

const defaultFormState = {
  exam_type_id: '',
  skill_id: '',
  num_correct: '',
  converted_score: '',
};

function ScoringConversionManagement() {
  const [scoringRules, setScoringRules] = useState([]);
  const [examTypes, setExamTypes] = useState([]);
  const [skills, setSkills] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [examTypeFilter, setExamTypeFilter] = useState('all');
  const [activeSkillId, setActiveSkillId] = useState('all');
  const [formState, setFormState] = useState(defaultFormState);
  const [showJsonCreateForm, setShowJsonCreateForm] = useState(false);
  const [jsonCreateValue, setJsonCreateValue] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const jsonTextareaRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingRule, setDeletingRule] = useState(null);

  const mapExamTypeFromApi = (item) => ({
    exam_type_id: String(item.examTypeId),
    name: item.name || '',
  });

  const mapSkillFromApi = (item) => ({
    skill_id: String(item.skillId),
    name: item.name || '',
  });

  const mapScoringRuleFromApi = (item) => ({
    conversion_id: String(item.conversionId),
    exam_type_id: String(item.examTypeId),
    skill_id: String(item.skillId),
    num_correct: item.numCorrect || 0,
    converted_score: item.convertedScore || 0,
  });

  const loadMetadata = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const [examTypeData, skillData] = await Promise.all([getExamTypes(), getSkills()]);
      setExamTypes(examTypeData.map(mapExamTypeFromApi));
      setSkills(skillData.map(mapSkillFromApi));
    } catch (error) {
      setErrorMessage('Không thể tải dữ liệu quy đổi điểm.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  const loadScoringRules = useCallback(async (skillId, examTypeId) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const scoringData =
        skillId && skillId !== 'all'
          ? await getScoringConversionsBySkill(skillId, examTypeId)
          : await getScoringConversions();
      setScoringRules(scoringData.map(mapScoringRuleFromApi));
    } catch (error) {
      setErrorMessage('Không thể tải dữ liệu quy đổi điểm.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadScoringRules(activeSkillId, examTypeFilter);
  }, [activeSkillId, examTypeFilter, loadScoringRules]);

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

    setSubmitting(true);
    setErrorMessage('');
    try {
      const createdRule = await createScoringConversion({
        examTypeId,
        skillId,
        numCorrect: numCorrect,
        convertedScore: convertedScore,
      });

      const normalizedCreatedRule = mapScoringRuleFromApi(createdRule);
      setScoringRules((previous) => [...previous, normalizedCreatedRule]);
      resetForm();
    } catch (error) {
      setErrorMessage('Không thể thêm cấu hình quy đổi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRule = async () => {
    if (!deletingRule) {
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    try {
      await deleteScoringConversion(deletingRule.conversion_id);
      setScoringRules((previous) =>
        previous.filter((rule) => rule.conversion_id !== deletingRule.conversion_id),
      );
      setDeletingRule(null);
    } catch (error) {
      setErrorMessage('Không thể xóa cấu hình quy đổi.');
    } finally {
      setSubmitting(false);
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

      setSubmitting(true);
      const createdRules = await createScoringConversionsBulk(normalizedPayload);
      const mappedCreatedRules = createdRules.map(mapScoringRuleFromApi);
      setScoringRules((previous) => [...previous, ...mappedCreatedRules]);
      setJsonCreateValue('');
      setShowJsonCreateForm(false);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage('Không thể tạo từ JSON. Vui lòng kiểm tra định dạng và dữ liệu.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={cx('scoringPage')}>
      <div className={cx('pageHeader')}>
        <div>
          <h1>Quản lý quy đổi điểm</h1>
          <p>Thiết lập score theo exam type, kỹ năng và số câu trả lời đúng.</p>
        </div>
        <div className={cx('headerActions')}>
          <Button
            variant="outline-primary"
            onClick={() => {
              setShowJsonCreateForm((previous) => !previous);
              setErrorMessage('');
              setTimeout(() => jsonTextareaRef.current?.focus(), 0);
            }}
          >
            <Braces size={16} />
            Tạo bằng JSON
          </Button>
        </div>
      </div>

      {showJsonCreateForm && (
        <div className={cx('jsonCreateBox')}>
          <h5>Tạo quy đổi điểm bằng JSON</h5>
          <p>
            Dán mảng JSON theo format: <code>[{'{'}"examTypeId","skillId","numCorrect","convertedScore"{'}'}]</code>
          </p>
          <Form.Control
            as="textarea"
            ref={jsonTextareaRef}
            rows={8}
            placeholder='[{"examTypeId":"...","skillId":"...","numCorrect":0,"convertedScore":5}]'
            value={jsonCreateValue}
            onChange={(event) => setJsonCreateValue(event.target.value)}
          />
          <div className={cx('jsonActions')}>
            <Button variant="primary" disabled={submitting} onClick={handleCreateByJson}>
              Tạo dữ liệu
            </Button>
            <Button
              variant="outline-secondary"
              disabled={submitting}
              onClick={() => {
                setShowJsonCreateForm(false);
                setJsonCreateValue('');
                setErrorMessage('');
              }}
            >
              Hủy
            </Button>
          </div>
        </div>
      )}

      <div className={cx('filters')}>
        <div className={cx('searchContainer')}>
          <Search size={16} className={cx('searchIcon')} />
          <Form.Control
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm theo exam type, skill hoặc điểm..."
          />
        </div>
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
      </div>
      <div className={cx('skillTabs')}>
        <button
          type="button"
          className={cx('skillTab', {active: activeSkillId === 'all'})}
          onClick={() => setActiveSkillId('all')}
        >
          Tất cả kỹ năng
        </button>
        {skills.map((skill) => (
          <button
            key={skill.skill_id}
            type="button"
            className={cx('skillTab', {active: activeSkillId === skill.skill_id})}
            onClick={() => setActiveSkillId(skill.skill_id)}
          >
            {skill.name}
          </button>
        ))}
      </div>

      <div className={cx('createBox')}>
        <h5>Thêm cấu hình quy đổi</h5>
        <div className={cx('createGrid')}>
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
          <Button onClick={handleAddRule}>
            <Plus size={16} />
            Thêm
          </Button>
        </div>
        {errorMessage && <p className={cx('errorText')}>{errorMessage}</p>}
      </div>

      <div className={cx('tableWrapper')}>
        <Table responsive hover>
          <thead>
            <tr>
              <th>ID</th>
              <th>Loại kỳ thi</th>
              <th>Kỹ năng</th>
              <th>Số câu đúng</th>
              <th>Điểm quy đổi</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="text-center py-4">
                  <Spinner size="sm" className="me-2" />
                  Đang tải dữ liệu...
                </td>
              </tr>
            )}
            {!loading &&
              filteredRules.map((rule) => (
              <tr key={rule.conversion_id}>
                <td>{rule.conversion_id}</td>
                <td>{getExamTypeName(rule.exam_type_id)}</td>
                <td>{getSkillName(rule.skill_id)}</td>
                <td>{rule.num_correct}</td>
                <td>{rule.converted_score}</td>
                <td>
                  <button
                    className={cx('deleteButton')}
                    title="Xóa"
                    onClick={() => setDeletingRule(rule)}
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
              ))}
            {!loading && filteredRules.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-4">
                  Không có dữ liệu.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
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

export default ScoringConversionManagement;
