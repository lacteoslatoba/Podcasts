import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Podcast, Episode, PlayableEpisode } from '../types';
import { fetchEpisodes } from '../services/feed';
import { hydrateEpisodes } from '../services/storage';
import { usePlayer } from '../context/PlayerContext';
import EpisodeItem from '../components/EpisodeItem';
import { Colors } from '../theme/colors';
import type { RootStackParamList } from '../navigation';

type Route = RouteProp<RootStackParamList, 'Episodes'>;
type Nav = NativeStackNavigationProp<RootStackParamList, 'Episodes'>;

export default function EpisodesScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const podcast = route.params.podcast;

  const { playEpisode } = usePlayer();

  const [episodes, setEpisodes] = useState<PlayableEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (showSpinner: boolean) => {
      if (showSpinner) setLoading(true);
      setError('');
      try {
        const fetched: Episode[] = await fetchEpisodes(podcast.feedUrl, podcast);
        const hydrated = await hydrateEpisodes(
          fetched.map((e) => ({ ...e, progress: 0, played: false, downloaded: false })),
        );
        setEpisodes(hydrated);
      } catch (e: any) {
        setError(e?.message ?? 'No se pudieron cargar los episodios.');
        setEpisodes([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [podcast],
  );

  useEffect(() => {
    navigation.setOptions({ title: podcast.title });
    load(true);
  }, [podcast, navigation, load]);

  const handleRefresh = () => {
    setRefreshing(true);
    load(false);
  };

  const handlePlay = (ep: PlayableEpisode) => {
    playEpisode(ep);
    navigation.navigate('Player');
  };

  const handlePlayAll = () => {
    if (episodes.length > 0) {
      handlePlay(episodes[0]);
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.loadingText}>Obteniendo episodios…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <View style={styles.errorCircle}>
            <Ionicons name="cloud-offline-outline" size={48} color={Colors.accentRose} />
          </View>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load(true)}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={episodes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListHeaderComponent={
            <View style={styles.header}>
              <View style={styles.headerContent}>
                {podcast.artworkUrl ? (
                  <View style={styles.artworkWrap}>
                    <Image source={{ uri: podcast.artworkUrl }} style={styles.headerArtwork} resizeMode="cover" />
                  </View>
                ) : null}
                <View style={styles.headerInfo}>
                  <Text style={styles.headerTitle} numberOfLines={2}>
                    {podcast.title}
                  </Text>
                  <Text style={styles.headerAuthor} numberOfLines={1}>{podcast.author}</Text>
                  <View style={styles.badgeRow}>
                    <View style={styles.badge}>
                      <Ionicons name="mic-outline" size={12} color={Colors.accent} />
                      <Text style={styles.badgeText}>{episodes.length} episodios</Text>
                    </View>
                  </View>
                </View>
              </View>

              {episodes.length > 0 && (
                <TouchableOpacity style={styles.playAllBtn} onPress={handlePlayAll} activeOpacity={0.85}>
                  <Ionicons name="play" size={18} color="#FFF" />
                  <Text style={styles.playAllText}>Reproducir ÚLTIMO</Text>
                </TouchableOpacity>
              )}
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
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  loadingText: {
    color: Colors.textSecondary,
    marginTop: 14,
    fontSize: 14,
    fontWeight: '500',
  },
  errorCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    marginTop: 18,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  list: {
    paddingBottom: 120,
  },
  header: {
    backgroundColor: Colors.surface,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  artworkWrap: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerArtwork: {
    width: 90,
    height: 90,
    borderRadius: 16,
    marginRight: 14,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  headerAuthor: {
    color: Colors.accent,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  playAllText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
