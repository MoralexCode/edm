import { Router } from 'express';
import {
  createExamen,
  deleteExamen,
  deleteRespuesta,
  getExamen,
  listExamenes,
  listRespuestas,
  updateExamen,
} from '../controllers/examenController.js';
import { crearRespuestaPublica, getPublicExamen } from '../controllers/publicExamenController.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ ok: true }));

// Públicas (landing del alumno)
router.get('/public/examenes/:libro/:sesion', getPublicExamen);
router.post('/public/examenes/:libro/:sesion/respuesta', crearRespuestaPublica);

// Admin (MVP sin autenticación)
router.get('/examenes', listExamenes);
router.post('/examenes', createExamen);
router.get('/examenes/:id', getExamen);
router.put('/examenes/:id', updateExamen);
router.delete('/examenes/:id', deleteExamen);
router.get('/examenes/:id/respuestas', listRespuestas);
router.delete('/examenes/:id/respuestas/:respuestaId', deleteRespuesta);

export default router;
