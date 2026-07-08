import axios from './axiosClient';

const BASE_URL = '/api/exam-types';

export const getExamTypes = () => {
  return axios.get(BASE_URL).then((response) => response.data);
};

// Loại kỳ thi chuẩn (flexible=false) — ẩn loại linh hoạt như "Thông Thường".
export const getStandardExamTypes = () => {
  return axios.get(`${BASE_URL}/standard`).then((response) => response.data);
};

// Loại kỳ thi linh hoạt (flexible=true).
export const getFlexibleExamTypes = () => {
  return axios.get(`${BASE_URL}/flexible`).then((response) => response.data);
};

export const getExamTypeById = (examTypeId) => {
  return axios.get(`${BASE_URL}/${examTypeId}`).then((response) => response.data);
};

// Các loại kỳ thi con của 1 loại cha (drill-in vd "AWS" → các cert).
export const getExamTypeChildren = (examTypeId) => {
  return axios.get(`${BASE_URL}/${examTypeId}/children`).then((response) => response.data);
};

export const createExamType = (payload) => {
  return axios.post(BASE_URL, payload).then((response) => response.data);
};

export const updateExamType = (examTypeId, payload) => {
  return axios
    .put(`${BASE_URL}/${examTypeId}`, payload)
    .then((response) => response.data);
};

export const deleteExamType = (examTypeId) => {
  return axios.delete(`${BASE_URL}/${examTypeId}`).then(() => {});
};

// --- Bố cục giao diện làm bài theo examType (zone-based layout) ---

// Layout đã resolve (lá -> cha). Trả null (204) khi chưa cấu hình -> FE dùng mặc định.
// Dùng cho trang làm bài. Trả về { examTypeId, config, updatedAt } với config là JSON string.
export const getExamTypeLayout = (examTypeId) => {
  return axios
    .get(`${BASE_URL}/${examTypeId}/layout`)
    .then((res) => (res.status === 204 ? null : res.data))
    .catch((err) => {
      if (err?.response?.status === 404) return null;
      throw err;
    });
};

// Layout gắn TRỰC TIẾP vào examType (không fallback) — cho editor admin.
export const getOwnExamTypeLayout = (examTypeId) => {
  return axios
    .get(`${BASE_URL}/${examTypeId}/layout/own`)
    .then((res) => (res.status === 204 ? null : res.data));
};

// Lưu (upsert) cấu hình layout. config là JSON string; null/'' = xoá về mặc định.
export const updateExamTypeLayout = (examTypeId, config) => {
  return axios
    .put(`${BASE_URL}/${examTypeId}/layout`, { config })
    .then((res) => res.data);
};
