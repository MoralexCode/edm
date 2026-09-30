import * as XLSX from 'xlsx';
import { resolveAnswerDetail } from './examenRespuestas';

const formatFechaExport = (value) => {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return String(value);
  }
};

/**
 * Fecha, Nombre, Teléfono, Aciertos, Calificación + una columna por pregunta
 * (encabezado numerado para que no se repitan). Cada celda indica la opción
 * elegida y si fue correcta (✓ / ✗).
 */
export const exportExamenRespuestasExcel = (examen, respuestas) => {
  const preguntas = Array.isArray(examen?.preguntas) ? examen.preguntas : [];

  const rows = respuestas.map((r) => {
    const detalle = resolveAnswerDetail(preguntas, r.respuestas_json, r.resultados);
    const row = {
      Fecha: formatFechaExport(r.creado),
      Nombre: r.nombre || '',
      Teléfono: r.telefono || '',
      Aciertos: `${r.aciertos ?? 0}/${r.total_preguntas ?? preguntas.length}`,
      Calificación: r.calificacion ?? '',
    };
    detalle.forEach((item, i) => {
      const marca = item.acerto == null ? '' : item.acerto ? '✓ ' : '✗ ';
      row[`${i + 1}. ${item.texto}`] = `${marca}${item.valor}`;
    });
    return row;
  });

  const sheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Respuestas');

  const filename = `respuestas-${examen.libro_slug}-sesion-${examen.sesion}.xlsx`;
  XLSX.writeFile(workbook, filename);
};
