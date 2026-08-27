import type { Episode, Podcast } from '../types';

/**
 * Parser XML muy ligero para feeds RSS de podcast.
 * No usa DOM: extrae las secciones <channel> y los <item> usando regex,
 * suficientes para el formato estándar de feeds de podcast (RSS 2.0 + namespace itunes).
 */

function decodeEntities(input: string): string {
  const map: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
  };
  return input
    .replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (m) => {
      const named = map[m];
      if (named) return named;
      if (m.startsWith('&#x')) return String.fromCodePoint(parseInt(m.slice(3, -1), 16));
      if (m.startsWith('&#')) return String.fromCodePoint(parseInt(m.slice(2, -1), 10));
      return m;
    })
    .replace(/&amp;/g, '&'); // doble escape
}

function getTag(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = xml.match(re);
  if (!m || m[1] == null) return '';
  const raw = m[1].trim();
  const cdata = raw.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  if (cdata) return cdata[1].trim();
  return decodeEntities(raw).trim();
}

function getTagAttr(xml: string, tag: string, attr: string): string {
  const re = new RegExp(`<${tag}[^>]*`, 'i');
  const open = xml.match(re);
  if (!open) return '';
  const am = open[0].match(new RegExp(`${attr}\\s*=\\s*["']([^"']*)["']`, 'i'));
  return am ? decodeEntities(am[1]).trim() : '';
}

function stripHtml(input: string): string {
  return input
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Convierte duración de feed (segundos o HH:MM:SS) a segundos */
function parseDuration(raw: string): number {
  const s = raw.trim();
  if (!s) return 0;
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  const parts = s.split(':').map(Number);
  if (parts.some(Number.isNaN)) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

function parseDate(raw: string): number {
  const t = raw ? Date.parse(raw) : NaN;
  return Number.isNaN(t) ? 0 : t;
}

function stableId(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString();
}

/**
 * Obtiene el feed RSS y extrae los episodios.
 * @param feedUrl URL del feed del podcast
 * @returns lista de episodios
 */
export async function fetchEpisodes(
  feedUrl: string,
  podcast: Pick<Podcast, 'id' | 'title' | 'artworkUrl'>,
): Promise<Episode[]> {
  let res: Response;
  try {
    res = await fetch(feedUrl);
  } catch (e) {
    throw new Error('No se pudo descargar el feed. Revisa tu conexión.');
  }
  if (!res.ok) {
    throw new Error(`Error al descargar el feed (${res.status})`);
  }
  const xml = await res.text();

  // Extraer items del feed
  const items: string[] = [];
  const itemRe = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let im;
  while ((im = itemRe.exec(xml)) !== null) {
    items.push(im[1]);
  }

  const episodes: Episode[] = [];
  for (const itemXml of items) {
    const audioUrl =
      getTagAttr(itemXml, 'enclosure', 'url') ||
      getTagAttr(itemXml, 'media:content', 'url');

    if (!audioUrl) continue; // algunos items son anuncios sin audio

    const title = getTag(itemXml, 'title') || 'Episodio sin título';
    const guid = getTag(itemXml, 'guid') || audioUrl;
    const pubDate = parseDate(getTag(itemXml, 'pubDate'));
    const rawDuration =
      getTag(itemXml, 'itunes:duration') || getTag(itemXml, 'duration');
    const description = stripHtml(getTag(itemXml, 'description'));

    episodes.push({
      id: stableId(guid),
      podcastId: podcast.id,
      podcastTitle: podcast.title,
      artworkUrl: podcast.artworkUrl,
      title,
      description,
      audioUrl,
      duration: parseDuration(rawDuration),
      pubDate,
    });
  }

  // Ordenar por fecha descendente (frescos primero)
  episodes.sort((a, b) => b.pubDate - a.pubDate);
  return episodes;
}
