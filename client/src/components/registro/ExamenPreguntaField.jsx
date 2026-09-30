const letra = (i) => String.fromCharCode(65 + i);

const ExamenPreguntaField = ({ pregunta, numero, value, onChange, error }) => {
  const fieldId = `pregunta-${pregunta.id}`;
  const errorId = `${fieldId}-error`;

  const legend = (
    <legend className="text-base font-semibold text-[var(--text-primary)]">
      {numero}. {pregunta.texto}
      {pregunta.requerida ? ' *' : ''}
    </legend>
  );

  if (pregunta.tipo === 'unica') {
    const selected = value?.opcion_id || '';
    return (
      <fieldset className="space-y-3" aria-describedby={error ? errorId : undefined}>
        {legend}
        <div className="space-y-2">
          {(pregunta.opciones || []).map((opcion, i) => (
            <label
              key={opcion.id}
              className="flex min-h-11 cursor-pointer items-start gap-3 text-sm text-[var(--text-primary)]"
            >
              <input
                type="radio"
                className="mt-1 h-5 w-5 shrink-0 accent-[var(--accent-strong)]"
                name={fieldId}
                value={opcion.id}
                checked={selected === opcion.id}
                onChange={() => onChange({ opcion_id: opcion.id })}
              />
              <span>
                <span className="font-semibold text-[var(--text-secondary)]">{letra(i)})</span> {opcion.texto}
              </span>
            </label>
          ))}
        </div>
        {error && (
          <p id={errorId} className="text-sm text-red-500">
            {error}
          </p>
        )}
      </fieldset>
    );
  }

  // multiple
  const selectedIds = Array.isArray(value?.opcion_ids) ? value.opcion_ids : [];
  const max = pregunta.max_selecciones != null ? Number(pregunta.max_selecciones) : null;
  const atLimit = max != null && selectedIds.length >= max;

  const toggle = (opcionId) => {
    const isOn = selectedIds.includes(opcionId);
    if (!isOn && atLimit) return;
    onChange({
      opcion_ids: isOn ? selectedIds.filter((id) => id !== opcionId) : [...selectedIds, opcionId],
    });
  };

  return (
    <fieldset className="space-y-3" aria-describedby={error ? errorId : undefined}>
      {legend}
      <p className="text-sm text-[var(--text-secondary)]">
        {max != null
          ? `Puedes seleccionar hasta ${max}${atLimit ? ' (límite alcanzado)' : ''}`
          : 'Selecciona todas las que apliquen'}
      </p>
      <div className="space-y-2">
        {(pregunta.opciones || []).map((opcion, i) => {
          const checked = selectedIds.includes(opcion.id);
          const disabled = !checked && atLimit;
          return (
            <label
              key={opcion.id}
              className={`flex min-h-11 items-start gap-3 text-sm text-[var(--text-primary)] ${
                disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
              }`}
            >
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 shrink-0 accent-[var(--accent-strong)]"
                checked={checked}
                disabled={disabled}
                aria-disabled={disabled}
                onChange={() => toggle(opcion.id)}
              />
              <span>
                <span className="font-semibold text-[var(--text-secondary)]">{letra(i)})</span> {opcion.texto}
              </span>
            </label>
          );
        })}
      </div>
      {error && (
        <p id={errorId} className="text-sm text-red-500">
          {error}
        </p>
      )}
    </fieldset>
  );
};

export default ExamenPreguntaField;
