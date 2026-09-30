import api from './api';

const unwrap = (res) => res.data;

export const Examenes = {
  list: (params) => api.get('/examenes', { params }).then(unwrap),
  get: (id) => api.get(`/examenes/${id}`).then(unwrap),
  create: (data) => api.post('/examenes', data).then(unwrap),
  update: (id, data) => api.put(`/examenes/${id}`, data).then(unwrap),
  remove: (id) => api.delete(`/examenes/${id}`).then(unwrap),
  listRespuestas: (id, params) => api.get(`/examenes/${id}/respuestas`, { params }).then(unwrap),
  removeRespuesta: (id, respuestaId) =>
    api.delete(`/examenes/${id}/respuestas/${respuestaId}`).then(unwrap),
};
