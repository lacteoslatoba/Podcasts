// Modelos de datos de la app de podcasts

export interface Podcast {
  /** ID único, normalmente el id de iTunes o del feed */
  id: string;
  /** Nombre del podcast */
  title: string;
  /** Autor / creador */
  author: string;
  /** Descripción corta */
  description: string;
  /** URL del feed RSS */
  feedUrl: string;
  /** URL de la portada */
  artworkUrl: string;
  /** Año o fecha de publicación del último episodio */
  latestPubDate?: string;
  /** Número de episodios (aprox) */
  trackCount?: number;
}

export interface Episode {
  /** ID único del episodio (guid) o fallback con url */
  id: string;
  /** Podcast al que pertenece */
  podcastId: string;
  /** Nombre del podcast (denormalizado para visualización) */
  podcastTitle: string;
  /** Portada del podcast */
  artworkUrl: string;
  /** Título del episodio */
  title: string;
  /** Descripción / notas del episodio */
  description: string;
  /** URL del audio (enclosure) */
  audioUrl: string;
  /** Duración en segundos (si se conoce) */
  duration: number;
  /** Fecha de publicación (epoc ms) */
  pubDate: number;
}

/** Representa un episodio con estado de reproducción adicional */
export type PlayableEpisode = Episode & {
  /** Posición guardada en segundos */
  progress: number;
  /** Si fue marcado como escuchado */
  played: boolean;
  /** Si está descargado en el dispositivo */
  downloaded: boolean;
  /** URI local si está descargado */
  localUri?: string;
};

/** Código de descarga en curso */
export interface DownloadTask {
  episodeId: string;
  podcastId: string;
  progress: number;
  state: 'downloading' | 'done' | 'error';
}

export interface FetchedEpisode extends Episode {
  /** Duración entera cruda como viene del feed (puede ser segundos o HH:MM:SS) */
  _durationRaw?: string;
}

// ---------- Audiolibros ----------

/** Un género/categoría de audiolibros con sus términos de búsqueda */
export interface AudiobookGenre {
  id: string;
  name: string;
  /** Icono Ionicons para la tarjeta de género */
  icon: string;
  /** Palabras clave para matchear en título/descripción/autor */
  keywords: string[];
  /** Color acento del género */
  color: string;
}

/** Representa un audiolibro (obra completa) desde el catálogo abierto */
export interface Audiobook {
  /** ID interno de LibriVox */
  id: string;
  title: string;
  /** Autor(es) formateados */
  author: string;
  /** Descripción / sinopsis */
  description: string;
  /** URL del feed RSS con los capítulos MP3 */
  rssUrl: string;
  /** URL de la portada */
  artworkUrl: string;
  /** Duración total en segundos */
  totalSeconds: number;
  /** Idioma */
  language: string;
  /** Año de copyright / publicación */
  year: string;
  /** Número de capítulos */
  numSections: number;
}

