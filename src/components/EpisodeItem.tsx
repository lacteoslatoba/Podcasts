import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PlayableEpisode } from '../types';
import { Colors } from '../theme/colors';
import { formatDate, formatDuration, progressFraction } from '../utils/format';
import { downloadEpisode, deleteDownload } from '../services/downloads';
import { hydrateEpisodes } from '../services/storage';

interface Props {
  episode: PlayableEpisode;
  onPlay: (ep: PlayableEpisode) => void;
  showProgress?: boolean;
}

/**
 * Fila de episodio estilo Amazon Music con reproducción rápida y botón cian.
 */
export default function EpisodeItem({ episode, onPlay, showProgress = true }: Props) {
  const [downloading, setDownloading] = useState<number | null>(null);
  const [current, setCurrent] = useState(episode);

  const fraction = progressFraction(current.progress, current.duration || episode.duration);

  const handlePlay = () => onPlay(current);

  const handleDownload = async () => {
    if (current.downloaded) {
      await deleteDownload(episode.id);
      const refreshed = (await hydrateEpisodes([episode]))[0];
      setCurrent(refreshed);
      return;
    }
    setDownloading(0);
    try {
      await downloadEpisode(episode, (f) => setDownloading(f));
      const refreshed = (await hydrateEpisodes([episode]))[0];
      setCurrent(refreshed);
    } catch (e) {
      console.warn('download error', e);
    } finally {
      setDownloading(null);
    }
  };

  const isDownloading = downloading !== null;

  return (
    <View style={styles.wrap}>
      <TouchableOpacity style={styles.container} onPress={handlePlay} activeOpacity={0.8}>
        {/* Botón de reproducción lateral cian */}
        <View style={styles.playCircle}>
          <Ionicons name="play" size={16} color={Colors.primaryLight} style={{ marginLeft: 2 }} />
        </View>

        <View style={styles.main}>
          <Text
            style={[styles.title, current.played && styles.playedTitle]}
            numberOfLines={2}
          >
            {current.title}
          </Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{formatDate(current.pubDate)}</Text>
            {current.duration ? (
              <View style={styles.durationPill}>
                <Ionicons name="time-outline" size={11} color={Colors.textSecondary} />
                <Text style={styles.durationText}>{formatDuration(current.duration)}</Text>
              </View>
            ) : null}
            {current.played && (
              <View style={styles.playedTag}>
                <Ionicons name="checkmark-circle" size={12} color={Colors.accentGreen} />
                <Text style={styles.playedText}>Escuchado</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.right}>
          {isDownloading ? (
            <View style={styles.downloadingWrap}>
              {downloading !== null && downloading < 1 && (
                <Text style={styles.downloadingText}>{Math.round((downloading || 0) * 100)}%</Text>
              )}
              <Ionicons name="cloud-download" size={20} color={Colors.primaryLight} />
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleDownload}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.dlBtn}
            >
              <Ionicons
                name={current.downloaded ? 'checkmark-circle' : 'arrow-down-circle-outline'}
                size={22}
                color={current.downloaded ? Colors.accentGreen : Colors.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>

      {showProgress && fraction > 0 && (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${fraction * 100}%` }]} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    marginHorizontal: 16,
    marginVertical: 5,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: Colors.borderGlow,
  },
  main: {
    flex: 1,
    paddingRight: 10,
  },
  title: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  playedTitle: {
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    flexWrap: 'wrap',
    gap: 8,
  },
  metaText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  durationText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  playedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  playedText: {
    color: Colors.accentGreen,
    fontSize: 11,
    fontWeight: '600',
  },
  right: {
    alignItems: 'center',
  },
  dlBtn: {
    padding: 4,
  },
  downloadingWrap: {
    alignItems: 'center',
  },
  downloadingText: {
    color: Colors.primaryLight,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  progressTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  progressFill: {
    height: 3,
    backgroundColor: Colors.primary,
  },
});
