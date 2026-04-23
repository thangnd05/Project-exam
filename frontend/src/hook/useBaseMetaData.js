import { useState, useEffect } from 'react';
import axios from 'axios';

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

    useEffect(() => {
        axios
            .get('/api/exam-types')
            .then((res) => setExamTypes(normalizeList(res.data)))
            .catch((err) => {
                console.error('Fetch exam types error:', err);
                setExamTypes([]);
            });
    }, []);

    useEffect(() => {
        if (!examTypeId) {
            setExamParts([]);
            return;
        }
        axios
            .get(`/api/exam-parts/by-exam-type/${examTypeId}`)
            .then((res) => setExamParts(normalizeList(res.data)))
            .catch((err) => {
                console.error('Fetch exam parts error:', err);
                setExamParts([]);
            });
    }, [examTypeId]);

    return { examTypes, examParts, setExamParts };
};
