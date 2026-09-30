import { getToastErrorDetails } from './toastErrorDetails';

export const toastApiError = (toast, err, fallback) => {
  const data = err?.response?.data;
  const message = data?.message || fallback;
  const details = getToastErrorDetails(err);
  toast.error(message, details ? { details, expanded: Boolean(data?.detail) } : {});
};
