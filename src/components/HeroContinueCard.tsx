import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '../context/PlayerContext';
import { Colors } from '../theme/colors';
import { formatTime, progressFraction } from '../utils/format';

interface Props {
  onPress: () => void;
}

/**
 * Tarjeta destacada al estilo Amazon Music Podcasts.
 */
export default function HeroContinueCard({ onPress }: Props) {
  const { current, playing, togglePlay, position, duration } = usePlayer();

  if (!current) return null;

  const ep = current.episode;
  const fraction = progressFraction(position, duration);
  const remaining = duration > position ? duration - position : 0;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={onPress}
    >
      <View style={styles.badgeRow}>
        <View style={styles.liveTag}>
          <View style={styles.pulseDot} />
          <Text style={styles.liveTagText}>CONTINUAR ESCUCHANDO</Text>
        </View>
        <Text style={styles.remainingText}>{formatTime(remaining)} restantes</Text>
      </View>

      <View style={styles.mainRow}>
        {ep.artworkUrl ? (
          <Image source={{ uri: ep.artworkUrl }} style={styles.artwork} resizeMode="cover" />
        ) : (
          <View style={[styles.artwork, styles.artworkFallback]}>
            <Ionicons name="mic" size={24} color={Colors.primaryLight} />
          </View>
        )}

        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>
            {ep.title}
          </Text>
          <Text style={styles.podcast} numberOfLines={1}>
            {ep.podcastTitle}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.playBtn}
          onPress={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          activeOpacity={0.8}
        >
          <Ionicons
            name={playing ? 'pause' : 'play'}
            size={24}
            color="#FFF"
            style={playing ? null : { marginLeft: 2 }}
          />
        </TouchableOpacity>
      </View>

      {/* Barra de progreso inferior Cian Amazon */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${fraction * 100}%` }]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderGlow,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    overflow: 'hidden',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 168, 225, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.primaryLight,
  },
  liveTagText: {
    color: Colors.primaryLight,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  remainingText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  artwork: {
    width: 54,
    height: 54,
    borderRadius: 10,
  },
  artworkFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  info: {
    flex: 1,
    marginLeft: 12,
    marginRight: 10,
  },
  title: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  podcast: {
    color: Colors.primaryLight,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  playBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  progressTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  progressFill: {
    height: 4,
    backgroundColor: Colors.primary,
  },
});
