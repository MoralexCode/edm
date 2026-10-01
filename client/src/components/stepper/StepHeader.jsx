import { ArrowLeft } from 'lucide-react';

/** Barra de progreso + flecha ← + contador "4/10" (estilo del mockup). */
const StepHeader = ({ current, total, onBack, label }) => {
  const pct = total ? Math.round((current / total) * 100) : 0;
  return (
    <header className="sticky top-0 z-10 bg-[var(--brand-ivory)] px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-2">
      <div
        className="edm-progress"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={current}
        aria-label="Progreso del examen"
      >
        <span style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-3 flex h-11 items-center justify-between">
        {onBack ? (
          <button type="button" className="edm-icon-btn" onClick={onBack} aria-label="Regresar">
            <ArrowLeft size={28} strokeWidth={2.25} />
          </button>
        ) : (
          <span />
        )}
        <span className="text-lg font-medium text-[var(--brand-ink-soft)] tabular-nums" aria-live="polite">
          {label ?? `${current}/${total}`}
        </span>
      </div>
    </header>
  );
};

export default StepHeader;
