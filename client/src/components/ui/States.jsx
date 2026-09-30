export const Loading = ({ label = 'Cargando...' }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-16 text-[var(--text-secondary)]">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--divider)] border-t-[var(--accent-strong)]" />
    <span className="text-sm">{label}</span>
  </div>
);

export const EmptyState = ({ title = 'Sin registros', description, action }) => (
  <div className="c-card flex flex-col items-center gap-2 px-6 py-12 text-center">
    <p className="text-base font-bold text-[var(--text-primary)]">{title}</p>
    {description && <p className="max-w-sm text-sm text-[var(--text-secondary)]">{description}</p>}
    {action && <div className="mt-3">{action}</div>}
  </div>
);
