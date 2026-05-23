import axios from './axiosClient';

const BASE_URL = '/api/learning-plans';

export const generatePlan = (payload) => {
  return axios.post(`${BASE_URL}/generate`, payload).then((res) => res.data);
};

export const getPlanById = (learningPlanId) => {
  return axios.get(`${BASE_URL}/${learningPlanId}`).then((res) => res.data);
};

export const listPlans = (examTypeId) => {
  return axios.get(BASE_URL, { params: { examTypeId } }).then((res) => res.data);
};

export const getCurrentSession = (learningPlanId, taskId) => {
  const params = taskId ? { taskId } : {};
  return axios
    .get(`${BASE_URL}/${learningPlanId}/current-session`, { params })
    .then((res) => res.data);
};

export const submitSession = (learningPlanId, sessionId, answers) => {
  return axios
    .post(`${BASE_URL}/${learningPlanId}/sessions/${sessionId}/submit`, { answers })
    .then((res) => res.data);
};

export const getTaskSessions = (learningPlanId, taskId) => {
  return axios
    .get(`${BASE_URL}/${learningPlanId}/tasks/${taskId}/sessions`)
    .then((res) => res.data);
};
