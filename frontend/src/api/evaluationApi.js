import axios from 'axios';

const BASE_URL = '/api/evaluations';

export const getEvaluations = () => {
  return axios.get(BASE_URL).then((response) => response.data);
};

export const createEvaluation = (payload) => {
  return axios.post(BASE_URL, payload).then((response) => response.data);
};

export const updateEvaluation = (evaluationId, payload) => {
  return axios
    .put(`${BASE_URL}/${evaluationId}`, payload)
    .then((response) => response.data);
};

export const deleteEvaluation = (evaluationId) => {
  return axios.delete(`${BASE_URL}/${evaluationId}`).then(() => {});
};
