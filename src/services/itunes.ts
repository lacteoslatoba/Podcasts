import type { Podcast } from '../types';
import { fetchTopPodcasts } from './charts';

/** Resultado de búsqueda de la API de iTunes */
interface ItunesResult {
  wrapperType: string;
  kind: string;
  collectionId: number;
  trackId: number;
  collectionName: string;
  trackName: string;
  artistName?: string;
  collectionCensoredName?: string;
  collectionArtistName?: string;
  artworkUrl60?: string;
  artworkUrl100?: string;
  artworkUrl600?: string;
  feedUrl?: string;
  trackCount?: number;
  releaseDate?: string;
  primaryGenreName?: string;
  genres?: string[];
}

interface ItunesResponse {
  resultCount: number;
  results: ItunesResult[];
}

const SEARCH_URL = 'https://itunes.apple.com/search';

/** Devuelve una URL de portada de mayor resolución */
function higherResArtwork(url?: string): string {
  if (!url) return '';
  return url.replace('600x600', '1200x1200').replace('100x100', '200x200');
}

/** Busca podcasts por nombre/término en el catálogo de iTunes */
export async function searchPodcasts(term: string, country = 'US'): Promise<Podcast[]> {
  if (!term.trim()) return [];
  const params = new URLSearchParams({
    term: term.trim(),
    media: 'podcast',
    limit: '40',
    country,
  });
  const url = `${SEARCH_URL}?${params.toString()}`;

  let res: Response;
  try {
    res = await fetch(url);
  } catch (e) {
    throw new Error('No se pudo contactar el catálogo. Revisa tu conexión.');
  }
  if (!res.ok) {
    throw new Error(`Error del catálogo (${res.status})`);
  }

  const data: ItunesResponse = await res.json();
  const seen = new Set<string>();
  const list: Podcast[] = [];

  for (const r of data.results) {
    if (!r.feedUrl) continue;
    const id = String(r.collectionId ?? r.trackId ?? r.feedUrl);
    if (seen.has(id)) continue;
    seen.add(id);
    list.push({
      id,
      title: r.collectionName ?? r.trackName ?? 'Sin nombre',
      author: r.artistName ?? r.collectionArtistName ?? 'Autor desconocido',
      description: '',
      feedUrl: r.feedUrl,
      artworkUrl: higherResArtwork(r.artworkUrl100 ?? r.artworkUrl600 ?? ''),
      latestPubDate: r.releaseDate,
      trackCount: r.trackCount,
    });
  }
  return list;
}

/** Países hispanohablantes para los que buscamos "lo más actual" en podcasts */
const SPANISH_COUNTRIES = ['mx', 'es', 'ar', 'co', 'cl'];

/**
 * Trae podcasts "al día" combinando los tops de varios países hispanohablantes
 * (México, España, Argentina, Colombia, Chile) y eliminando duplicados.
 * Devuelve una lista variada y siempre actualizada.
 */
export async function fetchLatestPodcasts(limitPerCountry = 25): Promise<Podcast[]> {
  const all = await Promise.allSettled(
    SPANISH_COUNTRIES.map((country) => fetchTopPodcasts(country, limitPerCountry)),
  );

  const seenIds = new Set<string>();
  const result: Podcast[] = [];

  for (const r of all) {
    if (r.status !== 'fulfilled') continue;
    for (const p of r.value) {
      if (seenIds.has(p.id) || p.title.toUpperCase().includes('RADIO')) continue;
      seenIds.add(p.id);
      result.push(p);
      if (result.length >= 60) break; // capa razonable pero amplia
    }
    if (result.length >= 60) break;
  }

  return result;
}
