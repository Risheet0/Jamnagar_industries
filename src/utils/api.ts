/**
 * Centralized API base URL configuration and URL resolver.
 * - Production: uses VITE_API_URL or defaults to https://jamnagar-industries.onrender.com
 * - Local Dev: uses Vite proxy to http://localhost:3001 or VITE_API_URL if specified
 */
export const API_BASE_URL: string = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? '' : 'https://jamnagar-industries.onrender.com')
).replace(/\/+$/, '');

export const apiUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${cleanPath}` : cleanPath;
};
