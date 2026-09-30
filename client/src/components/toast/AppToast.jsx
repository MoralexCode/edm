import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Check, X } from 'lucide-react';

const DEFAULT_DURATION_MS = 5000;
const VER_ACTION_DURATION_MS = 7000;

const TYPE_ICON = {
  success: Check,
  error: AlertCircle,
  warning: AlertCircle,
};

const formatDetails = (details) => {
  if (!details) return '';
  if (details.detail) {
    return Array.isArray(details.detail) ? details.detail.filter(Boolean).join('\n') : String(details.detail);
  }
  const lines = [];
  if (details.message) lines.push(details.message);
  if (details.code) lines.push(`Código: ${details.code}`);
  if (details.status) lines.push(`HTTP: ${details.status}`);
  if (details.raw) lines.push(JSON.stringify(details.raw, null, 2));
  return lines.join('\n');
};

const AppToast = ({ toast: item, onDismiss, onToggleDetails }) => {
  const [leaving, setLeaving] = useState(false);
  const [progress, setProgress] = useState(100);
  const leavingRef = useRef(false);
  const rafRef = useRef(null);
  const startRef = useRef(null);

  const hasVerAction = item.action?.label === 'Ver';
  const hasApiDetails = Boolean(item.details);
  const durationMs = hasVerAction ? VER_ACTION_DURATION_MS : item.duration ?? DEFAULT_DURATION_MS;
  const showProgress = durationMs > 0 && !item.persistent;
  const Icon = TYPE_ICON[item.type] || Check;
  const title = item.title || item.message;
  const subtitle = item.subtitle;

  const dismiss = useCallback(() => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    setLeaving(true);
    window.setTimeout(() => onDismiss(item.id), 280);
  }, [onDismiss, item.id]);

  useEffect(() => {
    if (!showProgress || item.expanded) return undefined;

    startRef.current = performance.now();
    const tick = (now) => {
      const elapsed = now - startRef.current;
      const remaining = Math.max(0, 100 - (elapsed / durationMs) * 100);
      setProgress(remaining);
      if (elapsed >= durationMs) {
        dismiss();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [showProgress, item.expanded, item.id, dismiss, durationMs]);

  const handleBodyClick = () => {
    if (!hasApiDetails || item.expanded) return;
    onToggleDetails(item.id);
  };

  const handleActionClick = () => {
    dismiss();
  };

  const initials =
    item.initials ||
    (typeof title === 'string'
      ? title
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((w) => w[0]?.toUpperCase() || '')
          .join('')
      : '?');

  return (
    <div
      className={`app-toast app-toast--${item.type} ${leaving ? 'app-toast--leaving' : ''} ${item.expanded ? 'app-toast--expanded' : ''} ${hasApiDetails ? 'app-toast--clickable' : ''}`}
      role={item.type === 'error' ? 'alert' : 'status'}
      aria-live="polite"
    >
      <button
        type="button"
        className="app-toast__close"
        onClick={dismiss}
        aria-label="Cerrar notificación"
      >
        <X size={14} />
      </button>

      <div className="app-toast__body" onClick={handleBodyClick}>
        <div className="app-toast__avatar" aria-hidden>
          {item.initials ? initials : <Icon size={18} strokeWidth={2.5} />}
        </div>

        <div className="app-toast__content">
          <p className="app-toast__title">{title}</p>
          {subtitle && <p className="app-toast__subtitle">{subtitle}</p>}
          {hasApiDetails && !item.expanded && (
            <p className="app-toast__hint">Toca para ver detalles</p>
          )}
          {item.expanded && hasApiDetails && (
            <pre className="app-toast__details">{formatDetails(item.details)}</pre>
          )}
          {item.action && (
            <div className="app-toast__actions">
              {item.action.href ? (
                <Link
                  to={item.action.href}
                  className="app-toast__action"
                  onClick={handleActionClick}
                >
                  {item.action.label}
                </Link>
              ) : (
                <button
                  type="button"
                  className="app-toast__action"
                  onClick={() => {
                    item.action.onClick?.();
                    handleActionClick();
                  }}
                >
                  {item.action.label}
                </button>
              )}
            </div>
          )}
        </div>

        <div className={`app-toast__status app-toast__status--${item.type}`} aria-hidden>
          <Icon size={18} strokeWidth={2.25} />
        </div>
      </div>

      {showProgress && (
        <div className="app-toast__progress-track" aria-hidden>
          <div className="app-toast__progress-bar" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
};

export default AppToast;
