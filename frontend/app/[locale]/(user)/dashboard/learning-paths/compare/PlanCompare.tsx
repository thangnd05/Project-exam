'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import classNames from 'classnames';
import classNamesBind from 'classnames/bind';
import TargetPlanTabs from '@/app/features/my-target/TargetPlanTabs/TargetPlanTabs';
import ExamPillPicker from '@/app/features/my-target/ExamPillPicker/ExamPillPicker';
import { getStandardExamTypes } from '@/app/apis/examTypeApi';
import { listPlans } from '@/app/apis/learningPlanApi';
import routes from '@/app/configs/Routes';
import { examTypeKeys } from '@/app/configs/queryKeys';
import { MIN_PLANS_TO_COMPARE } from '@/app/features/learning-plans/planCompare';
import {
  examTypeIdFromParams,
  setExamParam,
  useNormalizeExamParam,
  withExam,
} from '@/app/features/exam-types/hooks/useExamParam';
import { useSearchParamsState } from '@/app/hooks/useSearchParamsState';
import { getApiErrorMessage } from '@/app/utils/apiError';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';
import planStyles from '@/app/assets/styles/diagnostic/PersonalizedPlan.module.scss';
import uiStyles from '@/app/assets/styles/FlatUi.module.scss';
import PlanComparisonSection from './_components/PlanComparisonSection';
import ButtonPrime from '@/app/components/Button/ButtonPrime';

const planCx = classNamesBind.bind(planStyles);
const ui = classNamesBind.bind(uiStyles);

// So sánh các lộ trình của một kỳ thi; kỳ thi chọn qua ?exam=<slug> như các trang mục tiêu khác.
function PlanCompare() {
  const t = useTranslations('LearningPlans');
  const [searchParams, setSearchParams] = useSearchParamsState();
  const [examTypeId, setExamTypeId] = useState('');

  const examTypesQuery = useQuery({ queryKey: examTypeKeys.standard, queryFn: getStandardExamTypes });
  const examTypes = examTypesQuery.data ?? EMPTY_LIST;

  const plansQuery = useQuery({
    queryKey: ['learning-plans', examTypeId],
    queryFn: () => listPlans(examTypeId),
    enabled: !!examTypeId,
  });
  const plans = Array.isArray(plansQuery.data) ? plansQuery.data : EMPTY_LIST;

  useNormalizeExamParam(examTypes);

  // Danh sách kỳ thi về thì chọn kỳ thi theo ?exam= hoặc kỳ đầu tiên (điều chỉnh state ngay khi render).
  if (!examTypeId && examTypes.length > 0) {
    setExamTypeId(examTypeIdFromParams(searchParams, examTypes) || examTypes[0].examTypeId);
  }

  const examTypeName = examTypes.find((et) => et.examTypeId === examTypeId)?.name || '';
  const loading = examTypesQuery.isLoading || plansQuery.isLoading;
  const error = plansQuery.error ? getApiErrorMessage(plansQuery.error, plansQuery.error.message) : null;

  return (
    <div className={classNames(planCx('wrapper'), ui('pageRoot'))}>
      <TargetPlanTabs active="compare" examTypeId={examTypeId} examTypes={examTypes} />
      <h1 className="visually-hidden">{t('compare.title')}</h1>

      <ExamPillPicker
        className={ui('pickerRow')}
        examTypes={examTypes}
        value={examTypeId}
        onChange={(nextId) => {
          setExamTypeId(nextId);
          setSearchParams(setExamParam(new URLSearchParams(), nextId, examTypes));
        }}
      />

      {error && (
        <div className={ui('notice', 'noticeDanger')}>
          <span>{error}</span>
        </div>
      )}
      {loading && <div className={ui('skeleton')} aria-hidden="true" />}

      {!loading && !error && plans.length < MIN_PLANS_TO_COMPARE && (
        <div className={ui('empty')}>
          <h2>{t('compare.emptyTitle')}</h2>
          <p>{t('compare.emptyDescription', { min: MIN_PLANS_TO_COMPARE })}</p>
          <ButtonPrime as="link" variant="ink" href={withExam(routes.generatePlan, examTypeId, examTypes)}>
            {plans.length === 0 ? t('compare.generateFirst') : t('compare.generateMore')}
          </ButtonPrime>
        </div>
      )}

      {!loading && <PlanComparisonSection plans={plans} examTypeName={examTypeName} />}
    </div>
  );
}

export default PlanCompare;
