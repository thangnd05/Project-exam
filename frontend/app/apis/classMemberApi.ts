import axios from './axiosClient';
import type {
  ClassMemberActionRequest,
  ClassMemberJoinRequest,
  ClassMemberResponse,
  MessageResponse,
  MyClassesResponse,
} from '@/app/types';

const BASE_URL = '/api/class-members';

export const getMyClasses = (): Promise<MyClassesResponse> => {
  return axios.get(`${BASE_URL}/my-classes`).then((res) => res.data);
};

export const getMembersByClass = (classId: string): Promise<ClassMemberResponse[]> => {
  return axios.get(`${BASE_URL}/class/${classId}`).then((res) => res.data);
};

export const getPendingByClass = (classId: string): Promise<ClassMemberResponse[]> => {
  return axios.get(`${BASE_URL}/class/${classId}/pending`).then((res) => res.data);
};

export const joinClass = (payload: ClassMemberJoinRequest): Promise<ClassMemberResponse> => {
  return axios.post(`${BASE_URL}/join`, payload).then((res) => res.data);
};

export const approveMember = (payload: ClassMemberActionRequest): Promise<MessageResponse> => {
  return axios.put(`${BASE_URL}/approve`, payload).then((res) => res.data);
};

export const approveAllMembers = (classId: string): Promise<MessageResponse> => {
  return axios.put(`${BASE_URL}/approve-all/${classId}`).then((res) => res.data);
};

export const removeMember = (payload: ClassMemberActionRequest): Promise<void> => {
  return axios.delete(`${BASE_URL}/remove`, { data: payload }).then(() => {});
};
