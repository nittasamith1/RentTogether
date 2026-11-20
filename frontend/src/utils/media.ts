import { API_BASE_URL } from '../services/api';

/**
 * Normalizes media/image URLs across local development and production.
 * Handles:
 * - Full URLs: https://... or http://... -> returns as-is
 * - Blob / Data URIs: blob:... or data:... -> returns as-is
 * - Relative media paths: /media/items/... -> prepends API_BASE_URL
 * - Empty / null / undefined -> returns empty string
 */
export const getMediaUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  const trimmed = url.trim();
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  ) {
    if (trimmed.includes('res.cloudinary.com') && trimmed.includes('/upload/') && !trimmed.includes('/upload/f_auto')) {
      return trimmed.replace('/upload/', '/upload/f_auto,q_auto/');
    }
    return trimmed;
  }
  const cleanBase = API_BASE_URL.replace(/\/+$/, '');
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${cleanBase}${cleanPath}`;
};
