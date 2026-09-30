import api from './api';

const unwrap = (res) => res.data;

export const PublicExamen = {
  get: (libro, sesion) => api.get(`/public/examenes/${libro}/${sesion}`).then(unwrap),
  responder: (libro, sesion, data) =>
    api.post(`/public/examenes/${libro}/${sesion}/respuesta`, data).then(unwrap),
};
