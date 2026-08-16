'use client';

import { useQuery } from '@tanstack/react-query';
import { getExamTypes } from '@/app/apis/examTypeApi';
import { getQuestionCollections } from '@/app/apis/questionCollectionApi';
import { getExamPartsByExamType } from '@/app/apis/examPartApi';
import { getTagsFlatByExamType } from '@/app/apis/tagApi';
import { sortByPartOrder } from '../utils/partOrder';
import { EMPTY_LIST } from '../utils/stableEmpty';

const normalizeList = (payload: any): any[] => {
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
    examTypes: ['base-meta', 'exam-types'],
    questionCollections: ['base-meta', 'question-collections'],
    examParts: (examTypeId: string | number | null | undefined) => ['base-meta', 'exam-parts', examTypeId],
    tagsFlat: (examTypeId: string | number | null | undefined) => ['base-meta', 'tags-flat', examTypeId],
};

export const useBaseMetaData = (examTypeId?: string | number | null) => {
    const examTypesQuery = useQuery({
        queryKey: baseMetaKeys.examTypes,
        queryFn: getExamTypes,
        select: normalizeList,
    });

    const questionCollectionsQuery = useQuery({
        queryKey: baseMetaKeys.questionCollections,
        queryFn: getQuestionCollections,
        select: normalizeList,
    });

    const examPartsQuery = useQuery({
        queryKey: baseMetaKeys.examParts(examTypeId),
        queryFn: () => getExamPartsByExamType(String(examTypeId)),
        enabled: !!examTypeId,
        select: (data: any) => sortByPartOrder(normalizeList(data)),
    });

    const availableTagsQuery = useQuery({
        queryKey: baseMetaKeys.tagsFlat(examTypeId),
        queryFn: () => getTagsFlatByExamType(String(examTypeId)),
        enabled: !!examTypeId,
        select: (tags: any) => (Array.isArray(tags) ? tags : []),
    });

    return {
        examTypes: examTypesQuery.data ?? EMPTY_LIST,
        examParts: examPartsQuery.data ?? EMPTY_LIST,
        questionCollections: questionCollectionsQuery.data ?? EMPTY_LIST,
        availableTags: availableTagsQuery.data ?? EMPTY_LIST,
    };
};
