import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Podcast, PlayableEpisode } from '../types';

// Claves de almacenamiento
const KEY_SUBSCRIPTIONS = 'podcasts_subscriptions';
const KEY_PROGRESS = 'podcasts_progress';
const KEY_DOWNLOADS = 'podcasts_downloads';

/** Podcasts destacados por defecto estilo Amazon Music */
export const SEED_PODCASTS: Podcast[] = [
  {
    id: '1458792155',
    title: 'La Cotorrisa',
    author: 'La Cotorrisa Podcast',
    description: 'Ricardo Pérez y Slobotzky se sientan a chismear sobre noticias extrañas, datos curiosos y anécdotas.',
    feedUrl: 'https://feeds.simplecast.com/xE9e0As4',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts221/v4/60/ec/9a/60ec9a66-b29d-ab08-f257-be1a69ba4cc5/mza_14695168599780731050.jpeg/600x600bb.jpg',
    trackCount: 250,
  },
  {
    id: '1229124446',
    title: 'Entiende Tu Mente',
    author: 'Molo Cebrián',
    description: 'El podcast de psicología en español más escuchado del mundo.',
    feedUrl: 'https://feeds.acast.com/public/shows/69779e4cf4b515342e3b249c',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts211/v4/c4/e0/b4/c4e0b43a-888d-c267-6a85-3f0cb5bbd911/mza_4665026146816110789.jpg/600x600bb.jpg',
    trackCount: 310,
  },
  {
    id: '1390637332',
    title: 'Despeja la X (by Xataka)',
    author: 'Xataka',
    description: 'El podcast semanal de tecnología y cultura digital de Xataka.',
    feedUrl: 'https://feeds.ivoox.com/feed_fg_f1579492_filtro_1.xml',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts125/v4/ef/03/9c/ef039ccb-ad03-0512-8aaa-adee78720252/mza_8549912987460630776.jpg/600x600bb.jpg',
    trackCount: 180,
  },
  {
    id: '665143133',
    title: 'Nadie Sabe Nada',
    author: 'SER Podcast',
    description: 'Improvisación y humor con Andreu Buenafuente y Berto Romero.',
    feedUrl: 'https://fapi-top.prisasd.com/podcast/playser/nadie_sabe_nada/itunestfp/podcast.xml',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts221/v4/60/f1/95/60f19580-54c2-cad7-7180-1210e04531d2/mza_940870946245686152.jpeg/600x600bb.jpg',
    trackCount: 420,
  },
  {
    id: '1549358657',
    title: 'Criminopatía',
    author: 'Clara Tiscar',
    description: 'Casos reales de crimen contados con rigor periodístico y mucho detalle.',
    feedUrl: 'https://feeds.megaphone.fm/ASCCT6415418901',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts211/v4/fa/4f/a8/fa4fa872-18f8-136b-29e2-bf1d3ed8d81c/mza_5100316931390661597.jpg/600x600bb.jpg',
    trackCount: 90,
  },
  {
    id: '1146392357',
    title: 'El Partidazo de COPE',
    author: 'COPE',
    description: 'El programa deportivo nocturno más escuchado de España.',
    feedUrl: 'https://www.cope.es/api/es/programas/el-partidazo-de-cope/audios/rss.xml',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts221/v4/2b/ff/79/2bff79dc-47a2-c0aa-3c3e-6bffb9ad05fa/mza_1324441205997066202.jpeg/600x600bb.jpg',
    trackCount: 500,
  },
  {
    id: '1708795937',
    title: 'Deforme Semanal Ideal Total',
    author: 'Deforme Semanal',
    description: 'Cultura, cine, música y actualidad con un humor único.',
    feedUrl: 'https://feeds.megaphone.fm/GLT2495885586',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts221/v4/4a/4e/81/4a4e8144-8ff1-4bdb-cfd2-70b3ad89ecd4/mza_18224647083770366725.jpeg/600x600bb.jpg',
    trackCount: 150,
  },
  {
    id: '1438215792',
    title: 'El Faro',
    author: 'SER Podcast',
    description: 'La actualidad informativa de la noche, con Àngels Barceló.',
    feedUrl: 'https://fapi-top.prisasd.com/api/v2/feed-rss/playser/el-faro/itunestfp',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts122/v4/7c/b8/5b/7cb85bea-3695-bcfe-21f4-e6faea49a6e0/mza_2647442302226878905.jpeg/600x600bb.jpg',
    trackCount: 600,
  },
];

