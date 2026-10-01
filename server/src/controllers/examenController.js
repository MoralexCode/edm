import mongoose from 'mongoose';
import Examen from '../models/Examen.js';
import RespuestaExamen from '../models/RespuestaExamen.js';
import { normalizePreguntas } from '../services/examenValidation.service.js';

const EXAMEN_FIELDS = [
  'libro_slug',
  'libro_titulo',
  'sesion',
  'titulo',
  'subtitulo',
  'descripcion',
  'imagen_url',
  'preguntas',
  'activo',
  'mostrar_calificacion',
  'pedir_nombre',
  'nombre_requerido',
  'pedir_telefono',
  'telefono_requerido',
];

const normalizeOptionalText = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = String(value).trim();
  return trimmed || null;
};

export const slugify = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const pickExamenUpdates = (body) => {
  const updates = {};
  for (const key of EXAMEN_FIELDS) {
    if (body[key] !== undefined) updates[key] = body[key];
  }
  return updates;
};

const buildPayloadFromBody = (body, { isCreate = false } = {}) => {
  const updates = pickExamenUpdates(body || {});

  if (updates.titulo !== undefined) updates.titulo = String(updates.titulo || '').trim();
  if (isCreate && !updates.titulo) return { error: 'El título es obligatorio' };

  if (updates.libro_slug !== undefined) updates.libro_slug = slugify(updates.libro_slug);
  if (isCreate && !updates.libro_slug) return { error: 'El libro (slug) es obligatorio' };

  if (updates.sesion !== undefined) {
    const sesion = Number(updates.sesion);
    if (!Number.isInteger(sesion) || sesion < 1) return { error: 'La sesión debe ser un número mayor a 0' };
    updates.sesion = sesion;
  }
  if (isCreate && updates.sesion === undefined) return { error: 'La sesión es obligatoria' };

  for (const key of ['libro_titulo', 'subtitulo', 'descripcion', 'imagen_url']) {
    if (updates[key] !== undefined) updates[key] = normalizeOptionalText(updates[key]);
  }
  if (updates.imagen_url && !/^https?:\/\//i.test(updates.imagen_url)) {
    return { error: 'imagen_url no es una URL válida' };
  }

  if (updates.preguntas !== undefined) {
    const { preguntas, error } = normalizePreguntas(updates.preguntas);
    if (error) return { error };
    updates.preguntas = preguntas;
  }

  for (const key of [
    'activo',
    'mostrar_calificacion',
    'pedir_nombre',
    'nombre_requerido',
    'pedir_telefono',
    'telefono_requerido',
  ]) {
    if (updates[key] !== undefined) updates[key] = Boolean(updates[key]);
  }
  if (updates.pedir_nombre === false) updates.nombre_requerido = false;
  if (updates.pedir_telefono === false) updates.telefono_requerido = false;

  return { updates };
};

const findExamen = async (id) => (mongoose.isValidObjectId(id) ? Examen.findById(id) : null);

const duplicateMessage = (err) =>
  err?.code === 11000 ? 'Ya existe un examen para ese libro y sesión' : null;

export const listExamenes = async (req, res) => {
  const where = {};
  if (req.query.activo === 'true') where.activo = true;
  if (req.query.activo === 'false') where.activo = false;

  const items = await Examen.find(where).sort({ libro_slug: 1, sesion: 1 });
  const counts = await RespuestaExamen.aggregate([{ $group: { _id: '$examen', n: { $sum: 1 } } }]);
  const byId = new Map(counts.map((c) => [String(c._id), c.n]));

  res.json({
    items: items.map((e) => ({ ...e.toJSON(), total_respuestas: byId.get(String(e._id)) || 0 })),
    pagination: { page: 1, limit: items.length, total: items.length, hasMore: false },
  });
};

export const getExamen = async (req, res) => {
  const examen = await findExamen(req.params.id);
  if (!examen) return res.status(404).json({ message: 'Examen no encontrado' });
  res.json(examen);
};

export const createExamen = async (req, res) => {
  const { updates, error } = buildPayloadFromBody(req.body, { isCreate: true });
  if (error) return res.status(400).json({ message: error });

  try {
    const creado = await Examen.create(updates);
    res.status(201).json(creado);
  } catch (err) {
    const msg = duplicateMessage(err);
    if (msg) return res.status(409).json({ message: msg });
    throw err;
  }
};

export const updateExamen = async (req, res) => {
  const examen = await findExamen(req.params.id);
  if (!examen) return res.status(404).json({ message: 'Examen no encontrado' });

  const { updates, error } = buildPayloadFromBody(req.body);
  if (error) return res.status(400).json({ message: error });
  if (updates.titulo !== undefined && !updates.titulo) {
    return res.status(400).json({ message: 'El título es obligatorio' });
  }

  examen.set(updates);
  try {
    await examen.save();
  } catch (err) {
    const msg = duplicateMessage(err);
    if (msg) return res.status(409).json({ message: msg });
    throw err;
  }
  res.json(examen);
};

export const deleteExamen = async (req, res) => {
  const examen = await findExamen(req.params.id);
  if (!examen) return res.status(404).json({ message: 'Examen no encontrado' });

  await RespuestaExamen.deleteMany({ examen: examen._id });
  await examen.deleteOne();
  res.status(204).send();
};

export const listRespuestas = async (req, res) => {
  const examen = await findExamen(req.params.id);
  if (!examen) return res.status(404).json({ message: 'Examen no encontrado' });

  const items = await RespuestaExamen.find({ examen: examen._id }).sort({ creado: -1 });
  res.json({
    items,
    pagination: { page: 1, limit: items.length, total: items.length, hasMore: false },
  });
};

export const deleteRespuesta = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.respuestaId)) {
    return res.status(404).json({ message: 'Respuesta no encontrada' });
  }
  const deleted = await RespuestaExamen.findOneAndDelete({
    _id: req.params.respuestaId,
    examen: req.params.id,
  });
  if (!deleted) return res.status(404).json({ message: 'Respuesta no encontrada' });
  res.status(204).send();
};
