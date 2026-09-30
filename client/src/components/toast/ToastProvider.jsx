import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import AppToast from './AppToast';
import toast from './toast';

const MAX_VISIBLE = 3;

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const toggleDetails = useCallback((id) => {
    setToasts((current) =>
      current.map((t) => (t.id === id ? { ...t, expanded: !t.expanded } : t))
    );
  }, []);

  useEffect(() => {
    return toast.subscribe((event) => {
      if (event.type === 'dismiss') {
        dismiss(event.id);
        return;
      }

      if (event.type === 'add') {
        setToasts((current) => {
          const next = [...current, event.toast];
          return next.length > MAX_VISIBLE ? next.slice(-MAX_VISIBLE) : next;
        });
      }
    });
  }, [dismiss]);

  return (
    <>
      {children}
      {createPortal(
        <div className="app-toast-host" aria-label="Notificaciones">
          {toasts.map((item) => (
            <AppToast
              key={item.id}
              toast={item}
              onDismiss={dismiss}
              onToggleDetails={toggleDetails}
            />
          ))}
        </div>,
        document.body
      )}
    </>
  );
};

export default ToastProvider;
