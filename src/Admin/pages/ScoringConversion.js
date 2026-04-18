import React, {useMemo, useRef, useState} from 'react';
import {Button, Form, Table} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {Download, Plus, Search, Trash2, Upload} from 'lucide-react';

import {fakeExamTypes, fakeSkills} from '../data/fakeData';
import styles from './ScoringConversion.module.scss';

const cx = classNames.bind(styles);

const initialScoringRules = [
  {conversion_id: 1, exam_type_id: 1, skill_id: 4, num_correct: 30, converted_score: 7},
  {conversion_id: 2, exam_type_id: 1, skill_id: 5, num_correct: 32, converted_score: 7},
  {conversion_id: 3, exam_type_id: 3, skill_id: 4, num_correct: 75, converted_score: 380},
  {conversion_id: 4, exam_type_id: 3, skill_id: 5, num_correct: 78, converted_score: 400},
];

const defaultFormState = {
  exam_type_id: '',
  skill_id: '',
  num_correct: '',
  converted_score: '',
};

function ScoringConversionManagement() {
  const [scoringRules, setScoringRules] = useState(initialScoringRules);
  const [keyword, setKeyword] = useState('');
  const [examTypeFilter, setExamTypeFilter] = useState('all');
  const [skillFilter, setSkillFilter] = useState('all');
  const [formState, setFormState] = useState(defaultFormState);
  const [errorMessage, setErrorMessage] = useState('');
  const importInputRef = useRef(null);

  const filteredRules = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return scoringRules.filter((rule) => {
      const examTypeName =
        fakeExamTypes.find((examType) => examType.exam_type_id === rule.exam_type_id)
          ?.name || '';
      const skillName =
        fakeSkills.find((skill) => skill.skill_id === rule.skill_id)?.name || '';

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
  }, [examTypeFilter, keyword, scoringRules, skillFilter]);

  const getExamTypeName = (examTypeId) => {
    return (
      fakeExamTypes.find((examType) => examType.exam_type_id === examTypeId)?.name || '-'
    );
  };

  const getSkillName = (skillId) => {
    return fakeSkills.find((skill) => skill.skill_id === skillId)?.name || '-';
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

  const handleAddRule = () => {
    const examTypeId = Number(formState.exam_type_id);
    const skillId = Number(formState.skill_id);
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

    const nextConversionId =
      scoringRules.reduce(
        (maxConversionId, rule) => Math.max(maxConversionId, rule.conversion_id),
        0,
      ) + 1;

    setScoringRules((previous) => [
      ...previous,
      {
        conversion_id: nextConversionId,
        exam_type_id: examTypeId,
        skill_id: skillId,
        num_correct: numCorrect,
        converted_score: convertedScore,
      },
    ]);
    resetForm();
  };

  const handleDeleteRule = (conversionId) => {
    setScoringRules((previous) =>
      previous.filter((rule) => rule.conversion_id !== conversionId),
    );
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
            Number(item.exam_type_id) &&
            Number(item.skill_id) &&
            !Number.isNaN(Number(item.num_correct)) &&
            !Number.isNaN(Number(item.converted_score)),
        )
        .map((item, index) => ({
          conversion_id: index + 1,
          exam_type_id: Number(item.exam_type_id),
          skill_id: Number(item.skill_id),
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
          {fakeExamTypes.map((examType) => (
            <option key={examType.exam_type_id} value={examType.exam_type_id}>
              {examType.name}
            </option>
          ))}
        </Form.Select>
        <Form.Select value={skillFilter} onChange={(event) => setSkillFilter(event.target.value)}>
          <option value="all">Tất cả kỹ năng</option>
          {fakeSkills.map((skill) => (
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
            {fakeExamTypes.map((examType) => (
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
            {fakeSkills.map((skill) => (
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
            {filteredRules.map((rule) => (
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
                    onClick={() => handleDeleteRule(rule.conversion_id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
}

export default ScoringConversionManagement;
