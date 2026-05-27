import { useState, useEffect } from 'react';
import { getExamTypes } from '../api/examTypeApi';
import { getQuestionCollections } from '../api/questionCollectionApi';
import { getExamPartsByExamType } from '../api/examPartApi';
import { getTagsFlatByExamType } from '../api/tagApi';
import { sortByPartOrder } from '../utils/partOrder';

export const useBaseMetaData = (examTypeId) => {
    const [examTypes, setExamTypes] = useState([]);
    const [examParts, setExamParts] = useState([]);

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

    const [questionCollections, setQuestionCollections] = useState([]);
    const [availableTags, setAvailableTags] = useState([]);

    useEffect(() => {
        getExamTypes()
            .then((data) => setExamTypes(normalizeList(data)))
            .catch((err) => {
                console.error('Fetch exam types error:', err);
                setExamTypes([]);
            });

        getQuestionCollections()
            .then((data) => setQuestionCollections(normalizeList(data)))
            .catch((err) => {
                console.error('Fetch question collections error:', err);
                setQuestionCollections([]);
            });
    }, []);

    useEffect(() => {
        if (!examTypeId) {
            setExamParts([]);
            setAvailableTags([]);
            return;
        }
        getExamPartsByExamType(examTypeId)
            .then((data) => setExamParts(sortByPartOrder(normalizeList(data))))
            .catch((err) => {
                console.error('Fetch exam parts error:', err);
                setExamParts([]);
            });
        getTagsFlatByExamType(examTypeId)
            .then((tags) => setAvailableTags(Array.isArray(tags) ? tags : []))
            .catch(() => setAvailableTags([]));
    }, [examTypeId]);

    return { examTypes, examParts, setExamParts, questionCollections, availableTags };
};
