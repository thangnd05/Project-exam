import axios from './axiosClient';
import type { NoteRequest, NoteResponse } from '@/app/types';

const BASE_URL = '/api/notes';

export const getMyNotes = (): Promise<NoteResponse[]> => {
  return axios.get(BASE_URL).then((res) => res.data);
};

export const createNote = (payload: NoteRequest): Promise<NoteResponse> => {
  return axios.post(BASE_URL, payload).then((res) => res.data);
};

export const updateNote = (noteId: string, payload: NoteRequest): Promise<NoteResponse> => {
  return axios.put(`${BASE_URL}/${noteId}`, payload).then((res) => res.data);
};

export const deleteNote = (noteId: string): Promise<void> => {
  return axios.delete(`${BASE_URL}/${noteId}`).then(() => {});
};