/** Progresa guardado de un episodio */
export type ProgressEntry = {
  episodeId: string;
  podcastId: string;
  position: number;
  duration: number;
  played: boolean;
  updatedAt: number;
};

/** Descarga guardada */
export type DownloadEntry = {
  episodeId: string;
  podcastId: string;
  localUri: string;
  downloadedAt: number;
  title?: string;
  duration?: number;
};

/** Estado persistido de un episodio dentro de una lista */
export interface EpisodeState {
  position: number;
  duration: number;
  played: boolean;
}

// ---------- Suscripciones ----------

export async function getSubscriptions(): Promise<Podcast[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY_SUBSCRIPTIONS);
    if (!raw) {
      // Guardar lista semilla inicial para que la app se abra con varios podcasts estilo Amazon Music
      await saveSubscriptions(SEED_PODCASTS);
      return SEED_PODCASTS;
    }
    const parsed = JSON.parse(raw) as Podcast[];
    if (parsed.length === 0) {
      await saveSubscriptions(SEED_PODCASTS);
      return SEED_PODCASTS;
    }
    return parsed;
  } catch (e) {
    return SEED_PODCASTS;
  }
}

export async function saveSubscriptions(list: Podcast[]): Promise<void> {
  await AsyncStorage.setItem(KEY_SUBSCRIPTIONS, JSON.stringify(list));
}

export async function isSubscribed(id: string): Promise<boolean> {
  const list = await getSubscriptions();
  return list.some((p) => p.id === id);
}

// ---------- Progreso de episodios ----------

export async function getProgressMap(): Promise<Record<string, ProgressEntry>> {
  try {
    const raw = await AsyncStorage.getItem(KEY_PROGRESS);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, ProgressEntry>;
  } catch (e) {
    return {};
  }
}

export async function saveProgress(entry: ProgressEntry): Promise<void> {
  const map = await getProgressMap();
  map[entry.episodeId] = entry;
  await AsyncStorage.setItem(KEY_PROGRESS, JSON.stringify(map));
}

export async function resetProgress(episodeId: string): Promise<void> {
  const map = await getProgressMap();
  const entry = map[episodeId];
  if (entry) {
    entry.position = 0;
    entry.played = false;
    await AsyncStorage.setItem(KEY_PROGRESS, JSON.stringify(map));
  }
}

export async function collectProgress(
  episodes: { id: string }[],
): Promise<Record<string, EpisodeState>> {
  const map = await getProgressMap();
  const out: Record<string, EpisodeState> = {};
  for (const ep of episodes) {
    const e = map[ep.id];
    if (e) {
      out[ep.id] = { position: e.position, duration: e.duration, played: e.played };
    }
  }
  return out;
}

// ---------- Descargas ----------

export async function getDownloadMap(): Promise<Record<string, DownloadEntry>> {
  try {
    const raw = await AsyncStorage.getItem(KEY_DOWNLOADS);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, DownloadEntry>;
  } catch (e) {
    return {};
  }
}

export async function setDownload(entry: DownloadEntry): Promise<void> {
  const map = await getDownloadMap();
  map[entry.episodeId] = entry;
  await AsyncStorage.setItem(KEY_DOWNLOADS, JSON.stringify(map));
}

export async function removeDownload(episodeId: string): Promise<void> {
  const map = await getDownloadMap();
  delete map[episodeId];
  await AsyncStorage.setItem(KEY_DOWNLOADS, JSON.stringify(map));
}

export async function getLocalUri(episodeId: string): Promise<string | null> {
  const map = await getDownloadMap();
  return map[episodeId]?.localUri ?? null;
}

export async function hydrateEpisodes(
  episodes: PlayableEpisode[],
): Promise<PlayableEpisode[]> {
  const [progress, downloads] = await Promise.all([
    getProgressMap(),
    getDownloadMap(),
  ]);
  return episodes.map((ep) => {
    const p = progress[ep.id];
    const d = downloads[ep.id];
    return {
      ...ep,
      progress: p?.position ?? 0,
      played: p?.played ?? false,
      downloaded: !!d,
      localUri: d?.localUri,
    };
  });
}

export async function clearProgressForPodcast(podcastId: string): Promise<void> {
  const map = await getProgressMap();
  let changed = false;
  for (const key of Object.keys(map)) {
    if (map[key].podcastId === podcastId) {
      delete map[key];
      changed = true;
    }
  }
  if (changed) {
    await AsyncStorage.setItem(KEY_PROGRESS, JSON.stringify(map));
  }
}
