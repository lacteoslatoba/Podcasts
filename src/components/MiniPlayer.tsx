import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '../context/PlayerContext';
import { Colors } from '../theme/colors';
import { progressFraction } from '../utils/format';
import AudioWaveform from './AudioWaveform';

interface Props {
  onPress: () => void;
}

/**
 * Barra Flotante estilo Amazon Music con línea superior Cyan y botón circular brillante.
 */
export default function MiniPlayer({ onPress }: Props) {
  const { current, playing, togglePlay, position, duration } = usePlayer();

  if (!current) return null;

  const fraction = progressFraction(position, duration);
  const artwork = current.episode.artworkUrl;

  return (
    <View style={styles.floatingWrapper}>
      <TouchableOpacity
        style={styles.capsule}
        activeOpacity={0.85}
        onPress={onPress}
      >
        {/* Fondo con gradiente premium */}
        <LinearGradient
          colors={[Colors.surface, Colors.surfaceElevated]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.capsuleBg}
        />
        {/* Barra superior de progreso cian estilo Amazon Music */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${fraction * 100}%` }]} />
        </View>

        <View style={styles.content}>
          {/* Cover Art con esquinas cuadradas suavizadas (8px) */}
          <View style={styles.artworkContainer}>
            {artwork ? (
              <Image source={{ uri: artwork }} style={styles.artwork} resizeMode="cover" />
            ) : (
              <View style={[styles.artwork, styles.artworkFallback]}>
                <Ionicons name="mic" size={20} color={Colors.primary} />
              </View>
            )}
          </View>

          {/* Información del episodio */}
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>
              {current.episode.title}
            </Text>
            <View style={styles.subRow}>
              <Text style={styles.podcast} numberOfLines={1}>
                {current.episode.podcastTitle}
              </Text>
            </View>
          </View>

          {/* Indicador de ecualizador */}
          {playing && (
            <View style={styles.waveformWrap}>
              <AudioWaveform isPlaying={playing} barCount={4} height={16} barWidth={2} color={Colors.primaryLight} />
            </View>
          )}

          {/* Botón circular de Play/Pause cian Amazon */}
          <TouchableOpacity
            style={styles.playBtn}
            onPress={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            testID="mini-play"
          >
            <Ionicons name={playing ? 'pause' : 'play'} size={20} color="#FFF" style={playing ? null : { marginLeft: 2 }} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingWrapper: {
    paddingHorizontal: 12,
    paddingBottom: 6,
  },
  capsule: {
    backgroundColor: 'transparent',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderGlow,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  capsuleBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%',
  },
  progressFill: {
    height: 3,
    backgroundColor: Colors.primary,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  artworkContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  artwork: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  artworkFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  info: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  title: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  podcast: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  waveformWrap: {
    marginRight: 8,
    justifyContent: 'center',
  },
  playBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
});
