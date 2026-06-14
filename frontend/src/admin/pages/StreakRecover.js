import React, { useCallback, useEffect, useState } from 'react';
import { Button, Form, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { Flame } from 'lucide-react';

import { getStreakRecoverConfig, updateStreakRecoverConfig } from '~/api/streakApi';
import { AdminCard, AdminFieldError, AdminPageHeader } from '../components/common';

// Trang admin: cấu hình giá xu + bật/tắt tính năng khôi phục chuỗi ngày.
function StreakRecoverManagement() {
  const [costCoins, setCostCoins] = useState(50);
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getStreakRecoverConfig();
      setCostCoins(data?.costCoins ?? 50);
      setActive(data?.active !== false);
    } catch (error) {
      setErrorMessage('Không thể tải cấu hình.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    const cost = Number(costCoins);
    if (Number.isNaN(cost) || cost < 0) {
      setErrorMessage('Giá xu phải là số không âm.');
      return;
    }
    setSaving(true);
    setErrorMessage('');
    try {
      const data = await updateStreakRecoverConfig({ costCoins: cost, active });
      setCostCoins(data?.costCoins ?? cost);
      setActive(data?.active !== false);
      toast.success('Đã lưu cấu hình khôi phục chuỗi.');
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Không thể lưu cấu hình.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="d-flex flex-column gap-3">
      <AdminPageHeader
        title="Khôi phục chuỗi ngày"
        description="Giá xu user phải trả để nối lại chuỗi đã đứt (khi chưa học lại)."
      />

      {loading ? (
        <div className="text-center text-secondary py-4">
          <Spinner size="sm" className="me-2" />
          Đang tải cấu hình...
        </div>
      ) : (
        <AdminCard maxWidth={480}>
          <div
            className="d-flex align-items-center gap-2 mb-3 fw-bold"
            style={{ fontSize: '1.6rem', color: '#f08c00' }}
          >
            <Flame size={28} />
            <span>Cấu hình tính năng khôi phục</span>
          </div>

          <Form.Group className="mb-3">
            <Form.Label>Giá khôi phục (xu)</Form.Label>
            <Form.Control
              type="number"
              min={0}
              value={costCoins}
              onChange={(e) => setCostCoins(e.target.value)}
            />
            <Form.Text muted>Đặt 0 nếu muốn cho khôi phục miễn phí.</Form.Text>
          </Form.Group>

          <Form.Check
            type="switch"
            id="streak-recover-active"
            label="Cho phép khôi phục chuỗi"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="mb-3"
          />

          <AdminFieldError message={errorMessage} />

          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
          </Button>
        </AdminCard>
      )}
    </div>
  );
}

export default StreakRecoverManagement;
