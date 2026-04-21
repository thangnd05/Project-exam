import { useState, useEffect } from 'react';
import axios from 'axios';

export const useBaseMetaData = (examTypeId) => {
    const [examTypes, setExamTypes] = useState([]);
    const [examParts, setExamParts] = useState([]);

    useEffect(() => {
        axios
            .get('/api/exam-types')
            .then((res) => setExamTypes(res.data))
            .catch((err) => console.error('Fetch exam types error:', err));
    }, []);

    useEffect(() => {
        if (!examTypeId) {
            setExamParts([]);
            return;
        }
        axios
            .get(`/api/exam-parts/by-exam-type/${examTypeId}`)
            .then((res) => setExamParts(res.data))
            .catch((err) => console.error('Fetch exam parts error:', err));
    }, [examTypeId]);

    return { examTypes, examParts, setExamParts };
};
