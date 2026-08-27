import { Directory, File, Paths } from 'expo-file-system';
import type { Episode } from '../types';
import {
  getLocalUri,
  removeDownload,
  setDownload,
} from './storage';

/**
 * Directorio donde se guardan los episodios descargados (offline).
 */
function getDownloadsDir(): Directory {
  return new Directory(Paths.document, 'podcast-downloads');
}

function ensureDir(dir: Directory): void {
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
}

/** Construye un nombre de archivo seguro a partir del id del episodio */
function safeFileName(episodeId: string, audioUrl: string): string {
  let ext = '.mp3';
  const m = audioUrl.match(/\.(mp3|m4a|mp4|aac|ogg|wav|opus|webm)(\?|$)/i);
  if (m) ext = `.${m[1].toLowerCase()}`;
  return `${episodeId}${ext}`;
}

export interface DownloadResult {
  localUri: string;
}

/**
 * Descarga un episodio al almacenamiento local para reproducción offline.
 * @param episode el episodio a descargar
 * @param onProgress callback opcional de progreso (0..1)
 */
export async function downloadEpisode(
  episode: Episode,
  onProgress?: (fraction: number) => void,
): Promise<DownloadResult> {
  const existing = await getLocalUri(episode.id);
  if (existing) {
    const file = new File(existing);
    if (file.exists) {
      return { localUri: existing };
    }
  }

  const dir = getDownloadsDir();
  ensureDir(dir);

  const fileName = safeFileName(episode.id, episode.audioUrl);
  const dest = new File(dir, fileName);

  let lastReport = 0;
  const file = await File.downloadFileAsync(episode.audioUrl, dest, {
    idempotent: true,
    onProgress: ({ bytesWritten, totalBytes }) => {
      if (totalBytes > 0 && onProgress) {
        // Evitar demasiadas actualizaciones
        const fraction = bytesWritten / totalBytes;
        if (fraction - lastReport > 0.01 || fraction >= 1) {
          lastReport = fraction;
          onProgress(fraction);
        }
      }
    },
  });

  await setDownload({
    episodeId: episode.id,
    podcastId: episode.podcastId,
    localUri: file.uri,
    downloadedAt: Date.now(),
    title: episode.title,
    duration: episode.duration,
  });

  onProgress?.(1);
  return { localUri: file.uri };
}

/**
 * Elimina un episodio descargado del dispositivo.
 */
export async function deleteDownload(episodeId: string): Promise<void> {
  const uri = await getLocalUri(episodeId);
  if (uri) {
    try {
      const file = new File(uri);
      if (file.exists) {
        file.delete();
      }
    } catch (e) {
      // ignorar errores de borrado
    }
  }
  await removeDownload(episodeId);
}
