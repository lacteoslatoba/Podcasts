/**
 * Jamendo — canciones REALES y COMPLETAS (no previews de 30s), 100% legal
 * y gratis: todo el catálogo de Jamendo es de artistas independientes bajo
 * licencia Creative Commons. No tiene artistas mainstream (Bad Bunny,
 * Shakira, etc. no están acá — para eso está la sección de arriba, con
 * previews de iTunes) pero cada canción se puede escuchar entera.
 *
 * Client ID propio de la app, registrado en https://devportal.jamendo.com/
 * (cuenta gratuita, plan "Read & write", sin costo).
 */

const CLIENT_ID = '0fb72c2a';
const BASE = 'https://api.jamendo.com/v3.0/tracks/';

export interface JamendoTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  artworkUrl: string;
  audioUrl: string;
  durationMs: number;
}

interface JamendoRawTrack {
  id: string;
  name: string;
  artist_name: string;
  album_name: string;
  album_image: string;
  audio: string;
  duration: number;
}

function mapTrack(r: JamendoRawTrack): JamendoTrack {
  return {
    id: r.id,
    title: r.name || 'Sin título',
    artist: r.artist_name || 'Artista independiente',
    album: r.album_name || '',
    artworkUrl: r.album_image || '',
    audioUrl: r.audio || '',
    durationMs: (r.duration || 30) * 1000,
  };
}

async function request(params: Record<string, string>): Promise<JamendoTrack[]> {
  const qs = new URLSearchParams({ client_id: CLIENT_ID, format: 'json', ...params });
  let res: Response;
  try {
    res = await fetch(`${BASE}?${qs.toString()}`);
  } catch (e) {
    throw new Error('No se pudo contactar el catálogo de Jamendo.');
  }
  if (!res.ok) throw new Error(`Error del catálogo (${res.status})`);
  const data = await res.json();
  const results: JamendoRawTrack[] = data?.results ?? [];
  return results.filter((r) => !!r.audio).map(mapTrack);
}

/** Busca canciones completas reales por nombre de canción o artista. */
export async function searchJamendoTracks(term: string, limit = 30): Promise<JamendoTrack[]> {
  if (!term.trim()) return [];
  return request({ namesearch: term.trim(), limit: String(limit) });
}

/** Las canciones más populares de todo Jamendo (ranking real de reproducciones). */
export async function fetchPopularJamendoTracks(limit = 20): Promise<JamendoTrack[]> {
  return request({ order: 'popularity_total', limit: String(limit) });
}

/** Canciones reales de un género/tag (rock, pop, electronic, jazz, etc.). */
export async function fetchJamendoTracksByTag(tag: string, limit = 15): Promise<JamendoTrack[]> {
  return request({ fuzzytags: tag, order: 'popularity_total', limit: String(limit) });
}

/** Géneros disponibles en el catálogo de Jamendo (tags reales que usa su API). */
export const JAMENDO_GENRES: { id: string; label: string }[] = [
  { id: 'rock', label: 'Rock' },
  { id: 'pop', label: 'Pop' },
  { id: 'electronic', label: 'Electrónica' },
  { id: 'jazz', label: 'Jazz' },
  { id: 'classical', label: 'Clásica' },
  { id: 'hiphop', label: 'Hip Hop' },
  { id: 'metal', label: 'Metal' },
  { id: 'folk', label: 'Folk' },
  { id: 'ambient', label: 'Ambient' },
  { id: 'lounge', label: 'Lounge' },
];

export interface JamendoGenreRow {
  genre: { id: string; label: string };
  tracks: JamendoTrack[];
}

/** Arma las filas por género para la sección de canciones completas. */
export async function fetchJamendoGenreRows(
  genres: { id: string; label: string }[] = JAMENDO_GENRES,
  perGenre = 15,
  onGenre?: (row: JamendoGenreRow) => void,
): Promise<JamendoGenreRow[]> {
  const out: JamendoGenreRow[] = [];
  for (const genre of genres) {
    try {
      const tracks = await fetchJamendoTracksByTag(genre.id, perGenre);
      if (tracks.length > 0) {
        const row = { genre, tracks };
        out.push(row);
        onGenre?.(row); // pinta cada género apenas llega
      }
    } catch {
      // seguimos con el resto de los géneros si uno falla
    }
  }
  return out;
}
