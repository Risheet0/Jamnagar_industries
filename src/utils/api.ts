/**
 * Global API configuration and URL resolver.
 * In local dev: falls back to relative `/api` (proxied via Vite to http://localhost:3001)
 * In production: uses VITE_API_URL environment variable (e.g., https://jamnagar-industries.onrender.com)
 */
export const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export const apiUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${cleanPath}` : cleanPath;
};
