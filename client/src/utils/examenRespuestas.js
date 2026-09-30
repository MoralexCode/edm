const letra = (i) => String.fromCharCode(65 + i);

const textoOpciones = (pregunta, ids) =>
  ids
    .map((id) => {
      const idx = (pregunta.opciones || []).findIndex((o) => o.id === id);
      return idx >= 0 ? `${letra(idx)}) ${pregunta.opciones[idx].texto}` : '';
    })
    .filter(Boolean)
    .join(', ');

export const idsSeleccionados = (pregunta, raw) => {
  if (!raw) return [];
  if (pregunta.tipo === 'unica') return raw.opcion_id ? [raw.opcion_id] : [];
  return Array.isArray(raw.opcion_ids) ? raw.opcion_ids : [];
};

/**
 * Resuelve los ids guardados en respuestas_json contra las preguntas/opciones
 * actuales del examen, para mostrar texto legible en vez de UUIDs.
 * Usado tanto por el modal "Ver todo" como por la exportación a Excel.
 * @returns {{ id: string, texto: string, valor: string, correcta: string, acerto: boolean|null }[]}
 */
export const resolveAnswerDetail = (preguntas, respuestasJson, resultados) => {
  const list = Array.isArray(preguntas) ? preguntas : [];
  const answers = respuestasJson && typeof respuestasJson === 'object' ? respuestasJson : {};
  const res = resultados && typeof resultados === 'object' ? resultados : {};

  return list.map((pregunta) => ({
    id: pregunta.id,
    texto: pregunta.texto,
    valor: textoOpciones(pregunta, idsSeleccionados(pregunta, answers[pregunta.id])),
    correcta: textoOpciones(pregunta, pregunta.correctas || []),
    acerto: pregunta.id in res ? Boolean(res[pregunta.id]) : null,
  }));
};

export const formatCalificacion = (row) =>
  row?.calificacion == null ? '—' : Number(row.calificacion).toFixed(1).replace(/\.0$/, '');
