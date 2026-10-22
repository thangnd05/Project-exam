import {useCallback} from 'react';
import {useTranslations} from 'next-intl';

import type {ExamTypeResponse} from '@/app/types/exam-type';

export type Vendor = 'aws' | 'azure' | 'gcp' | 'other';
export type Level = 'foundational' | 'associate' | 'professional' | 'specialty';

export const VENDORS: {id: Vendor; label: string; tag: string}[] = [
  {id: 'aws', label: 'AWS', tag: 'AWS'},
  {id: 'azure', label: 'Microsoft Azure', tag: 'Azure'},
  {id: 'gcp', label: 'Google Cloud', tag: 'GCP'},
  {id: 'other', label: 'Linux & Oracle', tag: 'Khác'},
];

export const LEVELS: {id: Level; label: string}[] = [
  {id: 'foundational', label: 'Foundational'},
  {id: 'associate', label: 'Associate'},
  {id: 'professional', label: 'Professional / Expert'},
  {id: 'specialty', label: 'Specialty'},
];

const CERT_IMAGE_DIR = '/images/certifications';

// Huy hiệu chứng chỉ trong public/images/certifications, tra theo mã kỳ thi.
const BADGE_BY_CODE: Record<string, string> = {
  'CLF-C02': 'AWS_Certified_Cloud_Practitioner',
  'AIF-C01': 'AWS_Certified_AI_Practitioner',
  'SAA-C03': 'AWS_Certified_Solutions_Architect-Associate',
  'DVA-C02': 'AWS_Certified_Developer-Associate',
  'SOA-C02': 'AWS_Certified_CloudOps_Engineer-Associate',
  'SOA-C03': 'AWS_Certified_CloudOps_Engineer-Associate',
  'DEA-C01': 'AWS_Certified_Data_Engineer-Associate',
  'MLA-C01': 'AWS_Certified_Machine_Learning_Engineer-Associate',
  'SAP-C02': 'AWS_Certified_Solutions_Architect-Professional',
  'DOP-C02': 'AWS_Certified_DevOps_Engineer-Professional',
  'AIP-C01': 'AWS_Certified_Generative_AI_Developer-Professional',
  'SCS-C02': 'AWS_Certified_Security-Specialty',
  'SCS-C03': 'AWS_Certified_Security-Specialty',
  'ANS-C01': 'AWS_Certified_Advanced_Networking-Specialty',
  'AZ-900': 'AZ-900',
  'AZ-104': 'AZ-104',
  'AZ-305': 'AZ-305',
  'AZ-400': 'AZ-400',
  'AZ-700': 'AZ-700',
  'DP-900': 'DP-900',
  'AI-901': 'AI-901',
};

// Chứng chỉ Google Cloud không có mã ngắn, tra theo tên.
const BADGE_BY_NAME: [RegExp, string][] = [
  [/associate cloud engineer/i, 'Associate_Cloud_Engineer'],
  [/associate data practitioner/i, 'Associate_Data_Practitioner'],
  [/professional cloud architect/i, 'Professional_Cloud_Architect'],
  [/professional cloud devops/i, 'Professional_Cloud_DevOps_Engineer'],
  [/professional cloud network/i, 'Professional_Cloud_Network_Engineer'],
  [/professional cloud security/i, 'Professional_Cloud_Security_Engineer'],
  [/security operations engineer/i, 'Professional_Security_Operations_Engineer'],
];

// Cấp độ Azure suy từ mã: x00 là nền tảng, AZ-305/AZ-400 là Expert.
const AZURE_LEVEL_BY_CODE: Record<string, Level> = {
  'AZ-900': 'foundational',
  'DP-900': 'foundational',
  'AI-900': 'foundational',
  'AI-901': 'foundational',
  'AZ-104': 'associate',
  'AZ-700': 'associate',
  'AZ-305': 'professional',
  'AZ-400': 'professional',
};

export const parseCode = (name?: string) => {
  const match = name?.match(/\(([A-Z]{2,5}-[A-Z]?\d{2,3})\)/i);
  return match?.[1]?.toUpperCase() ?? '';
};

export const parseVendor = (exam: ExamTypeResponse, code: string): Vendor | null => {
  const text = `${exam.name ?? ''} ${exam.parentName ?? ''}`;
  if (/\baws\b|amazon/i.test(text)) return 'aws';
  if (/azure|microsoft/i.test(text) || code in AZURE_LEVEL_BY_CODE) return 'azure';
  if (/google|\bgcp\b/i.test(text)) return 'gcp';
  if (/linux|\blpi|oracle/i.test(text)) return 'other';
  return null;
};

export const parseLevel = (name: string | undefined, code: string): Level | null => {
  if (AZURE_LEVEL_BY_CODE[code]) return AZURE_LEVEL_BY_CODE[code];
  const text = name ?? '';
  if (/\bspecialty\b/i.test(text)) return 'specialty';
  if (/\b(professional|expert)\b/i.test(text)) return 'professional';
  if (/\bassociate\b/i.test(text)) return 'associate';
  if (/\b(foundational|practitioner|fundamentals)\b/i.test(text)) return 'foundational';
  return null;
};

export const badgeUrl = (name: string | undefined, code: string) => {
  const file = BADGE_BY_CODE[code] ?? BADGE_BY_NAME.find(([pattern]) => pattern.test(name ?? ''))?.[1];
  return file ? `${CERT_IMAGE_DIR}/${file}.webp` : undefined;
};

// Số câu của đề full theo đề thi thật.
export const FULL_QUESTIONS: Record<string, number> = {
  'SAA-C03': 65,
  'SAP-C02': 75,
  'DOP-C02': 75,
};

// Chữ hiển thị của formatFullSpec. Mặc định tiếng Việt cho nơi gọi cũ; trang đã dịch dùng useFormatFullSpec().
export type FullSpecLabels = {
  minutes: (minutes: number) => string;
  byExam: string;
  spec: (questions: number, duration: string) => string;
};

const VI_FULL_SPEC: FullSpecLabels = {
  minutes: (minutes) => `${minutes}p`,
  byExam: 'theo đề',
  spec: (questions, duration) => `${questions} câu / ${duration}`,
};

export const formatFullSpec = (
  durationMinutes: number | null | undefined,
  code: string,
  labels: FullSpecLabels = VI_FULL_SPEC,
) => {
  const questions = FULL_QUESTIONS[code];
  const minutes = durationMinutes ? labels.minutes(durationMinutes) : labels.byExam;
  return questions ? labels.spec(questions, minutes) : minutes;
};

// formatFullSpec theo ngôn ngữ đang chọn (chữ lấy từ Home.fullSpec).
export function useFormatFullSpec() {
  const t = useTranslations('Home.fullSpec');
  return useCallback(
    (durationMinutes: number | null | undefined, code: string) =>
      formatFullSpec(durationMinutes, code, {
        minutes: (minutes) => t('minutes', {minutes}),
        byExam: t('byExam'),
        spec: (questions, duration) => t('spec', {questions, duration}),
      }),
    [t],
  );
}
