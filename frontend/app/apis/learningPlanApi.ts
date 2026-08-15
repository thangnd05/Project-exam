import type { AxiosResponse } from 'axios';
import axios from './axiosClient';
import type {
  CurrentSessionResponse,
  GeneratePlanRequest,
  PlanResponse,
  SubmitSessionAnswerItem,
  SubmitSessionResponse,
  TaskSessionHistoryResponse,
} from '@/app/types';

const BASE_URL = '/api/learning-plans';

export const generatePlan = (payload: GeneratePlanRequest): Promise<PlanResponse> => {
  return axios.post(`${BASE_URL}/generate`, payload).then((res) => res.data);
};

/** Sinh lại lộ trình theo mục tiêu hiện tại từ chính bài chẩn đoán cũ (không cần thi lại). */
export const resyncPlan = (learningPlanId: string): Promise<PlanResponse> => {
  return axios.post(`${BASE_URL}/${learningPlanId}/resync`).then((res) => res.data);
};

export const getPlanById = (learningPlanId: string): Promise<PlanResponse> => {
  return axios.get(`${BASE_URL}/${learningPlanId}`).then((res) => res.data);
};

export const listPlans = (examTypeId?: string): Promise<PlanResponse[]> => {
  return axios
    .get(BASE_URL, { params: examTypeId ? { examTypeId } : undefined })
    .then((res) => res.data);
};

export const getCurrentSession = (learningPlanId: string, taskId?: string, includeReview: boolean = false): Promise<CurrentSessionResponse> => {
  const params: { taskId?: string; includeReview?: boolean } = {};
  if (taskId) params.taskId = taskId;
  if (includeReview) params.includeReview = true;
  return axios
    .get(`${BASE_URL}/${learningPlanId}/current-session`, { params })
    .then((res) => res.data);
};

export const startTaskSession = (learningPlanId: string, taskId?: string): Promise<CurrentSessionResponse> => {
  return axios
    .post(`${BASE_URL}/${learningPlanId}/sessions/start`, null, {
      params: taskId ? { taskId } : undefined,
    })
    .then((res) => res.data);
};

export const submitSession = (learningPlanId: string, sessionId: string, answers: SubmitSessionAnswerItem[]): Promise<SubmitSessionResponse> => {
  return axios
    .post(`${BASE_URL}/${learningPlanId}/sessions/${sessionId}/submit`, { answers })
    .then((res) => res.data);
};

export const getSessionReview = (learningPlanId: string, sessionId: string): Promise<CurrentSessionResponse> => {
  return axios
    .get(`${BASE_URL}/${learningPlanId}/sessions/${sessionId}/review`)
    .then((res) => res.data);
};

export const getTaskSessions = (learningPlanId: string, taskId: string): Promise<TaskSessionHistoryResponse[]> => {
  return axios
    .get(`${BASE_URL}/${learningPlanId}/tasks/${taskId}/sessions`)
    .then((res) => res.data);
};

export const switchPlan = (learningPlanId: string): Promise<PlanResponse> => {
  return axios.put(`${BASE_URL}/${learningPlanId}/activate`).then((res) => res.data);
};

export const deletePlan = (learningPlanId: string): Promise<AxiosResponse<void>> => {
  return axios.delete(`${BASE_URL}/${learningPlanId}`);
};
