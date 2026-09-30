import Examen from '../models/Examen.js';
import RespuestaExamen from '../models/RespuestaExamen.js';
import {
  calificarRespuestas,
  sinClave,
  validateRespuestasPayload,
} from '../services/examenValidation.service.js';

const findPublico = (libro, sesion) =>
  Examen.findOne({ libro_slug: String(libro || '').toLowerCase(), sesion: Number(sesion) });

export const getPublicExamen = async (req, res) => {
  const examen = await findPublico(req.params.libro, req.params.sesion);
  if (!examen) return res.status(404).json({ message: 'Examen no encontrado' });

  const json = examen.toJSON();
  res.json({
    id_examen: json.id_examen,
    libro_slug: json.libro_slug,
    libro_titulo: json.libro_titulo,
    sesion: json.sesion,
    titulo: json.titulo,
    subtitulo: json.subtitulo,
    descripcion: json.descripcion,
    preguntas: sinClave(json.preguntas),
    activo: json.activo,
    pedir_nombre: json.pedir_nombre,
    nombre_requerido: json.nombre_requerido,
    pedir_telefono: json.pedir_telefono,
    telefono_requerido: json.telefono_requerido,
  });
};

export const crearRespuestaPublica = async (req, res) => {
  const examen = await findPublico(req.params.libro, req.params.sesion);
  if (!examen) return res.status(404).json({ message: 'Examen no encontrado' });

  if (!examen.activo) {
    return res.status(409).json({ message: 'Este examen ya no está disponible' });
  }

  const preguntas = examen.toObject().preguntas;
  const { respuestas, error } = validateRespuestasPayload(preguntas, req.body?.respuestas);
  if (error) return res.status(400).json({ message: error });

  const nombre = req.body?.nombre == null ? null : String(req.body.nombre).trim() || null;
  const telefono = req.body?.telefono == null ? null : String(req.body.telefono).trim() || null;

  if (examen.pedir_nombre && examen.nombre_requerido && !nombre) {
    return res.status(400).json({ message: 'El nombre es obligatorio' });
  }
  if (examen.pedir_telefono && examen.telefono_requerido && !telefono) {
    return res.status(400).json({ message: 'El teléfono es obligatorio' });
  }

  const resultado = calificarRespuestas(preguntas, respuestas);

  const creada = await RespuestaExamen.create({
    examen: examen._id,
    nombre,
    telefono,
    respuestas_json: respuestas,
    ...resultado,
  });

  const body = { id_respuesta: String(creada._id), message: 'Respuesta registrada' };
  if (examen.mostrar_calificacion) {
    body.resultado = {
      aciertos: resultado.aciertos,
      total_preguntas: resultado.total_preguntas,
      calificacion: resultado.calificacion,
      resultados: resultado.resultados,
    };
  }
  res.status(201).json(body);
};
