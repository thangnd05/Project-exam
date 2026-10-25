'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Form, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';

import ButtonPrime from '@/app/components/Button/ButtonPrime';
import { AdminCard, AdminFieldError, AdminPageHeader } from '@/app/[locale]/(admin)/_components/common';
import { getApiErrorMessage } from '@/app/utils/apiError';
import { useStreakRecoverConfig } from './_hooks/useStreakRecoverConfig';

function StreakRecoverManagement() {
  const t = useTranslations('AdminUsers');
  const [costCoins, setCostCoins] = useState<number | string>(50);
  const [active, setActive] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const { config, isLoading, isError, updateConfig, isSaving } = useStreakRecoverConfig();

  // Nạp lại form mỗi khi cấu hình từ server thay đổi
  const [prevConfig, setPrevConfig] = useState<typeof config>(null);
  if (config !== prevConfig) {
    setPrevConfig(config);
    if (config) {
      setCostCoins(config.costCoins ?? 50);
      setActive(config.active !== false);
    }
  }

  const displayedError = errorMessage || (isError ? t('streakRecover.errors.load') : '');

  const handleSave = async () => {
    const cost = Number(costCoins);
    if (Number.isNaN(cost) || cost < 0) {
      setErrorMessage(t('streakRecover.errors.costInvalid'));
      return;
    }
    setErrorMessage('');
    try {
      const data = await updateConfig({ costCoins: cost, active });
      setCostCoins(data?.costCoins ?? cost);
      setActive(data?.active !== false);
      toast.success(t('streakRecover.saved'));
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t('streakRecover.errors.save')));
    }
  };

  return (
    <div className="d-flex flex-column gap-3">
      <AdminPageHeader
        title={t('streakRecover.title')}
        description={t('streakRecover.description')}
      />

      {isLoading ? (
        <div className="text-center text-secondary py-4">
          <Spinner size="sm" className="me-2" />
          {t('streakRecover.loading')}
        </div>
      ) : (
        <AdminCard maxWidth={480}>
          <div className="mb-3 fw-bold" style={{ fontSize: '1.6rem' }}>{t('streakRecover.cardTitle')}</div>

          <Form.Group className="mb-3">
            <Form.Label>{t('streakRecover.costLabel')}</Form.Label>
            <Form.Control
              type="number"
              min={0}
              value={costCoins}
              onChange={(e) => setCostCoins(e.target.value)}
            />
            <Form.Text muted>{t('streakRecover.costHint')}</Form.Text>
          </Form.Group>

          <Form.Check
            type="switch"
            id="streak-recover-active"
            label={t('streakRecover.activeLabel')}
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="mb-3"
          />

          <AdminFieldError message={displayedError} />

          <ButtonPrime onClick={handleSave} disabled={isSaving}>
            {isSaving ? t('shared.saving') : t('streakRecover.save')}
          </ButtonPrime>
        </AdminCard>
      )}
    </div>
  );
}

export default StreakRecoverManagement;
