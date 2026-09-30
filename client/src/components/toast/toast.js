const listeners = new Set();
let toastId = 0;

const emit = (event) => {
  listeners.forEach((listener) => listener(event));
};

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const normalize = (messageOrOptions, options = {}) => {
  if (typeof messageOrOptions === 'string') {
    return { message: messageOrOptions, ...options };
  }
  return { ...messageOrOptions, ...options };
};

const push = (type, messageOrOptions, options = {}) => {
  const payload = normalize(messageOrOptions, options);
  const id = ++toastId;
  emit({ type: 'add', toast: { id, type, ...payload } });
  return id;
};

export const toast = {
  success: (messageOrOptions, options) => push('success', messageOrOptions, options),
  error: (messageOrOptions, options) => push('error', messageOrOptions, options),
  warning: (messageOrOptions, options) => push('warning', messageOrOptions, options),
  dismiss: (id) => emit({ type: 'dismiss', id }),
  subscribe,
};

export default toast;
