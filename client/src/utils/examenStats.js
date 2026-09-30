/**
 * Agregaciones genéricas sobre respuestas_json, por pregunta.id. Alimentan
 * las pestañas de Gráficas, Interactivo, Mapa de calor y Calificaciones en
 * ExamenDetallePage.
 */
import { idsSeleccionados as idsDePregunta } from './examenRespuestas';

export const esPreguntaDeOpciones = (pregunta) =>
  pregunta?.tipo === 'unica' || pregunta?.tipo === 'multiple';

const idsSeleccionados = (respuesta, pregunta) =>
  idsDePregunta(pregunta, respuesta?.respuestas_json?.[pregunta.id]);

/**
 * Conteo de opciones marcadas para una pregunta, en el orden original
 * (A, B, C…) para que se lea igual que el examen. `correcta` marca la clave.
 * @returns {{ id: string, texto: string, count: number, correcta: boolean }[]}
 */
export const contarOpciones = (respuestas, pregunta, { ordenar = false } = {}) => {
  if (!esPreguntaDeOpciones(pregunta)) return [];
  const counts = new Map((pregunta.opciones || []).map((o) => [o.id, 0]));
  respuestas.forEach((r) => {
    idsSeleccionados(r, pregunta).forEach((id) => {
      if (counts.has(id)) counts.set(id, counts.get(id) + 1);
    });
  });
  const correctas = new Set(pregunta.correctas || []);
  const list = (pregunta.opciones || []).map((o, i) => ({
    id: o.id,
    texto: `${String.fromCharCode(65 + i)}) ${o.texto}`,
    count: counts.get(o.id) || 0,
    correcta: correctas.has(o.id),
  }));
  return ordenar ? list.sort((a, b) => b.count - a.count) : list;
};

/** Subconjunto de respuestas donde `pregunta` incluye `opcionId` entre lo seleccionado. */
export const filtrarPorOpcion = (respuestas, pregunta, opcionId) => {
  if (!pregunta || !opcionId) return respuestas;
  return respuestas.filter((r) => idsSeleccionados(r, pregunta).includes(opcionId));
};

/**
 * Cruce filas × columnas entre dos preguntas de opciones. Cada celda es el
 * número de respuestas que marcaron esa opción de fila Y esa de columna.
 */
export const construirMapaCalor = (respuestas, preguntaFilas, preguntaColumnas) => {
  const filas = preguntaFilas?.opciones || [];
  const columnas = preguntaColumnas?.opciones || [];
  const matriz = filas.map((fila) => {
    const respuestasConFila = respuestas.filter((r) =>
      idsSeleccionados(r, preguntaFilas).includes(fila.id)
    );
    return columnas.map(
      (col) => respuestasConFila.filter((r) => idsSeleccionados(r, preguntaColumnas).includes(col.id)).length
    );
  });
  return { filas, columnas, matriz };
};

/** % de aciertos por pregunta, de la más fallada a la más acertada. */
export const aciertosPorPregunta = (respuestas, preguntas) =>
  (preguntas || [])
    .map((p, i) => {
      const conDato = respuestas.filter((r) => r.resultados && p.id in r.resultados);
      const aciertos = conDato.filter((r) => r.resultados[p.id]).length;
      return {
        id: p.id,
        numero: i + 1,
        texto: p.texto,
        aciertos,
        total: conDato.length,
        pct: conDato.length ? Math.round((aciertos / conDato.length) * 100) : 0,
      };
    })
    .sort((a, b) => a.pct - b.pct);

/** Distribución de calificaciones redondeadas (0–10). */
export const distribucionCalificaciones = (respuestas) => {
  const buckets = Array.from({ length: 11 }, (_, i) => ({ id: String(i), texto: String(i), count: 0 }));
  respuestas.forEach((r) => {
    const c = Math.round(Number(r.calificacion) || 0);
    if (buckets[c]) buckets[c].count += 1;
  });
  return buckets.reverse();
};

export const promedio = (respuestas) =>
  respuestas.length
    ? Math.round((respuestas.reduce((s, r) => s + (Number(r.calificacion) || 0), 0) / respuestas.length) * 10) / 10
    : 0;
