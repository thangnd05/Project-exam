import { useQuery } from '@tanstack/react-query';
import { getExamTypes } from '~/shared/api/examTypeApi';
import { getQuestionCollections } from '~/shared/api/questionCollectionApi';
import { getExamPartsByExamType } from '~/shared/api/examPartApi';
import { getTagsFlatByExamType } from '~/shared/api/tagApi';
import { sortByPartOrder } from '../utils/partOrder';

const normalizeList = (payload) => {
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
    examParts: (examTypeId) => ['base-meta', 'exam-parts', examTypeId],
    tagsFlat: (examTypeId) => ['base-meta', 'tags-flat', examTypeId],
};

export const useBaseMetaData = (examTypeId) => {
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
        queryFn: () => getExamPartsByExamType(examTypeId),
        enabled: !!examTypeId,
        select: (data) => sortByPartOrder(normalizeList(data)),
    });

    const availableTagsQuery = useQuery({
        queryKey: baseMetaKeys.tagsFlat(examTypeId),
        queryFn: () => getTagsFlatByExamType(examTypeId),
        enabled: !!examTypeId,
        select: (tags) => (Array.isArray(tags) ? tags : []),
    });

    return {
        examTypes: examTypesQuery.data ?? [],
        examParts: examPartsQuery.data ?? [],
        questionCollections: questionCollectionsQuery.data ?? [],
        availableTags: availableTagsQuery.data ?? [],
    };
};
