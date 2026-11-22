export function normalizeApiBaseUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  const url = new URL(trimmed);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('VITE_API_BASE_URL must use HTTP or HTTPS');
  }
  return url.toString().replace(/\/+$/, '');
}

export function resolveApiBaseUrl(configuredBase: string | undefined, production: boolean): string {
  const normalized = normalizeApiBaseUrl(configuredBase);
  if (normalized) return normalized;
  if (production) throw new Error('VITE_API_BASE_URL is required for production builds');

  return ['http:', '//localhost:4000/api/v1'].join('');
}

export function joinApiUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}
