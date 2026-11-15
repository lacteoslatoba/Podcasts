/**
 * Búsqueda real de canciones por artista (catálogo de Apple/iTunes).
 *
 * Honestidad técnica: no existe ninguna API gratuita (ni de Amazon Music,
 * ni Spotify, ni Apple Music) que deje reproducir canciones COMPLETAS de
 * cualquier artista sin que el usuario tenga una cuenta paga de ese
 * servicio conectada — todas requieren OAuth + suscripción activa.
 * Lo que sí es público, gratis y sin login es el catálogo de previews de
 * 30 segundos de iTunes (la misma fuente que usa la app oficial de Apple
 * Music para sus previews) — canciones y artistas 100% reales.
 */

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  artworkUrl: string;
  previewUrl: string;
  durationMs: number;
}

const SEARCH_URL = 'https://itunes.apple.com/search';

interface ItunesSongResult {
  trackId: number;
  trackName?: string;
  artistName?: string;
  collectionName?: string;
  artworkUrl100?: string;
  previewUrl?: string;
  trackTimeMillis?: number;
}

function higherRes(url?: string): string {
  if (!url) return '';
  return url.replace('100x100', '600x600');
}

/**
 * Limitador de velocidad real hacia la API de iTunes.
 *
 * Apple bloquea con 403 (para TODOS los pedidos, incluida la búsqueda que
 * escribe el usuario) si se mandan demasiados fetch seguidos desde la
 * misma IP — su tope no-oficial ronda ~20 pedidos/minuto. Como la base de
 * datos de artistas es grande a propósito ("sin límite de música"), en vez
 * de recortarla, espaciamos cada pedido para nunca pasar ese límite: así
 * SIEMPRE hay lugar para que una búsqueda manual del usuario entre sin
 * chocar con un bloqueo, sin importar cuántos artistas haya en la base.
 */
const MIN_REQUEST_INTERVAL_MS = 3200; // ~18 pedidos/min, con margen bajo el tope de Apple
let lastRequestAt = 0;

async function rateGate(): Promise<void> {
  const wait = lastRequestAt + MIN_REQUEST_INTERVAL_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestAt = Date.now();
}

/** Busca canciones reales de un artista/término. Solo trae las que tienen preview. */
export async function searchSongs(term: string, country = 'mx'): Promise<Song[]> {
  if (!term.trim()) return [];
  await rateGate();
  const params = new URLSearchParams({
    term: term.trim(),
    media: 'music',
    entity: 'song',
    limit: '30',
    country,
  });
  let res: Response;
  try {
    res = await fetch(`${SEARCH_URL}?${params.toString()}`);
  } catch (e) {
    throw new Error('No se pudo contactar el catálogo de música.');
  }
  if (res.status === 403) {
    throw new Error('Apple limitó las búsquedas por un momento — probá de nuevo en unos segundos.');
  }
  if (!res.ok) throw new Error(`Error del catálogo (${res.status})`);
  const data = await res.json();
  const results: ItunesSongResult[] = data?.results ?? [];
  return results
    .filter((r) => !!r.previewUrl)
    .map((r) => ({
      id: String(r.trackId),
      title: r.trackName ?? 'Sin título',
      artist: r.artistName ?? 'Artista desconocido',
      album: r.collectionName ?? '',
      artworkUrl: higherRes(r.artworkUrl100),
      previewUrl: r.previewUrl as string,
      durationMs: r.trackTimeMillis ?? 30000,
    }));
}

export interface ArtistGenre {
  id: string;
  name: string;
  artists: string[];
}

/**
 * Base de datos de artistas reales organizada por género (igual que las
 * filas de género de Audiolibros / Radio), para poder navegar la sección
 * de Música por categoría en vez de una sola lista plana.
 */
