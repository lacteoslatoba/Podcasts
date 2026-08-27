import type { Audiobook, AudiobookGenre, Episode } from '../types';

/**
 * Catálogo abierto de audiolibros reales.
 * Fuente: los mismos audiolibros de LibriVox (dominio público, narrados por
 * voluntarios), pero servidos vía la API de archive.org en vez de la de
 * librivox.org — esta última no envía cabeceras CORS, así que falla desde
 * un navegador (Expo Web). archive.org sí las envía, y aloja el catálogo
 * completo de LibriVox (colección "librivoxaudio").
 */

const SEARCH_URL = 'https://archive.org/advancedsearch.php';
const METADATA_URL = 'https://archive.org/metadata';

/**
 * Filtro de idioma: SOLO obras en español (código ISO de archive.org = "spa").
 * La colección librivoxaudio contiene obras en muchos idiomas; restringimos a
 * las narraciones en español.
 */
const ES_FILTER = ' language:(spa)';

/** Campos que pedimos al buscador de archive.org */
const FIELDS = ['identifier', 'title', 'creator', 'description', 'runtime', 'language', 'year'];

interface ArchiveDoc {
  identifier: string;
  title?: string;
  creator?: string | string[];
  description?: string | string[];
  runtime?: string;
  language?: string | string[];
  year?: string;
}

interface ArchiveFile {
  name: string;
  format?: string;
  title?: string;
  length?: string;
  track?: string;
}

// ---------- Géneros ----------

/** Géneros temáticos de audiolibros (base de datos organizada para escoger) */
export const AUDIOBOOK_GENRES: AudiobookGenre[] = [
  {
    id: 'aventura',
    name: 'Aventura',
    icon: 'compass-outline',
    // Bilingües: la colección de LibriVox trae obras catalogadas en inglés,
    // pero el catálogo que mostramos está filtrado a idioma español —
    // hacen falta las dos variantes para que el género tenga resultados.
    keywords: [
      'adventure', 'treasure', 'voyage', 'castaway', 'pirates', 'desert', 'jungle', 'expedition',
      'aventura', 'tesoro', 'viaje', 'náufrago', 'piratas', 'desierto', 'selva', 'expedición',
    ],
    color: '#F59E0B',
  },
  {
    id: 'clasicos',
    name: 'Clásicos',
    icon: 'book-outline',
    keywords: [
      'classic', 'english literature', 'american literature', 'novel',
      'clásico', 'clásicos', 'literatura', 'novela',
    ],
    color: '#8B5CF6',
  },
  {
    id: 'fantasia',
    name: 'Fantasía',
    icon: 'sparkles-outline',
    keywords: [
      'fairy', 'fantasy', 'magic', 'narnia', 'goblin', 'wizard', 'myth', 'legend', 'tales',
      'hadas', 'fantasía', 'magia', 'mago', 'mito', 'leyenda', 'cuentos',
    ],
    color: '#EC4899',
  },
  {
    id: 'ciencia-ficcion',
    name: 'Ciencia Ficción',
    icon: 'planet-outline',
    keywords: [
      'science fiction', 'sci-fi', 'space', 'time machine', 'martian', 'future', 'robot', 'war of the worlds',
      'ciencia ficción', 'espacio', 'marciano', 'futuro', 'robot',
    ],
    color: '#06B6D4',
  },
  {
    id: 'misterio',
    name: 'Misterio y Crimen',
    icon: 'search-outline',
    keywords: [
      'mystery', 'detective', 'crime', 'sherlock', 'murder', 'puzzle', 'secret', 'poe',
      'misterio', 'detective', 'crimen', 'asesinato', 'secreto', 'enigma',
    ],
    color: '#EF4444',
  },
  {
    id: 'historia',
    name: 'Historia',
    icon: 'time-outline',
    keywords: [
      'history', 'historical', 'ancient', 'roman', 'greek', 'biography', 'memoir', 'war',
      'historia', 'histórico', 'antiguo', 'romano', 'griego', 'biografía', 'memorias', 'guerra',
    ],
    color: '#F59E0B',
  },
  {
    id: 'ciencia-filosofia',
    name: 'Ciencia y Filosofía',
    icon: 'flask-outline',
    keywords: [
      'philosophy', 'science', 'psychology', 'essays', 'natural', 'universe',
      'filosofía', 'ciencia', 'psicología', 'ensayos', 'naturaleza', 'universo',
    ],
    color: '#10B981',
  },
  {
    id: 'poesia-teatro',
    name: 'Poesía y Teatro',
    icon: 'mic-outline',
    keywords: [
      'poetry', 'poems', 'sonnets', 'drama', 'plays', 'shakespeare', 'theater',
      'poesía', 'poemas', 'sonetos', 'teatro', 'obra de teatro',
    ],
    color: '#F43F5E',
  },
];

