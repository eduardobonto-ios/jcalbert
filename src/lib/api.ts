const normalizeBaseUrl = (value?: string) => {
  if (!value) return '';
  return value.endsWith('/') ? value.slice(0, -1) : value;
};

export const getApiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const envBaseUrl = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);

  if (envBaseUrl) {
    return `${envBaseUrl}${normalizedPath}`;
  }

  return normalizedPath;
};
