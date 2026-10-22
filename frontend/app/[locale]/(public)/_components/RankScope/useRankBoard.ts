'use client';

import {useQueries, useQuery} from '@tanstack/react-query';

import {getStandardExamTypes} from '@/app/apis/examTypeApi';
import {getQuickChallengeLeaderboard} from '@/app/apis/userTestApi';
import {examTypeKeys} from '@/app/configs/queryKeys';
import type {QuickLeaderboardEntry} from '@/app/types/attempt';
import type {ExamTypeResponse} from '@/app/types/exam-type';
import {badgeUrl, parseCode, parseVendor, type Vendor} from '@/app/(public)/_lib/certificationMeta';

export type RankExam = {
  examTypeId: string;
  name: string;
  vendor: Vendor;
  badge?: string;
  scoreMax: number;
};

export type RankRow = {entry: QuickLeaderboardEntry; exam: RankExam};

// Tiền tố query key chung của mọi bảng xếp hạng Full Mock, dùng để làm mới tất cả cùng lúc.
export const RANK_BOARD_KEY = 'full-mock-leaderboard';

const rankBoardKey = (limit: number, examTypeId: string) => [RANK_BOARD_KEY, examTypeId, limit] as const;

const normalizeExamTypes = (payload: unknown): ExamTypeResponse[] => {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object' && Array.isArray((payload as {data?: unknown}).data)) {
    return (payload as {data: ExamTypeResponse[]}).data;
  }
  return [];
};

// Bảng xếp hạng chỉ có ở kỳ thi chuẩn (không flexible), là lá và nhận diện được hãng.
const toRankExams = (payload: unknown): RankExam[] =>
  normalizeExamTypes(payload)
    .filter((exam) => !exam.flexible && Number(exam.childCount ?? 0) === 0)
    .flatMap((exam) => {
      const code = parseCode(exam.name);
      const vendor = parseVendor(exam, code);
      if (!vendor) return [];
      return [{
        examTypeId: exam.examTypeId,
        name: exam.name ?? code,
        vendor,
        badge: badgeUrl(exam.name, code),
        scoreMax: exam.scoreMax || 1000,
      }];
    });

// Thang điểm mỗi kỳ thi có thể khác nhau nên xếp theo tỉ lệ điểm / điểm tối đa.
const ratio = ({entry, exam}: RankRow) => (entry.totalScore ?? 0) / exam.scoreMax;

export const initials = (name: string) => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[words.length - 2][0] + words[words.length - 1][0]).toUpperCase();
};

export const displayName = (entry: QuickLeaderboardEntry) =>
  entry.displayName || entry.userName || 'Ẩn danh';

// API chỉ trả bảng xếp hạng theo từng kỳ thi, nên lấy top `limit` của mỗi kỳ rồi gộp và xếp lại.
export function useRankBoard(limit: number, enabled = true) {
  const {data: exams = [], isLoading: examsLoading} = useQuery({
    queryKey: examTypeKeys.standard,
    queryFn: getStandardExamTypes,
    select: toRankExams,
  });

  const boards = useQueries({
    queries: exams.map((exam) => ({
      queryKey: rankBoardKey(limit, exam.examTypeId),
      queryFn: () => getQuickChallengeLeaderboard(limit, exam.examTypeId),
      enabled,
    })),
  });

  const rowsFor = (vendor: Vendor | 'all', max = limit): RankRow[] =>
    boards
      .flatMap((board, i) => (board.data?.entries ?? []).map((entry) => ({entry, exam: exams[i]})))
      .filter((row) => vendor === 'all' || row.exam.vendor === vendor)
      .sort((a, b) => ratio(b) - ratio(a))
      .slice(0, max);

  return {
    vendors: Array.from(new Set(exams.map((e) => e.vendor))),
    rowsFor,
    isLoading: examsLoading || boards.some((b) => b.isLoading),
    isFetching: boards.some((b) => b.isFetching),
  };
}
