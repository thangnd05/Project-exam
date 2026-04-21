import React, {useMemo, useState} from 'react';
import {Badge, Button, Form, Table} from 'react-bootstrap';
import classNames from 'classnames/bind';
import {EyeOff, Search, Trash2} from 'lucide-react';

import {fakeEvaluations, fakeUsers} from '../data/fakeData';
import styles from './Evaluations.module.scss';

const cx = classNames.bind(styles);

const normalizeEvaluations = (evaluations) => {
  return evaluations.map((evaluation) => ({
    ...evaluation,
    is_hidden: false,
  }));
};

function EvaluationsManagement() {
  const [evaluationList, setEvaluationList] = useState(
    normalizeEvaluations(fakeEvaluations),
  );
  const [keyword, setKeyword] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');

  const filteredEvaluations = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return evaluationList.filter((evaluation) => {
      const user = fakeUsers.find((item) => item.user_id === evaluation.user_id);
      const userText = `${user?.full_name || ''} ${user?.user_name || ''}`.toLowerCase();
      const matchKeyword =
        normalizedKeyword.length === 0 ||
        evaluation.content.toLowerCase().includes(normalizedKeyword) ||
        userText.includes(normalizedKeyword);
      const matchRating =
        ratingFilter === 'all' || String(evaluation.rating) === ratingFilter;
      return matchKeyword && matchRating;
    });
  }, [evaluationList, keyword, ratingFilter]);

  const handleHide = (evaluationId) => {
    setEvaluationList((previous) =>
      previous.map((evaluation) =>
        evaluation.id === evaluationId
          ? {...evaluation, is_hidden: !evaluation.is_hidden}
          : evaluation,
      ),
    );
  };

  const handleDelete = (evaluationId) => {
    setEvaluationList((previous) =>
      previous.filter((evaluation) => evaluation.id !== evaluationId),
    );
  };

  return (
    <div className={cx('evaluationsPage')}>
      <div className={cx('pageHeader')}>
        <h1>Duyệt đánh giá</h1>
        <p>Lọc theo rating, ẩn đánh giá không phù hợp hoặc xóa khỏi hệ thống.</p>
      </div>

      <div className={cx('filters')}>
        <div className={cx('searchContainer')}>
          <Search size={16} className={cx('searchIcon')} />
          <Form.Control
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm theo nội dung hoặc người dùng..."
          />
        </div>
        <Form.Select
          value={ratingFilter}
          onChange={(event) => setRatingFilter(event.target.value)}
          className={cx('ratingFilter')}
        >
          <option value="all">Tất cả rating</option>
          <option value="5">5 sao</option>
          <option value="4">4 sao</option>
          <option value="3">3 sao</option>
          <option value="2">2 sao</option>
          <option value="1">1 sao</option>
        </Form.Select>
      </div>

      <div className={cx('tableWrapper')}>
        <Table responsive hover>
          <thead>
            <tr>
              <th>ID</th>
              <th>Người dùng</th>
              <th>Rating</th>
              <th>Nội dung</th>
              <th>Ngày tạo</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvaluations.map((evaluation) => {
              const user = fakeUsers.find((item) => item.user_id === evaluation.user_id);
              return (
                <tr key={evaluation.id}>
                  <td>{evaluation.id}</td>
                  <td>{user?.full_name || 'Ẩn danh'}</td>
                  <td>{evaluation.rating}/5</td>
                  <td>{evaluation.content}</td>
                  <td>{evaluation.created_at || '-'}</td>
                  <td>
                    <Badge bg={evaluation.is_hidden ? 'secondary' : 'success'}>
                      {evaluation.is_hidden ? 'Đã ẩn' : 'Hiển thị'}
                    </Badge>
                  </td>
                  <td>
                    <div className={cx('actionButtons')}>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => handleHide(evaluation.id)}
                      >
                        <EyeOff size={14} />
                        {evaluation.is_hidden ? 'Bỏ ẩn' : 'Ẩn'}
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(evaluation.id)}
                      >
                        <Trash2 size={14} />
                        Xóa
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>
    </div>
  );
}

export default EvaluationsManagement;
