import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '../context/PlayerContext';
import { Colors } from '../theme/colors';

/**
 * Controles de reproducción centrales estilo Amazon Music con botones cian.
 */
export default function PlayerControls() {
  const { playing, togglePlay, seekTo, isLoaded, position } = usePlayer();

  return (
    <View style={styles.row}>
      {/* Rebobinar 15 segundos */}
      <TouchableOpacity
        style={[styles.skipBtn, { opacity: isLoaded ? 1 : 0.5 }]}
        onPress={() => seekTo(Math.max(0, position - 15))}
        disabled={!isLoaded}
        activeOpacity={0.7}
      >
        <Ionicons name="refresh-outline" size={28} color={Colors.text} style={styles.reverseIcon} />
        <Text style={styles.skipText}>15</Text>
      </TouchableOpacity>

      {/* Botón Principal de Play / Pause con gradiente premium */}
      <TouchableOpacity
        style={[styles.playButton, { opacity: isLoaded ? 1 : 0.6 }]}
        onPress={togglePlay}
        disabled={!isLoaded}
        testID="play-toggle"
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={[Colors.primaryLight, Colors.primary, Colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.playButtonGradient}
        >
          <Ionicons
            name={playing ? 'pause' : 'play'}
            size={38}
            color="#FFF"
            style={playing ? null : { marginLeft: 4 }}
          />
        </LinearGradient>
      </TouchableOpacity>

      {/* Adelantar 30 segundos */}
      <TouchableOpacity
        style={[styles.skipBtn, { opacity: isLoaded ? 1 : 0.5 }]}
        onPress={() => seekTo(position + 30)}
        disabled={!isLoaded}
        activeOpacity={0.7}
      >
        <Ionicons name="refresh-outline" size={28} color={Colors.text} />
        <Text style={styles.skipText}>30</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    gap: 36,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    overflow: 'hidden',
  },
  playButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reverseIcon: {
    transform: [{ scaleX: -1 }],
  },
  skipText: {
    position: 'absolute',
    color: Colors.text,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
  },
});
