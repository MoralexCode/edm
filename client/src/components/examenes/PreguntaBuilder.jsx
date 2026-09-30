import { useState } from 'react';
import { ChevronDown, ChevronUp, ClipboardPaste, Plus, Trash2 } from 'lucide-react';
import Modal from '../ui/Modal';
import RawImportPanel from './RawImportPanel';

const TIPOS = [
  { value: 'unica', label: 'Selección única' },
  { value: 'multiple', label: 'Selección múltiple' },
];

const emptyOpcion = () => ({
  id: `tmp-${crypto.randomUUID()}`,
  texto: '',
  correcta: false,
});

export const emptyPregunta = () => ({
  id: `tmp-${crypto.randomUUID()}`,
  texto: '',
  tipo: 'unica',
  requerida: true,
  puntos: 1,
  max_selecciones: '',
  opciones: [emptyOpcion(), emptyOpcion(), emptyOpcion()],
});

const moveItem = (list, index, direction) => {
  const next = [...list];
  const target = index + direction;
  if (target < 0 || target >= next.length) return list;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
};

const letra = (i) => String.fromCharCode(65 + i);

const PreguntaBuilder = ({ preguntas, onChange, hasRespuestas = false }) => {
  const [rawOpen, setRawOpen] = useState(false);
  const [pendingRemoveIndex, setPendingRemoveIndex] = useState(null);

  const updatePregunta = (index, patch) => {
    onChange(preguntas.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  };

  const updateOpcion = (pIndex, oIndex, patch) => {
    const pregunta = preguntas[pIndex];
    const opciones = pregunta.opciones.map((o, i) => (i === oIndex ? { ...o, ...patch } : o));
    updatePregunta(pIndex, { opciones });
  };

  const marcarCorrecta = (pIndex, oIndex, checked) => {
    const pregunta = preguntas[pIndex];
    const opciones = pregunta.opciones.map((o, i) => {
      if (i === oIndex) return { ...o, correcta: checked };
      // En selección única sólo puede haber una correcta.
      return pregunta.tipo === 'unica' ? { ...o, correcta: false } : o;
    });
    updatePregunta(pIndex, { opciones });
  };

  const removePregunta = (index) => {
    if (hasRespuestas) {
      setPendingRemoveIndex(index);
      return;
    }
    onChange(preguntas.filter((_, i) => i !== index));
  };

  const confirmRemovePregunta = () => {
    if (pendingRemoveIndex == null) return;
    onChange(preguntas.filter((_, i) => i !== pendingRemoveIndex));
    setPendingRemoveIndex(null);
  };

  const applyRawImport = (parsedPreguntas, mode) => {
    if (mode === 'replace') {
      onChange(parsedPreguntas);
    } else {
      const nonEmpty = preguntas.filter(
        (p) => p.texto.trim() || (p.opciones || []).some((o) => o.texto.trim())
      );
      onChange([...nonEmpty, ...parsedPreguntas]);
    }
    setRawOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-[var(--text-primary)]">Preguntas</p>
        <div className="flex gap-2">
          <button
            type="button"
            className="c-btn c-btn-ghost min-h-11 px-3 py-2 text-sm"
            onClick={() => setRawOpen(true)}
          >
            <ClipboardPaste size={16} /> RAW
          </button>
          <button
            type="button"
            className="c-btn c-btn-ghost min-h-11 px-3 py-2 text-sm"
            onClick={() => onChange([...preguntas, emptyPregunta()])}
          >
            <Plus size={16} /> Agregar pregunta
          </button>
        </div>
      </div>

      <RawImportPanel open={rawOpen} onClose={() => setRawOpen(false)} onApply={applyRawImport} />

      {preguntas.length === 0 && (
        <p className="text-sm text-[var(--text-secondary)]">
          Aún no hay preguntas. Agrega al menos una para el examen.
        </p>
      )}

      {preguntas.map((pregunta, pIndex) => {
        const sinCorrecta = !(pregunta.opciones || []).some((o) => o.correcta);
        return (
          <div
            key={pregunta.id || pIndex}
            className={`rounded-[var(--radius-md)] border p-4 ${
              sinCorrecta ? 'border-amber-500/60' : 'border-[var(--border-subtle)]'
            }`}
          >
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                Pregunta {pIndex + 1}
              </span>
              {sinCorrecta && (
                <span className="text-xs font-semibold text-amber-500">Falta marcar la correcta</span>
              )}
              <div className="ml-auto flex gap-1">
                <button
                  type="button"
                  className="c-btn-circle"
                  aria-label="Subir pregunta"
                  disabled={pIndex === 0}
                  onClick={() => onChange(moveItem(preguntas, pIndex, -1))}
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  type="button"
                  className="c-btn-circle"
                  aria-label="Bajar pregunta"
                  disabled={pIndex === preguntas.length - 1}
                  onClick={() => onChange(moveItem(preguntas, pIndex, 1))}
                >
                  <ChevronDown size={16} />
                </button>
                <button
                  type="button"
                  className="c-btn-circle"
                  aria-label="Quitar pregunta"
                  onClick={() => removePregunta(pIndex)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <label className="c-label" htmlFor={`preg-texto-${pIndex}`}>
              Texto de la pregunta
            </label>
            <input
              id={`preg-texto-${pIndex}`}
              className="c-input mb-3"
              value={pregunta.texto}
              onChange={(e) => updatePregunta(pIndex, { texto: e.target.value })}
              placeholder="¿Quién es el único camino para llegar al Padre?"
            />

            <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="c-label" htmlFor={`preg-tipo-${pIndex}`}>
                  Tipo
                </label>
                <select
                  id={`preg-tipo-${pIndex}`}
                  className="c-input"
                  value={pregunta.tipo}
                  onChange={(e) => {
                    const tipo = e.target.value;
                    const patch = { tipo };
                    if (tipo === 'unica') {
                      // Conserva sólo la primera correcta.
                      let seen = false;
                      patch.opciones = (pregunta.opciones || []).map((o) => {
                        if (o.correcta && !seen) {
                          seen = true;
                          return o;
                        }
                        return { ...o, correcta: false };
                      });
                      patch.max_selecciones = '';
                    }
                    updatePregunta(pIndex, patch);
                  }}
                >
                  {TIPOS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="c-label" htmlFor={`preg-puntos-${pIndex}`}>
                  Puntos
                </label>
                <input
                  id={`preg-puntos-${pIndex}`}
                  type="number"
                  min={1}
                  inputMode="numeric"
                  className="c-input"
                  value={pregunta.puntos ?? 1}
                  onChange={(e) => updatePregunta(pIndex, { puntos: e.target.value })}
                />
              </div>
              <label className="flex min-h-11 items-end gap-2 pb-2 text-sm text-[var(--text-primary)]">
                <input
                  type="checkbox"
                  className="h-5 w-5"
                  checked={Boolean(pregunta.requerida)}
                  onChange={(e) => updatePregunta(pIndex, { requerida: e.target.checked })}
                />
                Requerida
              </label>
            </div>

            {pregunta.tipo === 'multiple' && (
              <div className="mb-3">
                <label className="c-label" htmlFor={`preg-max-${pIndex}`}>
                  Máximo de selecciones (opcional)
                </label>
                <input
                  id={`preg-max-${pIndex}`}
                  type="number"
                  min={1}
                  className="c-input"
                  value={pregunta.max_selecciones ?? ''}
                  onChange={(e) => updatePregunta(pIndex, { max_selecciones: e.target.value })}
                  placeholder="Sin límite"
                />
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                Opciones · marca la{pregunta.tipo === 'multiple' ? 's' : ''} correcta
                {pregunta.tipo === 'multiple' ? 's' : ''}
              </p>
              {(pregunta.opciones || []).map((opcion, oIndex) => (
                <div key={opcion.id || oIndex} className="flex flex-wrap items-center gap-2">
                  <span className="w-5 text-sm font-semibold text-[var(--text-secondary)]">
                    {letra(oIndex)})
                  </span>
                  <input
                    className="c-input min-w-0 flex-1"
                    value={opcion.texto}
                    onChange={(e) => updateOpcion(pIndex, oIndex, { texto: e.target.value })}
                    placeholder={`Opción ${letra(oIndex)}`}
                    aria-label={`Texto opción ${letra(oIndex)}`}
                  />
                  <label
                    className={`flex min-h-11 items-center gap-2 text-xs ${
                      opcion.correcta
                        ? 'font-semibold text-[var(--accent-success)]'
                        : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    <input
                      type={pregunta.tipo === 'unica' ? 'radio' : 'checkbox'}
                      name={`correcta-${pregunta.id}`}
                      className="h-5 w-5 accent-[var(--accent-success)]"
                      checked={Boolean(opcion.correcta)}
                      onChange={(e) => marcarCorrecta(pIndex, oIndex, e.target.checked)}
                    />
                    Correcta
                  </label>
                  <button
                    type="button"
                    className="c-btn-circle"
                    aria-label={`Subir opción ${letra(oIndex)}`}
                    disabled={oIndex === 0}
                    onClick={() =>
                      updatePregunta(pIndex, {
                        opciones: moveItem(pregunta.opciones, oIndex, -1),
                      })
                    }
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    type="button"
                    className="c-btn-circle"
                    aria-label={`Bajar opción ${letra(oIndex)}`}
                    disabled={oIndex === pregunta.opciones.length - 1}
                    onClick={() =>
                      updatePregunta(pIndex, {
                        opciones: moveItem(pregunta.opciones, oIndex, 1),
                      })
                    }
                  >
                    <ChevronDown size={14} />
                  </button>
                  <button
                    type="button"
                    className="c-btn-circle"
                    aria-label={`Quitar opción ${letra(oIndex)}`}
                    disabled={(pregunta.opciones || []).length <= 2}
                    onClick={() =>
                      updatePregunta(pIndex, {
                        opciones: pregunta.opciones.filter((_, i) => i !== oIndex),
                      })
                    }
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="c-btn c-btn-ghost min-h-11 px-3 py-2 text-sm"
                onClick={() =>
                  updatePregunta(pIndex, {
                    opciones: [...(pregunta.opciones || []), emptyOpcion()],
                  })
                }
              >
                <Plus size={14} /> Agregar opción
              </button>
            </div>
          </div>
        );
      })}

      <Modal
        open={pendingRemoveIndex != null}
        onClose={() => setPendingRemoveIndex(null)}
        title="Confirmar eliminación"
        footer={
          <>
            <button
              type="button"
              className="c-btn c-btn-ghost min-h-11"
              onClick={() => setPendingRemoveIndex(null)}
            >
              Cancelar
            </button>
            <button type="button" className="c-btn c-btn-danger min-h-11" onClick={confirmRemovePregunta}>
              Quitar pregunta
            </button>
          </>
        }
      >
        <p className="text-sm text-[var(--text-secondary)]">
          Este examen ya tiene respuestas. Quitar una pregunta no recalifica las respuestas previas,
          pero puede confundir al revisarlas. ¿Continuar?
        </p>
      </Modal>
    </div>
  );
};

export default PreguntaBuilder;
