import type { Podcast } from '../types';

/**
 * Charts en vivo de Apple Podcasts. Usa el endpoint clásico
 * itunes.apple.com/{country}/rss/toppodcasts (a diferencia de
 * rss.marketingtools.apple.com, este sí envía CORS abierto,
 * por lo que funciona también en Expo Web, no solo en nativo).
 */
const CHART_URL = (country: string, limit: number) =>
  `https://itunes.apple.com/${country}/rss/toppodcasts/limit=${limit}/json`;

const LOOKUP_URL = 'https://itunes.apple.com/lookup';

interface ChartEntry {
  'im:name': { label: string };
  'im:artist': { label: string };
  'im:image': { label: string }[];
  id: { attributes: { 'im:id': string } };
}

interface LookupResult {
  collectionId: number;
  feedUrl?: string;
  trackCount?: number;
  releaseDate?: string;
}

function higherRes(url: string): string {
  return url.replace(/\/\d+x\d+bb\.(jpg|png)$/i, '/600x600bb.$1');
}

/**
 * Trae el top de podcasts de un país y resuelve sus feedUrl reales
 * (el chart trae metadata de catálogo, pero no el RSS del propio podcast).
 */
export async function fetchTopPodcasts(country = 'mx', limit = 30): Promise<Podcast[]> {
  const chartRes = await fetch(CHART_URL(country, limit));
  if (!chartRes.ok) throw new Error(`Error al obtener el top (${chartRes.status})`);
  const chartData = await chartRes.json();
  const entries: ChartEntry[] = chartData?.feed?.entry ?? [];
  if (entries.length === 0) return [];

  const ids = entries.map((e) => e.id.attributes['im:id']);
  const lookupRes = await fetch(`${LOOKUP_URL}?id=${ids.join(',')}&entity=podcast`);
  if (!lookupRes.ok) throw new Error(`Error al resolver feeds (${lookupRes.status})`);
  const lookupData = await lookupRes.json();
  const byId = new Map<string, LookupResult>(
    (lookupData?.results ?? []).map((r: LookupResult) => [String(r.collectionId), r]),
  );

  const podcasts: Podcast[] = [];
  for (const entry of entries) {
    const id = entry.id.attributes['im:id'];
    const meta = byId.get(id);
    if (!meta?.feedUrl) continue; // sin feed resoluble, se descarta
    const artwork = entry['im:image']?.[entry['im:image'].length - 1]?.label ?? '';
    podcasts.push({
      id,
      title: entry['im:name'].label,
      author: entry['im:artist'].label,
      description: '',
      feedUrl: meta.feedUrl,
      artworkUrl: higherRes(artwork),
      latestPubDate: meta.releaseDate,
      trackCount: meta.trackCount,
    });
  }
  return podcasts;
}
