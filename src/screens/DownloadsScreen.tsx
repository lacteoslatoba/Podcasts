import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, type NavigationProp } from '@react-navigation/native';
import type { PlayableEpisode, Podcast } from '../types';
import { getSubscriptions, getProgressMap, getDownloadMap } from '../services/storage';
import { usePlayer } from '../context/PlayerContext';
import EpisodeItem from '../components/EpisodeItem';
import { Colors } from '../utils/format';
import type { RootStackParamList } from '../navigation';

type Nav = NavigationProp<RootStackParamList>;

/**
 * Pantalla de descargas: episodios disponibles sin conexión.
 */
export default function DownloadsScreen() {
  const navigation = useNavigation<Nav>();
  const { playEpisode } = usePlayer();
  const [items, setItems] = useState<PlayableEpisode[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const downloads = await getDownloadMap();
      const progress = await getProgressMap();
      const subs = await getSubscriptions();

      const enriched: PlayableEpisode[] = [];
      for (const d of Object.values(downloads)) {
        const prog = progress[d.episodeId];
        const podcast: Podcast | undefined = subs.find((p) => p.id === d.podcastId);
        enriched.push({
          id: d.episodeId,
          podcastId: d.podcastId,
          podcastTitle: podcast?.title ?? 'Podcast',
          artworkUrl: podcast?.artworkUrl ?? '',
          title: d.title ?? 'Episodio descargado',
          description: '',
          audioUrl: d.localUri,
          duration: prog?.duration ?? d.duration ?? 0,
          pubDate: 0,
          progress: prog?.position ?? 0,
          played: prog?.played ?? false,
          downloaded: true,
          localUri: d.localUri,
        });
      }
      setItems(enriched);
    } catch (e) {
      console.warn('load downloads failed', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handlePlay = (ep: PlayableEpisode) => {
    playEpisode(ep, { localUri: ep.localUri });
    navigation.navigate('Player');
  };

  return (
    <View style={styles.container}>
      {/* Banner sin conexión */}
      <View style={styles.offlineBanner}>
        <View style={styles.bannerIconCircle}>
          <Ionicons name="cloud-done-outline" size={24} color={Colors.accentGreen} />
        </View>
        <View style={styles.bannerInfo}>
          <Text style={styles.bannerTitle}>Modo Sin Conexión</Text>
          <Text style={styles.bannerSubtitle}>
            {items.length === 1 ? '1 episodio listo' : `${items.length} episodios listos`} para escuchar offline
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.loadingText}>Cargando descargas…</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="cloud-download-outline" size={50} color={Colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>Sin episodios descargados</Text>
              <Text style={styles.emptyText}>
                Descarga tus episodios favoritos para escucharlos en el gimnasio o cuando no tengas internet.
              </Text>
            </View>
          }
          renderItem={({ item }) => <EpisodeItem episode={item} onPlay={handlePlay} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 8,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  bannerIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerInfo: {
    flex: 1,
  },
  bannerTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  bannerSubtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  list: {
    paddingBottom: 120,
  },
  center: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 30,
  },
  loadingText: {
    color: Colors.textSecondary,
    marginTop: 12,
  },
  empty: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 30,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
