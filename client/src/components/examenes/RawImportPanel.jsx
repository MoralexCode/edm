import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import Modal from '../ui/Modal';
import { parseExamenRawText, RAW_PLACEHOLDER_TEXT } from '../../utils/parseExamenRawText';

const TIPO_LABEL = {
  unica: 'Selección única',
  multiple: 'Selección múltiple',
};

const RawImportPanel = ({ open, onClose, onApply }) => {
  const [rawText, setRawText] = useState(RAW_PLACEHOLDER_TEXT);
  const [result, setResult] = useState(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setRawText(RAW_PLACEHOLDER_TEXT);
    setResult(null);
    const t = setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    }, 0);
    return () => clearTimeout(t);
  }, [open]);

  if (!open) return null;

  const analizar = () => {
    setResult(parseExamenRawText(rawText));
  };

  const aplicar = (mode) => {
    if (!result?.preguntas?.length) return;
    onApply(result.preguntas, mode);
  };

  return (
    <Modal open onClose={onClose} title="Importar preguntas (texto crudo)" wide>
      <div className="space-y-4">
        <div>
          <label className="c-label" htmlFor="raw-import-textarea">
            Pega el texto de tus preguntas
          </label>
          <textarea
            id="raw-import-textarea"
            ref={textareaRef}
            className="c-input min-h-64 font-mono text-xs leading-relaxed"
            value={rawText}
            onChange={(e) => {
              setRawText(e.target.value);
              setResult(null);
            }}
          />
        </div>

        <div className="flex justify-end">
          <button type="button" className="c-btn px-4 py-2 text-sm" onClick={analizar}>
            Analizar
          </button>
        </div>

        {result && (
          <div className="space-y-3 border-t border-[var(--border-subtle)] pt-4">
            {result.preguntas.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">
                No se reconoció ninguna pregunta. Revisa que cada pregunta empiece con "1.-", "2.-",
                etc.
              </p>
            ) : (
              <>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  Se detectaron {result.preguntas.length} pregunta
                  {result.preguntas.length === 1 ? '' : 's'} ·{' '}
                  {result.preguntas.reduce((n, p) => n + p.opciones.length, 0)} opciones ·{' '}
                  {result.preguntas.filter((p) => p.opciones.some((o) => o.correcta)).length} con
                  respuesta correcta
                </p>

                <div className="max-h-72 space-y-3 overflow-y-auto hide-scrollbar">
                  {result.preguntas.map((p, i) => (
                    <div
                      key={p.id}
                      className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] p-3"
                    >
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-[var(--text-primary)]">
                          {i + 1}. {p.texto}
                        </span>
                        <span className="c-chip text-[10px]">{TIPO_LABEL[p.tipo]}</span>
                      </div>
                      <ul className="ml-4 list-disc text-xs text-[var(--text-secondary)]">
                        {p.opciones.map((o) => (
                          <li
                            key={o.id}
                            className={o.correcta ? 'font-semibold text-[var(--accent-success)]' : ''}
                          >
                            {o.texto}
                            {o.correcta && <Check size={12} className="ml-1 inline" />}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </>
            )}

            {result.warnings.length > 0 && (
              <div className="rounded-[var(--radius-md)] border border-amber-500/30 bg-amber-500/10 p-3">
                <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-amber-500">
                  <AlertTriangle size={14} /> {result.warnings.length} advertencia
                  {result.warnings.length === 1 ? '' : 's'}
                </div>
                <ul className="ml-4 list-disc text-xs text-[var(--text-secondary)]">
                  {result.warnings.map((w, i) => (
                    <li key={i}>
                      {w.line ? `Línea ${w.line}: ` : ''}
                      {w.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.preguntas.length > 0 && (
              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="c-btn c-btn-ghost min-h-11 px-3 py-2 text-sm"
                  onClick={() => aplicar('append')}
                >
                  Agregar al final
                </button>
                <button
                  type="button"
                  className="c-btn min-h-11 px-3 py-2 text-sm"
                  onClick={() => aplicar('replace')}
                >
                  Reemplazar preguntas actuales
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default RawImportPanel;
