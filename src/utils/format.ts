// Utilidades de formato y tema de la app

import { Colors } from '../theme/colors';
export { Colors };

export const Font = {
  regular: undefined, // usa fuente por defecto del sistema
  bold: 'bold',
};

/** Convierte segundos a formato mm:ss o h:mm:ss */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const s = Math.floor(seconds % 60);
  const m = Math.floor((seconds / 60) % 60);
  const h = Math.floor(seconds / 3600);
  const ss = s < 10 ? `0${s}` : `${s}`;
  const mm = m < 10 ? `0${m}` : `${m}`;
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

/** Duración legible: "1 h 24 m" o "24 min" */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h} h ${m} m`;
  return `${m} min`;
}

/** Fecha legible de un audio: "12 enc" o "hace 3 días" */
export function formatDate(timestamp: number): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const diff = Date.now() - timestamp;
  const day = 86400000;
  if (diff < day) {
    const h = Math.floor(diff / 3600000);
    if (h >= 1) return `hace ${h} h`;
    return 'hoy';
  }
  if (diff < 7 * day) {
    const d = Math.floor(diff / day);
    return `hace ${d} días`;
  }
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}

/** Porcentaje de progreso entre 0 y 1 */
export function progressFraction(position: number, duration: number): number {
  if (!duration || duration <= 0 || position < 0) return 0;
  return Math.min(1, position / duration);
}
