import crypto from 'crypto';

const TIPOS = new Set(['unica', 'multiple']);

const asText = (value) => (value == null ? '' : String(value).trim());

const ensureId = (value) => {
  const id = asText(value);
  return id && !id.startsWith('tmp-') ? id : crypto.randomUUID();
};

/**
 * Normaliza y valida el array de preguntas antes de persistir.
 * Las opciones correctas llegan como `correcta: true` en cada opción
 * (así es más fácil en el builder) y se guardan en `pregunta.correctas`.
 * @returns {{ preguntas: object[], error?: string }}
 */
export const normalizePreguntas = (raw) => {
  if (raw === undefined || raw === null) {
    return { preguntas: [] };
  }
  if (!Array.isArray(raw)) {
    return { preguntas: [], error: 'preguntas debe ser un arreglo' };
  }

  const preguntas = [];

  for (let i = 0; i < raw.length; i++) {
    const item = raw[i] || {};
    const texto = asText(item.texto);
    const tipo = asText(item.tipo) || 'unica';
    if (!texto) {
      return { preguntas: [], error: `La pregunta ${i + 1} requiere texto` };
    }
    if (!TIPOS.has(tipo)) {
      return {
        preguntas: [],
        error: `La pregunta ${i + 1} tiene tipo inválido (unica | multiple)`,
      };
    }

    const puntos = item.puntos == null || item.puntos === '' ? 1 : Number(item.puntos);
    if (!Number.isFinite(puntos) || puntos <= 0) {
      return { preguntas: [], error: `Puntos inválidos en la pregunta ${i + 1}` };
    }

    const opcionesRaw = Array.isArray(item.opciones) ? item.opciones : [];
    if (opcionesRaw.length < 2) {
      return {
        preguntas: [],
        error: `La pregunta ${i + 1} necesita al menos 2 opciones`,
      };
    }

    const opciones = [];
    const correctas = [];
    const correctasPrevias = new Set(Array.isArray(item.correctas) ? item.correctas : []);
    for (let j = 0; j < opcionesRaw.length; j++) {
      const opt = opcionesRaw[j] || {};
      const optTexto = asText(opt.texto);
      if (!optTexto) {
        return {
          preguntas: [],
          error: `La opción ${j + 1} de la pregunta ${i + 1} requiere texto`,
        };
      }
      const id = ensureId(opt.id);
      opciones.push({ id, texto: optTexto });
      if (opt.correcta === true || correctasPrevias.has(opt.id)) correctas.push(id);
    }

    if (correctas.length === 0) {
      return {
        preguntas: [],
        error: `Marca la respuesta correcta de la pregunta ${i + 1}`,
      };
    }
    if (tipo === 'unica' && correctas.length > 1) {
      return {
        preguntas: [],
        error: `La pregunta ${i + 1} es de selección única y tiene más de una correcta`,
      };
    }

    const pregunta = {
      id: ensureId(item.id),
      texto,
      tipo,
      requerida: item.requerida === undefined ? true : Boolean(item.requerida),
      puntos,
      opciones,
      correctas,
    };

    if (tipo === 'multiple' && item.max_selecciones != null && item.max_selecciones !== '') {
      const max = Number(item.max_selecciones);
      if (!Number.isInteger(max) || max < 1 || max > opciones.length) {
        return {
          preguntas: [],
          error: `max_selecciones inválido en la pregunta ${i + 1}`,
        };
      }
      pregunta.max_selecciones = max;
    }

    preguntas.push(pregunta);
  }

  return { preguntas };
};

const emptyRespuesta = (tipo) => (tipo === 'multiple' ? { opcion_ids: [] } : { opcion_id: null });

/**
 * Valida el payload de respuesta pública contra las preguntas del examen.
 * @returns {{ respuestas: object, error?: string }}
 */
export const validateRespuestasPayload = (preguntas, respuestasRaw) => {
  const source =
    respuestasRaw && typeof respuestasRaw === 'object' && !Array.isArray(respuestasRaw)
      ? respuestasRaw
      : null;
  if (!source) {
    return { respuestas: {}, error: 'respuestas debe ser un objeto' };
  }

  const list = Array.isArray(preguntas) ? preguntas : [];
  const out = {};

  for (const pregunta of list) {
    const raw = source[pregunta.id];
    const value =
      raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : emptyRespuesta(pregunta.tipo);
    const optionIds = new Set((pregunta.opciones || []).map((o) => o.id));

    if (pregunta.tipo === 'unica') {
      const opcionId = asText(value.opcion_id) || null;
      if (!opcionId) {
        if (pregunta.requerida) {
          return { respuestas: {}, error: `Responde: ${pregunta.texto}` };
        }
        out[pregunta.id] = { opcion_id: null };
        continue;
      }
      if (!optionIds.has(opcionId)) {
        return { respuestas: {}, error: `Opción inválida en: ${pregunta.texto}` };
      }
      out[pregunta.id] = { opcion_id: opcionId };
      continue;
    }

    const ids = Array.isArray(value.opcion_ids)
      ? [...new Set(value.opcion_ids.map((id) => asText(id)).filter(Boolean))]
      : [];
    if (ids.length === 0 && pregunta.requerida) {
      return { respuestas: {}, error: `Selecciona al menos una opción en: ${pregunta.texto}` };
    }
    if (pregunta.max_selecciones != null && ids.length > Number(pregunta.max_selecciones)) {
      return {
        respuestas: {},
        error: `Máximo ${pregunta.max_selecciones} selecciones en: ${pregunta.texto}`,
      };
    }
    if (ids.some((id) => !optionIds.has(id))) {
      return { respuestas: {}, error: `Opción inválida en: ${pregunta.texto}` };
    }
    out[pregunta.id] = { opcion_ids: ids };
  }

  return { respuestas: out };
};

const seleccionados = (pregunta, respuesta) => {
  if (!respuesta) return [];
  if (pregunta.tipo === 'unica') return respuesta.opcion_id ? [respuesta.opcion_id] : [];
  return Array.isArray(respuesta.opcion_ids) ? respuesta.opcion_ids : [];
};

/**
 * Califica en el servidor. Una pregunta cuenta como acertada sólo si lo
 * seleccionado coincide exactamente con las opciones correctas.
 * Calificación en escala 0–10 con un decimal.
 */
export const calificarRespuestas = (preguntas, respuestas) => {
  const resultados = {};
  let aciertos = 0;
  let puntaje = 0;
  let puntajeMax = 0;

  for (const pregunta of preguntas || []) {
    const puntos = Number(pregunta.puntos) || 1;
    puntajeMax += puntos;
    const correctas = new Set(pregunta.correctas || []);
    const sel = seleccionados(pregunta, respuestas[pregunta.id]);
    const ok = sel.length === correctas.size && sel.every((id) => correctas.has(id));
    resultados[pregunta.id] = ok;
    if (ok) {
      aciertos += 1;
      puntaje += puntos;
    }
  }

  const calificacion = puntajeMax ? Math.round((puntaje / puntajeMax) * 100) / 10 : 0;

  return {
    resultados,
    aciertos,
    total_preguntas: (preguntas || []).length,
    puntaje,
    puntaje_max: puntajeMax,
    calificacion,
  };
};

/** Quita la clave de respuestas de cada pregunta (para la API pública). */
export const sinClave = (preguntas) =>
  (preguntas || []).map(({ correctas, ...rest }) => rest);
