import axios from 'axios';

const BASE_URL = '/api/evaluations';

export const getEvaluations = ({page = 0, size = 10, keyword, rating} = {}) => {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));
  if (keyword && keyword.trim()) {
    params.set('keyword', keyword.trim());
  }
  if (rating && rating !== 'all') {
    params.set('rating', String(rating));
  }

  return axios
    .get(`${BASE_URL}/paged?${params.toString()}`)
    .then((response) => response.data);
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
