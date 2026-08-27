/**
 * Directorio de radios en vivo (Radio Browser: base de datos comunitaria,
 * abierta y gratuita de streams de radio reales — https://www.radio-browser.info).
 * No hay una API global oficial de "las radios más escuchadas del mundo";
 * esto usa el ranking real por clics de la comunidad, que es el proxy
 * abierto más cercano que existe.
 */

export interface RadioStation {
  id: string;
  name: string;
  country: string;
  favicon: string;
  streamUrl: string;
  tags: string;
}

const API_BASE = 'https://de1.api.radio-browser.info/json/stations/search';

interface RawStation {
  stationuuid: string;
  name: string;
  country: string;
  favicon: string;
  url_resolved: string;
  tags: string;
}

/** Palabras clave de "radio hablada" (voz) frente a música. */
const TALK_KEYWORDS = [
  'news', 'noticias', 'talk', 'conversacion', 'deportes', 'sport', 'cultura',
  'cultural', 'infantil', 'clasica', 'terror', 'cuentos', 'religion', 'religiosa',
  'politica', 'economia', 'voz', 'radio', 'fm', 'am', 'opinion', 'informacion',
];

/** Géneros de música pura (usados para clasificar y para la sección Música). */
export const MUSIC_GENRES = [
  'country', 'pop', 'rock', 'latin', 'reggaeton', 'balada', 'salsa', 'bachata',
  'cumbia', 'norteño', 'mariachi', 'banda', 'ranchera', 'jazz', 'blues',
  'classical', 'electronica', 'house', 'dance', 'reggae', 'hiphop', 'rap',
  'metal', 'indie', 'folk', 'romantica', 'tropical', 'vallenato', 'corridos',
];

function classify(station: { name: string; tags: string }): 'talk' | 'music' | 'other' {
  const haystack = (station.name + ' ' + station.tags).toLowerCase();
  const isTalk = TALK_KEYWORDS.some((k) => haystack.includes(k.toLowerCase()));
  const isMusic = MUSIC_GENRES.some((k) => haystack.includes(k.toLowerCase()));
  if (isTalk) return 'talk';
  if (isMusic) return 'music';
  return 'other';
}

/** Trae las estaciones más escuchadas (por clics reales) en español. */
export async function fetchTopStations(limit = 500): Promise<RadioStation[]> {
  const params = new URLSearchParams({
    language: 'spanish',
    order: 'clickcount',
    reverse: 'true',
    limit: String(limit),
    hidebroken: 'true',
  });
  const res = await fetch(`${API_BASE}?${params.toString()}`, {
    headers: { 'User-Agent': 'PodcastGymApp/1.0' },
  });
  if (!res.ok) throw new Error(`Error al obtener radios (${res.status})`);
  const data: RawStation[] = await res.json();
  return data
    .filter((s) => !!s.url_resolved)
    .map(normalizeStation);
}

/** Devuelve la estación normalizada según su tipo (hablada / música / otro). */
function normalizeStation(s: RawStation): RadioStation {
  return {
    id: s.stationuuid,
    name: s.name,
    country: s.country || '',
    favicon: s.favicon || '',
    streamUrl: s.url_resolved,
    tags: s.tags || '',
  };
}

/**
 * Radio HABLADA en vivo: noticias, deportes, charlas, cultural, infantil…
 * Filtra la música (que ahora vive en su propia sección "Música").
 */
export async function fetchRadioStations(limit = 1500): Promise<RadioStation[]> {
  const all = await fetchTopStations(limit);
  return all.filter((s) => classify(s) !== 'music');
}

/**
 * Música en vivo: TODAS las estaciones musicales variadas (country, pop, rock,
 * salsa, reggaeton, etc.) sin limitar por género — sección dedicada.
 */
export async function fetchMusicStations(limit = 1500): Promise<RadioStation[]> {
  const all = await fetchTopStations(limit);
  return all.filter((s) => classify(s) === 'music' && !!s.streamUrl);
}

/** Busca estaciones de un género concreto (por etiqueta) en español. */
async function fetchByTag(tag: string, limit = 80): Promise<RadioStation[]> {
  const params = new URLSearchParams({
    tag,
    language: 'spanish',
    order: 'clickcount',
    reverse: 'true',
    limit: String(limit),
    hidebroken: 'true',
  });
  const res = await fetch(`${API_BASE}?${params.toString()}`, {
    headers: { 'User-Agent': 'PodcastGymApp/1.0' },
  });
  if (!res.ok) return [];
  const data: RawStation[] = await res.json();
  return data.filter((s) => !!s.url_resolved).map(normalizeStation);
}

/**
 * Música pura por TODOS los géneros. Consulta cada género musical por su
 * etiqueta en la API de radio-browser (que la clasifica como música), para que
 * la sección Música NO mezcle radio hablada (noticias, charlas, FM genérica).
 * Se hace en lotes pequeños para no saturar la API.
 */
export async function fetchMusicByAllGenres(): Promise<RadioStation[]> {
  const BATCH = 4;
  const genres = [...MUSIC_GENRES];
  const seen = new Set<string>();
  const out: RadioStation[] = [];

  for (let i = 0; i < genres.length; i += BATCH) {
    const batchGenres = genres.slice(i, i + BATCH);
    const batchResults = await Promise.allSettled(
      batchGenres.map((g) => fetchByTag(g, 40)),
    );
    for (const r of batchResults) {
      if (r.status !== 'fulfilled') continue;
      for (const s of r.value) {
        if (seen.has(s.id)) continue;
        // Doble seguridad: aunque la API diga que es de un género musical,
        // descartamos estaciones que claramente sean habladas (noticias, talk...)
        if (classify(s) === 'talk' || (s.tags || '').toLowerCase().includes('talk')) continue;
        seen.add(s.id);
        out.push(s);
      }
    }
  }

  return out;
}


