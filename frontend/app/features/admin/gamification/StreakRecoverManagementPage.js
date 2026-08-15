'use client';

import { useEffect, useState } from 'react';
import { Form, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { Flame } from 'lucide-react';

import ButtonPrime from '@/app/components/Button/ButtonPrime';
import { AdminCard, AdminFieldError, AdminPageHeader } from '@/app/components/admin/common';
import { useStreakRecoverConfig } from '@/app/features/admin/gamification/hooks/useStreakRecoverConfig';

function StreakRecoverManagementPage() {
  const [costCoins, setCostCoins] = useState(50);
  const [active, setActive] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const { config, isLoading, isError, updateConfig, isSaving } = useStreakRecoverConfig();

  useEffect(() => {
    if (config) {
      setCostCoins(config.costCoins ?? 50);
      setActive(config.active !== false);
    }
  }, [config]);

  useEffect(() => {
    if (isError) {
      setErrorMessage('Không thể tải cấu hình.');
    }
  }, [isError]);

  const handleSave = async () => {
    const cost = Number(costCoins);
    if (Number.isNaN(cost) || cost < 0) {
      setErrorMessage('Giá xu phải là số không âm.');
      return;
    }
    setErrorMessage('');
    try {
      const data = await updateConfig({ costCoins: cost, active });
      setCostCoins(data?.costCoins ?? cost);
      setActive(data?.active !== false);
      toast.success('Đã lưu cấu hình khôi phục chuỗi.');
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Không thể lưu cấu hình.');
    }
  };

  return (
    <div className="d-flex flex-column gap-3">
      <AdminPageHeader
        title="Khôi phục chuỗi ngày"
        description="Giá xu user phải trả để nối lại chuỗi đã đứt (khi chưa học lại)."
      />

      {isLoading ? (
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

          <ButtonPrime onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Đang lưu...' : 'Lưu cấu hình'}
          </ButtonPrime>
        </AdminCard>
      )}
    </div>
  );
}

export default StreakRecoverManagementPage;