export const ARTIST_GENRES: ArtistGenre[] = [
  {
    id: 'urbano',
    name: 'Urbano / Reggaetón',
    artists: [
      'Bad Bunny', 'Feid', 'Rauw Alejandro', 'Ozuna', 'Daddy Yankee',
      'Anuel AA', 'J Balvin', 'Arcángel', 'Don Omar', 'Wisin y Yandel',
    ],
  },
  {
    id: 'regional',
    name: 'Regional Mexicano',
    artists: [
      'Peso Pluma', 'Junior H', 'Fuerza Regida', 'Grupo Frontera', 'Xavi',
      'Natanael Cano', 'Carin Leon', 'Eslabon Armado', 'Christian Nodal', 'Calibre 50',
    ],
  },
  {
    id: 'pop',
    name: 'Pop Latino',
    artists: [
      'Shakira', 'Karol G', 'Maluma', 'Camilo', 'Sebastián Yatra',
      'Danna Paola', 'Kali Uchis', 'Manuel Turizo', 'TINI', 'CNCO',
    ],
  },
  {
    id: 'rock',
    name: 'Rock y Alternativo',
    artists: [
      'Rosalía', 'Mon Laferte', 'Café Tacvba', 'Soda Stereo', 'Enanitos Verdes',
      'Maná', 'Zoé', 'Molotov', 'Caifanes', 'Fito Páez',
    ],
  },
  {
    id: 'tropical',
    name: 'Salsa y Tropical',
    artists: [
      'Marc Anthony', 'Víctor Manuelle', 'Gilberto Santa Rosa', 'Grupo Niche',
      'Rubén Blades', 'Willie Colón', 'Fruko', 'La Sonora Dinamita',
    ],
  },
  {
    id: 'bachata',
    name: 'Bachata y Merengue',
    artists: [
      'Romeo Santos', 'Prince Royce', 'Aventura', 'Juan Luis Guerra',
      'Elvis Crespo', 'Toby Love', 'Xtreme',
    ],
  },
  {
    id: 'cumbia',
    name: 'Cumbia',
    artists: [
      'Los Ángeles Azules', 'Grupo Firme', 'Los Ángeles de Charly',
      'Kumbia Kings', 'Aniceto Molina',
    ],
  },
  {
    id: 'trap',
    name: 'Trap y Hip Hop Latino',
    artists: [
      'Nicki Nicole', 'Duki', 'Bizarrap', 'Trueno', 'Cazzu', 'Eladio Carrion',
    ],
  },
];

/** Lista plana de todos los artistas de la base de datos (para búsqueda/chips). */
export const POPULAR_ARTISTS = ARTIST_GENRES.flatMap((g) => g.artists);

export interface ArtistRow {
  artist: string;
  songs: Song[];
}

/**
 * Trae, para cada artista, sus canciones reales (con preview) — pensado
 * para armar filas horizontales estilo Netflix con las carátulas de cada
 * artista (una fila por artista). Los pedidos van uno por uno (no en
 * paralelo): el `rateGate` de `searchSongs` ya los espacia solo, mandarlos
 * en ráfaga acá arriba no ayuda y es justo lo que hacía saltar el 403 de
 * Apple antes.
 */
export async function fetchArtistRows(
  artists: string[] = POPULAR_ARTISTS,
  perArtist = 12,
): Promise<ArtistRow[]> {
  const out: ArtistRow[] = [];
  for (const artist of artists) {
    try {
      const songs = await searchSongs(artist);
      if (songs.length > 0) out.push({ artist, songs: songs.slice(0, perArtist) });
    } catch {
      // un artista sin resultados o con error puntual no debe cortar el resto
    }
  }
  return out;
}

export interface GenreSection {
  genre: ArtistGenre;
  rows: ArtistRow[];
}

/**
 * Arma la sección de Música organizada "adentro de géneros": para cada
 * género de la base de datos trae las filas de sus artistas (una fila por
 * artista, con las carátulas de sus canciones reales). Se resuelve género
 * por género para no saturar la API con decenas de fetch en paralelo.
 */
export async function fetchGenreSections(
  genres: ArtistGenre[] = ARTIST_GENRES,
  perArtist = 12,
  onGenre?: (section: GenreSection) => void,
): Promise<GenreSection[]> {
  const out: GenreSection[] = [];
  for (const genre of genres) {
    try {
      const rows = await fetchArtistRows(genre.artists, perArtist);
      if (rows.length > 0) {
        const section = { genre, rows };
        out.push(section);
        onGenre?.(section); // permite pintar cada género apenas llega, sin esperar a todos
      }
    } catch {
      // si falla un género entero, seguimos con el resto
    }
  }
  return out;
}
