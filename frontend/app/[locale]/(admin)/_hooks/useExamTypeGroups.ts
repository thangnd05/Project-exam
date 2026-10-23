'use client';

import {useMemo} from 'react';
import {useQuery} from '@tanstack/react-query';

import {getExamTypes, getStandardExamTypes} from '@/app/apis/examTypeApi';
import {examTypeKeys} from '@/app/configs/queryKeys';
import type {ExamTypeResponse} from '@/app/types';
import {EMPTY_LIST} from '@/app/utils/stableEmpty';
import {
  VENDORS,
  isLeafExam,
  parseCode,
  parseVendor,
  type Vendor,
} from '@/app/[locale]/(public)/_lib/certificationMeta';

export type ExamTypeSource = 'all' | 'standard';

export type ExamTypePill = {
  id: string;
  name: string;
  /** Mã kỳ thi (SAA-C03) nếu tên có, không thì tên đầy đủ. */
  label: string;
};

export type ExamTypeGroup = {
  vendor: Vendor;
  exams: ExamTypePill[];
};

// Chia kỳ thi theo hãng như Kho đề thi ngoài web. Loại cha (AWS, Azure...) chỉ là nhóm nên bỏ,
// còn kỳ thi không đoán được hãng thì vào "Khác" chứ không bị ẩn như ở web.
export function groupExamTypesByVendor(list: readonly ExamTypeResponse[]): ExamTypeGroup[] {
  const byVendor = new Map<Vendor, ExamTypePill[]>();
  list.filter(isLeafExam).forEach((exam) => {
    const name = exam.name?.trim() ?? '';
    const code = parseCode(name);
    const vendor = parseVendor(exam, code) ?? 'other';
    const pills = byVendor.get(vendor) ?? [];
    pills.push({id: String(exam.examTypeId), name, label: code || name});
    byVendor.set(vendor, pills);
  });
  return VENDORS.flatMap(({id}) => {
    const exams = byVendor.get(id);
    return exams ? [{vendor: id, exams}] : [];
  });
}

export function useExamTypeGroups(source: ExamTypeSource = 'all') {
  const query = useQuery({
    queryKey: source === 'standard' ? examTypeKeys.standard : examTypeKeys.all,
    queryFn: source === 'standard' ? getStandardExamTypes : getExamTypes,
  });
  const list = query.data ?? EMPTY_LIST;
  const groups = useMemo(() => groupExamTypesByVendor(list), [list]);

  return {
    groups,
    firstExamId: groups[0]?.exams[0]?.id ?? '',
    isLoading: query.isLoading,
  };
}
