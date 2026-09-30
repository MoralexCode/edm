import { useMemo, useState } from 'react';
import { construirMapaCalor, esPreguntaDeOpciones } from '../../../utils/examenStats';

const colorParaValor = (valor, max) => {
  if (!valor) return 'var(--border-subtle)';
  const ratio = valor / max;
  // Una sola rampa de morado (--accent-primary), más oscura = más respuestas.
  const alpha = 0.15 + ratio * 0.75;
  return `color-mix(in srgb, var(--accent-primary) ${Math.round(alpha * 100)}%, var(--surface-card))`;
};

/**
 * Cruce filas × columnas entre dos preguntas de opciones del examen,
 * elegibles por el usuario (selectores propios, independientes del
 * filtro de la pestaña "Interactivo").
 */
const ExamenHeatmap = ({ preguntas, respuestas }) => {
  const opciones = useMemo(() => preguntas.filter(esPreguntaDeOpciones), [preguntas]);
  const defaultFilas = opciones.find((p) => p.tipo === 'multiple') || opciones[0];
  const defaultColumnas = opciones.find((p) => p.id !== defaultFilas?.id) || opciones[1];

  const [filasId, setFilasId] = useState(defaultFilas?.id || '');
  const [columnasId, setColumnasId] = useState(defaultColumnas?.id || '');

  if (opciones.length < 2) {
    return (
      <p className="text-sm text-[var(--text-secondary)]">
        Este examen no tiene suficientes preguntas de opción (única o múltiple) para cruzar en
        un mapa de calor.
      </p>
    );
  }

  const preguntaFilas = opciones.find((p) => p.id === filasId) || opciones[0];
  const preguntaColumnas =
    opciones.find((p) => p.id === columnasId) || opciones.find((p) => p.id !== preguntaFilas.id);

  const { filas, columnas, matriz } = construirMapaCalor(respuestas, preguntaFilas, preguntaColumnas);
  const max = matriz.reduce((m, fila) => Math.max(m, ...fila), 0) || 1;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="c-label" htmlFor="heatmap-filas">
            Filas
          </label>
          <select
            id="heatmap-filas"
            className="c-input"
            value={preguntaFilas.id}
            onChange={(e) => setFilasId(e.target.value)}
          >
            {opciones.map((p) => (
              <option key={p.id} value={p.id} disabled={p.id === preguntaColumnas?.id}>
                {p.texto}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="c-label" htmlFor="heatmap-columnas">
            Columnas
          </label>
          <select
            id="heatmap-columnas"
            className="c-input"
            value={preguntaColumnas?.id || ''}
            onChange={(e) => setColumnasId(e.target.value)}
          >
            {opciones.map((p) => (
              <option key={p.id} value={p.id} disabled={p.id === preguntaFilas.id}>
                {p.texto}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="border-separate text-xs" style={{ borderSpacing: '2px' }}>
          <thead>
            <tr>
              <th className="w-40" />
              {columnas.map((col) => (
                <th
                  key={col.id}
                  className="max-w-[70px] px-1 pb-2 text-left align-bottom font-semibold text-[var(--text-secondary)]"
                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                  title={col.texto}
                >
                  {col.texto}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map((fila, i) => (
              <tr key={fila.id}>
                <th
                  className="max-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap pr-2 text-right font-medium text-[var(--text-secondary)]"
                  title={fila.texto}
                >
                  {fila.texto}
                </th>
                {columnas.map((col, j) => {
                  const valor = matriz[i][j];
                  return (
                    <td
                      key={col.id}
                      className="h-7 w-7 rounded text-center font-semibold"
                      style={{ background: colorParaValor(valor, max), color: 'var(--text-primary)' }}
                      title={`${fila.texto} — ${col.texto}: ${valor} respuesta${valor === 1 ? '' : 's'}`}
                    >
                      {valor || ''}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
        <span>Menos</span>
        <span
          className="h-2.5 w-32 rounded"
          style={{
            background:
              'linear-gradient(to right, color-mix(in srgb, var(--accent-primary) 15%, var(--surface-card)), var(--accent-primary))',
          }}
        />
        <span>Más</span>
      </div>
    </div>
  );
};

export default ExamenHeatmap;
