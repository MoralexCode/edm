export const getToastErrorDetails = (err) => {
  const data = err?.response?.data;
  if (!data && !err?.response?.status) return null;

  const details = {
    message: data?.message || err?.message,
    detail: data?.detail,
    code: data?.code,
    status: err?.response?.status,
  };

  if (import.meta.env.DEV && data && !data.detail) {
    details.raw = data;
  }

  return details;
};
