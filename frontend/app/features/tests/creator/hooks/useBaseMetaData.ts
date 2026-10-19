'use client';

import { useQuery } from '@tanstack/react-query';
import { getExamTypes } from '@/app/apis/examTypeApi';
import { getQuestionCollections } from '@/app/apis/questionCollectionApi';
import { getExamPartsByExamType } from '@/app/apis/examPartApi';
import { getTagsFlatByExamType } from '@/app/apis/tagApi';
import { sortByPartOrder } from '@/app/features/exam-types/partOrder';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';
import type { ExamPartResponse, ExamTypeResponse, QuestionCollectionResponse, TagResponse } from '@/app/types';
import {examTypeKeys, questionCollectionKeys, examPartKeys, tagKeys} from '@/app/configs/queryKeys';

// API có thể trả mảng trực tiếp hoặc bọc trong { data } / { content }
type ListPayload<T> = T[] | { data?: T[]; content?: T[] } | null | undefined;

const normalizeList = <T,>(payload: ListPayload<T>): T[] => {
    if (Array.isArray(payload)) {
        return payload;
    }
    if (payload && Array.isArray(payload.data)) {
        return payload.data;
    }
    if (payload && Array.isArray(payload.content)) {
        return payload.content;
    }
    return [];
};

export const baseMetaKeys = {
    examTypes: examTypeKeys.all,
    questionCollections: questionCollectionKeys.all,
    examParts: examPartKeys.byExamType,
    tagsFlat: tagKeys.flat,
};

export const useBaseMetaData = (examTypeId?: string | number | null) => {
    const examTypesQuery = useQuery({
        queryKey: baseMetaKeys.examTypes,
        queryFn: getExamTypes,
        select: normalizeList<ExamTypeResponse>,
    });

    const questionCollectionsQuery = useQuery({
        queryKey: baseMetaKeys.questionCollections,
        queryFn: getQuestionCollections,
        select: normalizeList<QuestionCollectionResponse>,
    });

    const examPartsQuery = useQuery({
        queryKey: baseMetaKeys.examParts(examTypeId),
        queryFn: () => getExamPartsByExamType(String(examTypeId)),
        enabled: !!examTypeId,
        select: (data: ExamPartResponse[]) => sortByPartOrder(normalizeList(data)),
    });

    const availableTagsQuery = useQuery({
        queryKey: baseMetaKeys.tagsFlat(examTypeId),
        queryFn: () => getTagsFlatByExamType(String(examTypeId)),
        enabled: !!examTypeId,
        select: (tags: TagResponse[]) => (Array.isArray(tags) ? tags : []),
    });

    return {
        examTypes: examTypesQuery.data ?? EMPTY_LIST,
        examParts: examPartsQuery.data ?? EMPTY_LIST,
        questionCollections: questionCollectionsQuery.data ?? EMPTY_LIST,
        availableTags: availableTagsQuery.data ?? EMPTY_LIST,
    };
};
