import { Check } from 'lucide-react';

/**
 * Lista de barras horizontales. `entries` = salida de contarOpciones():
 * [{ id, texto, count, correcta? }]. Si una entrada es la correcta se pinta
 * con --accent-success y lleva palomita.
 */
const BarList = ({ entries, color = 'var(--accent-primary)' }) => {
  if (!entries || entries.length === 0) {
    return <p className="text-sm text-[var(--text-secondary)]">Sin datos para este filtro.</p>;
  }
  const max = entries.reduce((m, e) => Math.max(m, e.count), 0) || 1;

  return (
    <div className="space-y-2">
      {entries.map((e) => {
        const pct = Math.max((e.count / max) * 100, 3);
        return (
          <div key={e.id} className="flex items-center gap-3">
            <div
              className={`flex w-2/5 shrink-0 items-center justify-end gap-1 text-right text-xs leading-tight ${
                e.correcta ? 'font-semibold text-[var(--accent-success)]' : 'text-[var(--text-secondary)]'
              }`}
            >
              {e.correcta && <Check size={14} className="shrink-0" aria-label="Correcta" />}
              <span>{e.texto}</span>
            </div>
            <div className="h-4 flex-1 rounded bg-[var(--border-subtle)]">
              <div
                className="h-full rounded transition-all"
                style={{ width: `${pct}%`, background: e.correcta ? 'var(--accent-success)' : color }}
              />
            </div>
            <div className="w-7 shrink-0 text-xs font-semibold text-[var(--text-primary)]">
              {e.count}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BarList;
