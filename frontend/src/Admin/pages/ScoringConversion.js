import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Button, Form, Spinner, Table} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {Download, Plus, Search, Trash2, Upload} from 'lucide-react';

import {getExamTypes} from '../../api/examTypeApi';
import {
  createScoringConversion,
  deleteScoringConversion,
  getScoringConversions,
} from '../../api/scoringConversionApi';
import {getSkills} from '../../api/skillApi';
import ConfirmDeleteModal from '../../components/modals/ConfirmDeleteModal';
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
  const [skillFilter, setSkillFilter] = useState('all');
  const [formState, setFormState] = useState(defaultFormState);
  const [errorMessage, setErrorMessage] = useState('');
  const importInputRef = useRef(null);
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

  const loadScoringData = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const [scoringData, examTypeData, skillData] = await Promise.all([
        getScoringConversions(),
        getExamTypes(),
        getSkills(),
      ]);
      setScoringRules(scoringData.map(mapScoringRuleFromApi));
      setExamTypes(examTypeData.map(mapExamTypeFromApi));
      setSkills(skillData.map(mapSkillFromApi));
    } catch (error) {
      setErrorMessage('Không thể tải dữ liệu quy đổi điểm.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScoringData();
  }, []);

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
      const matchSkill = skillFilter === 'all' || String(rule.skill_id) === skillFilter;
      const matchKeyword =
        normalizedKeyword.length === 0 ||
        examTypeName.toLowerCase().includes(normalizedKeyword) ||
        skillName.toLowerCase().includes(normalizedKeyword) ||
        String(rule.num_correct).includes(normalizedKeyword) ||
        String(rule.converted_score).includes(normalizedKeyword);

      return matchExamType && matchSkill && matchKeyword;
    });
  }, [examTypeFilter, examTypes, keyword, scoringRules, skillFilter, skills]);

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

      setScoringRules((previous) => [...previous, mapScoringRuleFromApi(createdRule)]);
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

  const handleExport = () => {
    const content = JSON.stringify(scoringRules, null, 2);
    const blob = new Blob([content], {type: 'application/json'});
    const downloadUrl = URL.createObjectURL(blob);
    const anchorElement = document.createElement('a');
    anchorElement.href = downloadUrl;
    anchorElement.download = 'scoring-conversion.json';
    anchorElement.click();
    URL.revokeObjectURL(downloadUrl);
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const fileContent = await file.text();
      const parsedData = JSON.parse(fileContent);
      if (!Array.isArray(parsedData)) {
        setErrorMessage('File import không hợp lệ. Dữ liệu phải là mảng JSON.');
        return;
      }

      const normalizedData = parsedData
        .filter(
          (item) =>
            item &&
            String(item.exam_type_id || item.examTypeId || '').trim() &&
            String(item.skill_id || item.skillId || '').trim() &&
            !Number.isNaN(Number(item.num_correct)) &&
            !Number.isNaN(Number(item.converted_score)),
        )
        .map((item, index) => ({
          conversion_id: String(item.conversion_id || item.conversionId || index + 1),
          exam_type_id: String(item.exam_type_id || item.examTypeId),
          skill_id: String(item.skill_id || item.skillId),
          num_correct: Number(item.num_correct),
          converted_score: Number(item.converted_score),
        }));

      setScoringRules(normalizedData);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage('Không thể đọc file import. Vui lòng kiểm tra định dạng JSON.');
    } finally {
      if (importInputRef.current) {
        importInputRef.current.value = '';
      }
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
          <input
            ref={importInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className={cx('hiddenInput')}
          />
          <Button variant="outline-primary" onClick={() => importInputRef.current?.click()}>
            <Upload size={16} />
            Import JSON
          </Button>
          <Button variant="primary" onClick={handleExport}>
            <Download size={16} />
            Export JSON
          </Button>
        </div>
      </div>

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
        <Form.Select value={skillFilter} onChange={(event) => setSkillFilter(event.target.value)}>
          <option value="all">Tất cả kỹ năng</option>
          {skills.map((skill) => (
            <option key={skill.skill_id} value={skill.skill_id}>
              {skill.name}
            </option>
          ))}
        </Form.Select>
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
