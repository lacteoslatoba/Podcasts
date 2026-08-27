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
import type { PlayableEpisode } from '../types';
import { fetchAudiobookChapters } from '../services/librivox';
import { hydrateEpisodes } from '../services/storage';
import { usePlayer } from '../context/PlayerContext';
import EpisodeItem from '../components/EpisodeItem';
import { Colors } from '../theme/colors';
import type { RootStackParamList } from '../navigation';

type Route = RouteProp<RootStackParamList, 'AudiobookDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList, 'AudiobookDetail'>;

/**
 * Detalle de un audiolibro: lista de capítulos para reproducir/descargar.
 */
export default function AudiobookDetailScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const book = route.params?.book;
  const { playEpisode } = usePlayer();

  const [chapters, setChapters] = useState<PlayableEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!book) return;
    setLoading(true);
    setError('');
    try {
      const fetched = await fetchAudiobookChapters(book);
      const hydrated = await hydrateEpisodes(
        fetched.map((c) => ({ ...c, progress: 0, played: false, downloaded: false })),
      );
      setChapters(hydrated);
    } catch (e: any) {
      setError(e?.message ?? 'No se pudieron cargar los capítulos.');
      setChapters([]);
    } finally {
      setLoading(false);
    }
  }, [book]);

  useEffect(() => {
    if (book) {
      navigation.setOptions({ title: 'Capítulos' });
      load();
    }
  }, [book, navigation, load]);

  const handlePlay = (chapter: PlayableEpisode) => {
    playEpisode(chapter);
    navigation.navigate('Player');
  };

  const handlePlayAll = () => {
    if (chapters.length > 0) handlePlay(chapters[0]);
  };

  const header = (
    <View style={styles.header}>
      <Image source={{ uri: book.artworkUrl }} style={styles.artwork} resizeMode="cover" />
      <View style={styles.headerInfo}>
        <Text style={styles.headerTitle} numberOfLines={3}>{book.title}</Text>
        <Text style={styles.headerAuthor} numberOfLines={2}>{book.author}</Text>
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Ionicons name="book-outline" size={12} color={Colors.accent} />
            <Text style={styles.badgeText}>{book.language || 'Audio'}</Text>
          </View>
          <View style={styles.badge}>
            <Ionicons name="layers-outline" size={12} color={Colors.primaryLight} />
            <Text style={styles.badgeText}>{book.numSections || chapters.length} capítulos</Text>
          </View>
        </View>
        {book.description ? (
          <Text style={styles.description} numberOfLines={3}>{book.description}</Text>
        ) : null}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.loadingText}>Cargando capítulos…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={56} color={Colors.textMuted} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={chapters}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View>
              {header}
              {chapters.length > 0 && (
                <TouchableOpacity style={styles.playAllBtn} onPress={handlePlayAll} activeOpacity={0.85}>
                  <Ionicons name="play" size={18} color="#FFF" />
                  <Text style={styles.playAllText}>Reproducir desde el inicio</Text>
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
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  loadingText: { color: Colors.textSecondary, marginTop: 12 },
  errorText: { color: Colors.textSecondary, textAlign: 'center', marginTop: 12 },
  retryBtn: { backgroundColor: Colors.primary, marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  retryText: { color: '#FFF', fontWeight: '700' },
  listContent: { paddingBottom: 120 },
  header: { flexDirection: 'row', padding: 16 },
  artwork: { width: 96, height: 96, borderRadius: 14, backgroundColor: Colors.surfaceElevated },
  headerInfo: { flex: 1, marginLeft: 14 },
  headerTitle: { color: Colors.text, fontSize: 18, fontWeight: '800' },
  headerAuthor: { color: Colors.textSecondary, fontSize: 13, marginTop: 6 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.surfaceElevated, borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  badgeText: { color: Colors.textSecondary, fontSize: 11, fontWeight: '600' },
  description: { color: Colors.textMuted, fontSize: 12, marginTop: 10, lineHeight: 17 },
  playAllBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: 14,
    marginHorizontal: 16, marginBottom: 8, paddingVertical: 12,
  },
  playAllText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
});

