import { X } from 'lucide-react';
import { useEffect } from 'react';

const WIDTH = {
  default: 'sm:max-w-lg',
  wide: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
};

const Modal = ({
  open,
  onClose,
  title,
  children,
  footer,
  wide = false,
  size,
  bodyClassName = '',
}) => {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const widthClass = WIDTH[size] || (wide ? WIDTH.wide : WIDTH.default);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0" aria-label="Cerrar" onClick={onClose} />
      <div
        className={`relative z-10 flex max-h-[92vh] w-full flex-col rounded-t-[var(--radius-lg)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-soft)] sm:max-h-[88vh] sm:rounded-[var(--radius-lg)] ${widthClass}`}
      >
        <div className="mb-4 flex shrink-0 items-center justify-between gap-3">
          <h3 className="min-w-0 text-lg font-bold text-[var(--text-primary)]">{title}</h3>
          <button type="button" onClick={onClose} className="c-btn-circle h-9 w-9 shrink-0" aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>
        <div
          className={`min-h-0 flex-1 overflow-y-auto overscroll-contain hide-scrollbar ${bodyClassName}`}
        >
          {children}
        </div>
        {footer && <div className="mt-4 flex shrink-0 justify-end gap-2 border-t border-[var(--divider)] pt-4">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