/**
 * Clasifica un libro en todos los géneros cuyas palabras clave coincidan con
 * su título o descripción. Devuelve los ids de género.
 */
function matchGenres(book: { title: string; description: string; author: string }): string[] {
  const haystack = `${book.title} ${book.description} ${book.author}`.toLowerCase();
  const matched: string[] = [];
  for (const g of AUDIOBOOK_GENRES) {
    if (g.keywords.some((k) => haystack.includes(k.toLowerCase()))) {
      matched.push(g.id);
    }
  }
  if (matched.length === 0) matched.push('clasicos');
  return matched;
}

// ---------- Helpers ----------

function firstOf(value: string | string[] | undefined, fallback: string): string {
  if (!value) return fallback;
  return Array.isArray(value) ? value.join(', ') : value;
}

/** Limpia una descripción con HTML embebido */
function cleanDescription(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/** "12:34:56", "34:56" o "125.4" (segundos) -> segundos totales */
function parseRuntime(raw?: string): number {
  if (!raw) return 0;
  const s = raw.trim();
  if (!s) return 0;
  if (/^[\d.]+$/.test(s)) return Math.round(parseFloat(s));
  const parts = s.split(':').map((p) => parseFloat(p));
  if (parts.some(Number.isNaN)) return 0;
  if (parts.length === 3) return Math.round(parts[0] * 3600 + parts[1] * 60 + parts[2]);
  if (parts.length === 2) return Math.round(parts[0] * 60 + parts[1]);
  return Math.round(parts[0] || 0);
}

/** Comprueba que el campo de idioma sea español (spa, spanish, es, etc.) */
function isSpanish(value: string | string[] | undefined): boolean {
  if (!value) return false;
  const langs = Array.isArray(value) ? value : [value];
  const text = langs.join(' ').toLowerCase();
  return text.includes('spa') || text.includes('spanish') || /(^|[^a-z])es([^a-z]|$)/i.test(text);
}

function docToAudiobook(doc: ArchiveDoc): Audiobook {
  const description = cleanDescription(firstOf(doc.description, ''));
  return {
    id: doc.identifier,
    title: doc.title || 'Sin título',
    author: firstOf(doc.creator, 'Autor desconocido'),
    description,
    rssUrl: doc.identifier, // aquí guardamos el identifier de archive.org, no un RSS real
    artworkUrl: `https://archive.org/services/img/${doc.identifier}`,
    totalSeconds: parseRuntime(doc.runtime),
    language: firstOf(doc.language, ''),
    year: doc.year || '',
    numSections: 0, // no disponible sin traer la metadata completa de cada libro
  };
}

async function searchArchive(query: string, rows: number): Promise<Audiobook[]> {
  const params = new URLSearchParams();
  FIELDS.forEach((f) => params.append('fl[]', f));
  params.set('q', query);
  params.set('rows', String(rows));
  params.set('output', 'json');
  params.append('sort[]', 'downloads desc');

  let res: Response;
  try {
    res = await fetch(`${SEARCH_URL}?${params.toString()}`);
  } catch (e) {
    throw new Error('No se pudo conectar con la biblioteca de audiolibros.');
  }
  if (!res.ok) throw new Error(`Error al cargar el catálogo (${res.status})`);
  const data = await res.json();
  const docs: ArchiveDoc[] = data?.response?.docs ?? [];
  // Doble seguridad: si algún item no viene indexado como español, se descarta.
  return docs.filter((d) => isSpanish(d.language)).map(docToAudiobook);
}

// ---------- API pública (misma firma que antes) ----------

/**
 * Carga el catálogo de audiolibros de LibriVox (los más populares primero).
 */
export async function fetchCatalog(): Promise<Audiobook[]> {
  return searchArchive(`collection:(librivoxaudio) AND mediatype:(audio)${ES_FILTER}`, 500);
}

/**
 * Devuelve una consulta de archive.org para un género: combina sus palabras
 * clave para traer muchas obras de ese tema de toda la colección.
 */
function genreQuery(genre: AudiobookGenre): string {
  const terms = genre.keywords
    .map((k) => `"${k}"`)
    .join(' OR ');
  return `collection:(librivoxaudio) AND mediatype:(audio) AND (${terms})${ES_FILTER}`;
}

/**
 * Cuenta cuántas obras hay de un género en la colección (barato: solo numFound).
 */
export async function countBooksByGenre(genreId: string): Promise<number> {
  const genre = AUDIOBOOK_GENRES.find((g) => g.id === genreId) ?? AUDIOBOOK_GENRES[0];
  try {
    const params = new URLSearchParams();
    params.set('fl[]', 'identifier');
    params.set('q', genreQuery(genre));
    params.set('rows', '1');
    params.set('output', 'json');
    const res = await fetch(`${SEARCH_URL}?${params.toString()}`);
    if (!res.ok) return 0;
    const data = await res.json();
    return data?.response?.numFound ?? 0;
  } catch (e) {
    return 0;
  }
}

export async function getBooksByGenre(genreId: string): Promise<Audiobook[]> {
  const genre = AUDIOBOOK_GENRES.find((g) => g.id === genreId) ?? AUDIOBOOK_GENRES[0];
  const found = await searchArchive(genreQuery(genre), 600);
  // Filtro adicional por keywords para quitar falsos positivos de la búsqueda amplia
  return found.filter((b) => matchGenres(b).includes(genreId));
}

/** Busca libros por término libre */
export async function searchCatalog(term: string): Promise<Audiobook[]> {
  if (!term.trim()) return [];
  const q = term.trim().replace(/"/g, '');
  return searchArchive(
    `collection:(librivoxaudio) AND mediatype:(audio) AND (title:(${q}) OR creator:(${q}))${ES_FILTER}`,
    100,
  );
}

/**
 * Obtiene los capítulos MP3 de un audiolibro directamente desde los archivos
 * publicados en su item de archive.org (sin depender de un feed RSS externo).
 */
export async function fetchAudiobookChapters(book: Audiobook): Promise<Episode[]> {
  const identifier = book.rssUrl; // ver docToAudiobook: guarda el identifier acá
  let res: Response;
  try {
    res = await fetch(`${METADATA_URL}/${identifier}`);
  } catch (e) {
    throw new Error('No se pudo descargar los capítulos. Revisa tu conexión.');
  }
  if (!res.ok) throw new Error(`Error al descargar los capítulos (${res.status})`);
  const data = await res.json();
  const files: ArchiveFile[] = data?.files ?? [];

  // LibriVox sube cada capítulo en 3 variantes (VBR / 128kb / 64kb).
  // Nos quedamos con una sola por capítulo, prefiriendo 64kbps (más liviana).
  const byBase = new Map<string, ArchiveFile>();
  for (const f of files) {
    if (!f.format || !/mp3/i.test(f.format)) continue;
    const base = f.name.replace(/_(64|128)kb\.mp3$/i, '.mp3').replace(/\.mp3$/i, '');
    const existing = byBase.get(base);
    const isPreferred = /64kbps/i.test(f.format);
    if (!existing || isPreferred) byBase.set(base, f);
  }

  const chapters = Array.from(byBase.values()).sort((a, b) => a.name.localeCompare(b.name));

  return chapters.map((f, i) => ({
    id: `${identifier}-${f.name}`,
    podcastId: `book-${identifier}`,
    podcastTitle: book.title,
    artworkUrl: book.artworkUrl,
    title: f.title || `Capítulo ${i + 1}`,
    description: book.description,
    audioUrl: `https://archive.org/download/${identifier}/${encodeURIComponent(f.name)}`,
    duration: parseRuntime(f.length),
    pubDate: Date.now() - (chapters.length - i) * 1000, // conserva el orden de capítulos
  }));
}

/** Títulos "esenciales" en español que están disponibles en la colección. */
const ESSENTIAL_QUERIES = [
  'Don Quijote',
  'La metamorfosis',
  'Cuentos de Amor de Locura y de Muerte',
  'Crimen y castigo',
  'Monte Cristo',
];

/**
 * Busca los audiolibros esenciales recomendados que están disponibles en el
 * catálogo gratuito en español. Devuelve los que encuentre (máximo uno por
 * título), de mayor a menor duración.
 */
export async function fetchEssentialBooks(): Promise<Audiobook[]> {
  const results = await Promise.allSettled(
    ESSENTIAL_QUERIES.map((q) =>
      searchArchive(
        `collection:(librivoxaudio) AND mediatype:(audio) AND title:(${q})${ES_FILTER}`,
        5,
      ),
    ),
  );

  const seenIds = new Set<string>();
  const out: Audiobook[] = [];
  for (const r of results) {
    if (r.status !== 'fulfilled') continue;
    for (const b of r.value) {
      if (seenIds.has(b.id)) continue;
      seenIds.add(b.id);
      out.push(b);
    }
  }
  // Prioriza obras más grandes pero limita a un número razonable
  out.sort((a, b) => b.totalSeconds - a.totalSeconds);
  return out.slice(0, 10);
}


