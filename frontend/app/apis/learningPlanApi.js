import axios from './axiosClient';

const BASE_URL = '/api/learning-plans';

export const generatePlan = (payload) => {
  return axios.post(`${BASE_URL}/generate`, payload).then((res) => res.data);
};

/** Sinh lại lộ trình theo mục tiêu hiện tại từ chính bài chẩn đoán cũ (không cần thi lại). */
export const resyncPlan = (learningPlanId) => {
  return axios.post(`${BASE_URL}/${learningPlanId}/resync`).then((res) => res.data);
};

export const getPlanById = (learningPlanId) => {
  return axios.get(`${BASE_URL}/${learningPlanId}`).then((res) => res.data);
};

export const listPlans = (examTypeId) => {
  return axios
    .get(BASE_URL, { params: examTypeId ? { examTypeId } : undefined })
    .then((res) => res.data);
};

export const getCurrentSession = (learningPlanId, taskId, includeReview = false) => {
  const params = {};
  if (taskId) params.taskId = taskId;
  if (includeReview) params.includeReview = true;
  return axios
    .get(`${BASE_URL}/${learningPlanId}/current-session`, { params })
    .then((res) => res.data);
};

export const startTaskSession = (learningPlanId, taskId) => {
  return axios
    .post(`${BASE_URL}/${learningPlanId}/sessions/start`, null, {
      params: taskId ? { taskId } : undefined,
    })
    .then((res) => res.data);
};

export const submitSession = (learningPlanId, sessionId, answers) => {
  return axios
    .post(`${BASE_URL}/${learningPlanId}/sessions/${sessionId}/submit`, { answers })
    .then((res) => res.data);
};

export const getSessionReview = (learningPlanId, sessionId) => {
  return axios
    .get(`${BASE_URL}/${learningPlanId}/sessions/${sessionId}/review`)
    .then((res) => res.data);
};

export const getTaskSessions = (learningPlanId, taskId) => {
  return axios
    .get(`${BASE_URL}/${learningPlanId}/tasks/${taskId}/sessions`)
    .then((res) => res.data);
};

export const switchPlan = (learningPlanId) => {
  return axios.put(`${BASE_URL}/${learningPlanId}/activate`).then((res) => res.data);
};

export const deletePlan = (learningPlanId) => {
  return axios.delete(`${BASE_URL}/${learningPlanId}`);
};
