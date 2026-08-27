import React, { useRef } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SPEEDS, usePlayer } from '../context/PlayerContext';
import PlayerControls from '../components/PlayerControls';
import AudioWaveform from '../components/AudioWaveform';
import { Colors } from '../theme/colors';
import { formatTime, progressFraction } from '../utils/format';

/**
 * Reproductor a pantalla completa al estilo Amazon Music (Navy Slate & Resplandor Teal Radial).
 */
export default function PlayerScreen() {
  const {
    current,
    playing,
    position,
    duration,
    rate,
    seekTo,
    setRate,
    markAsPlayed,
    isLoaded,
  } = usePlayer();

  const trackWidthRef = useRef<number>(1);

  if (!current) {
    return (
      <View style={[styles.container, styles.center]}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="headset-outline" size={60} color={Colors.primaryLight} />
        </View>
        <Text style={styles.emptyTitle}>Nada en reproducción</Text>
        <Text style={styles.emptyText}>Selecciona un episodio para comenzar a escuchar</Text>
      </View>
    );
  }

  const ep = current.episode;
  const isLive = ep.podcastId === 'radio';
  const fraction = progressFraction(position, duration);
  const artwork = ep.artworkUrl;

  return (
    <View style={styles.container}>
      {/* Fondo con gradiente premium (halo teal arriba → negro abajo) */}
      <LinearGradient
        colors={[
          'rgba(0,168,225,0.16)',
          Colors.background,
          Colors.background,
          '#000000',
        ]}
        locations={[0, 0.35, 0.7, 1]}
        style={styles.bgGradient}
        pointerEvents="none"
      />
      <ScrollView contentContainerStyle={styles.scrollContent} style={styles.scroll}>
      {/* Portada Amazon Music con Resplandor Teal Radial */}
      <View style={styles.artworkSection}>
        <View style={styles.glowBackdrop} />
        <View style={styles.artworkWrap}>
          {artwork ? (
            <Image source={{ uri: artwork }} style={styles.artwork} resizeMode="cover" />
          ) : (
            <View style={[styles.artwork, styles.artworkFallback]}>
              <Ionicons name="mic" size={80} color={Colors.primary} />
            </View>
          )}
        </View>
      </View>

      {/* Título del Episodio y Nombre de Podcast estilo Amazon */}
      <View style={styles.textWrap}>
        <Text style={styles.title} numberOfLines={2}>
          {ep.title}
        </Text>
        <Text style={styles.podcast} numberOfLines={1}>
          {ep.podcastTitle}
        </Text>
      </View>

      {/* Ecualizador animado */}
      <AudioWaveform isPlaying={playing} barCount={22} height={40} barWidth={4} color={Colors.primaryLight} />

      {/* Barra de progreso Cian Amazon y Seek (o insignia EN VIVO para radios) */}
      {isLive ? (
        <View style={styles.liveBadgeWrap}>
          <View style={styles.liveDot} />
          <Text style={styles.liveBadgeText}>EN VIVO</Text>
        </View>
      ) : (
        <View style={styles.seekArea}>
          <View
            style={styles.track}
            onLayout={(ev) => (trackWidthRef.current = ev.nativeEvent.layout.width)}
          >
            <View style={[styles.fill, { width: `${fraction * 100}%` }]} />
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              onPress={(ev) => {
                const x = ev.nativeEvent.locationX;
                const w = trackWidthRef.current || 1;
                seekTo((x / w) * Math.max(1, duration));
              }}
            />
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.time}>{formatTime(position)}</Text>
            <Text style={styles.time}>{isLoaded ? formatTime(duration) : '…'}</Text>
          </View>
        </View>
      )}

      {/* Controles Centrales estilo Amazon */}
      <PlayerControls />

      {/* Píldoras de Velocidad y Estado */}
      <View style={styles.bottomRow}>
        <SpeedControl rate={rate} setRate={setRate} />

        <TouchableOpacity
          style={[styles.actionPill, ep.played && styles.actionPillActive]}
          onPress={markAsPlayed}
          disabled={!isLoaded}
        >
          <Ionicons
            name={ep.played ? 'checkmark-circle' : 'checkmark-circle-outline'}
            size={18}
            color={ep.played ? Colors.accentGreen : Colors.textSecondary}
          />
          <Text style={[styles.actionPillText, ep.played && styles.actionPillTextActive]}>
            {ep.played ? 'Escuchado' : 'Marcar visto'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </View>
  );
}

function SpeedControl({ rate, setRate }: { rate: number; setRate: (r: number) => void }) {
  const cycle = () => {
    const SPEEDS = [1, 1.25, 1.5, 2];
    const idx = SPEEDS.indexOf(rate);
    const next = idx >= 0 ? SPEEDS[(idx + 1) % SPEEDS.length] : 1;
    setRate(next);
  };
  const label = `${rate.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}×`;

  return (
    <TouchableOpacity style={styles.actionPill} onPress={cycle}>
      <Ionicons name="speedometer-outline" size={18} color={Colors.primaryLight} />
      <Text style={styles.actionPillText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  bgGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderGlow,
    marginBottom: 20,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  artworkSection: {
    alignItems: 'center',
    marginVertical: 12,
  },
  glowBackdrop: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: Colors.primary,
    opacity: 0.25,
    top: 20,
  },
  artworkWrap: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderGlow,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
    overflow: 'hidden',
  },
  artwork: {
    width: 270,
    height: 270,
  },
  artworkFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceElevated,
  },
  textWrap: {
    marginTop: 16,
    alignItems: 'center',
  },
  title: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  podcast: {
    color: Colors.primaryLight,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 6,
  },
  seekArea: {
    marginTop: 16,
  },
  liveBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 71, 87, 0.15)',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accentRose,
  },
  liveBadgeText: {
    color: Colors.accentRose,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  fill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  time: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionPillActive: {
    borderColor: Colors.accentGreen,
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
  },
  actionPillText: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  actionPillTextActive: {
    color: Colors.accentGreen,
  },
});
