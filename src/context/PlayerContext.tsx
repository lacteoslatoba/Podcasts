import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';
import type { PlayableEpisode } from '../types';
import {
  saveProgress,
  resetProgress,
  type ProgressEntry,
} from '../services/storage';

// Velocidades de reproducción disponibles
export const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2];

export interface CurrentTrack {
  episode: PlayableEpisode;
  /** Si se reproduce desde un archivo local descargado */
  localUri?: string;
}

type PlayerContextType = {
  current: CurrentTrack | null;
  playing: boolean;
  position: number;
  duration: number;
  rate: number;
  isBuffering: boolean;
  isLoaded: boolean;
  playEpisode: (episode: PlayableEpisode, opts?: { autoPlay?: boolean; localUri?: string }) => void;
  togglePlay: () => void;
  seekTo: (seconds: number) => void;
  setRate: (rate: number) => void;
  cycleRate: () => void;
  markAsPlayed: () => void;
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

function getSourceForEpisode(episode: PlayableEpisode, localUri?: string) {
  const uri = localUri ?? episode.localUri ?? episode.audioUrl;
  return uri ? { uri } : null;
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  // El player se crea sin fuente; se carga mediante replace()
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);

  const [current, setCurrent] = useState<CurrentTrack | null>(null);
  const [rate, setRateState] = useState(1);
  const currentRef = useRef<CurrentTrack | null>(null);
  const rateRef = useRef(1);

  currentRef.current = current;
  rateRef.current = rate;

  // Configura el modo de audio (reproducción en background) al montar
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    }).catch(() => {});
  }, []);

  // Guardar el progreso periódicamente mientras suena y al terminar
  useEffect(() => {
    if (!current) return;
    const ep = current.episode;
    const pos = status?.currentTime ?? 0;
    if (pos <= 0) return;

    const entry: ProgressEntry = {
      episodeId: ep.id,
      podcastId: ep.podcastId,
      position: pos,
      duration: status?.duration ?? ep.duration ?? 0,
      played: false,
      updatedAt: Date.now(),
    };
    saveProgress(entry).catch(() => {});
  }, [status, current]);

  // Marcar como escuchado al finalizar
  useEffect(() => {
    if (status?.didJustFinish && currentRef.current) {
      const ep = currentRef.current.episode;
      saveProgress({
        episodeId: ep.id,
        podcastId: ep.podcastId,
        position: 0,
        duration: status?.duration ?? ep.duration ?? 0,
        played: true,
        updatedAt: Date.now(),
      }).catch(() => {});
    }
  }, [status?.didJustFinish]);



  const playEpisode = useCallback(
    (episode: PlayableEpisode, opts?: { autoPlay?: boolean; localUri?: string }) => {
      const source = getSourceForEpisode(episode, opts?.localUri);
      if (source) {
        try {
          player.replace(source);
        } catch (e) {
          console.warn('Player replace failed', e);
        }
      }
      setCurrent({ episode, localUri: opts?.localUri ?? episode.localUri });
      setRateState(rateRef.current);

      // Controles en pantalla de bloqueo
      try {
        player.setActiveForLockScreen(true, {
          title: episode.title,
          artist: episode.podcastTitle,
          artworkUrl: episode.artworkUrl || undefined,
          albumTitle: episode.podcastTitle,
        });
      } catch (e) {
        console.warn('lock screen metadata failed', e);
      }

      const shouldAuto = opts?.autoPlay !== false;
      if (shouldAuto) {
        setTimeout(() => {
          try {
            player.play();
          } catch (e) {
            console.warn('play failed', e);
          }
        }, 250);
      }
    },
    [player],
  );


  const togglePlay = useCallback(() => {
    try {
      if (player.playing) {
        player.pause();
      } else {
        player.play();
      }
    } catch (e) {
      console.warn('toggle play failed', e);
    }
  }, [player]);

  const seekTo = useCallback(
    (seconds: number) => {
      try {
        player.seekTo(Math.max(0, seconds));
      } catch (e) {
        console.warn('seek failed', e);
      }
    },
    [player],
  );

  const setRate = useCallback(
    (r: number) => {
      setRateState(r);
      try {
        player.setPlaybackRate(r);
      } catch (e) {
        console.warn('set rate failed', e);
      }
    },
    [player],
  );

  const cycleRate = useCallback(() => {
    setRate(nextSpeed(rateRef.current));
  }, [setRate]);


  const markAsPlayed = useCallback(() => {
    const ec = currentRef.current;
    if (!ec) return;
    resetProgress(ec.episode.id).catch(() => {});
    player.pause();
  }, [player]);

  const value = useMemo<PlayerContextType>(
    () => ({
      current,
      playing: !!status?.playing,
      position: status?.currentTime ?? 0,
      duration: status?.duration ?? current?.episode.duration ?? 0,
      rate,
      isBuffering: !!status?.isBuffering,
      isLoaded: !!status?.isLoaded,
      playEpisode,
      togglePlay,
      seekTo,
      setRate,
      cycleRate,
      markAsPlayed,
    }),
    [current, status, rate, playEpisode, togglePlay, seekTo, setRate, cycleRate, markAsPlayed],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

function nextSpeed(current: number): number {
  const idx = SPEEDS.indexOf(current);
  return idx >= 0 ? SPEEDS[(idx + 1) % SPEEDS.length] : 1;
}

export function usePlayer(): PlayerContextType {
  const ctx = useContext(PlayerContext);
  if (!ctx) {
    throw new Error('usePlayer debe usarse dentro de <PlayerProvider>');
  }
  return ctx;
}

