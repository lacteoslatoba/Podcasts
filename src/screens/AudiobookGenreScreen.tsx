import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp, NavigationProp } from '@react-navigation/native';
import type { Audiobook, AudiobookGenre } from '../types';
import { getBooksByGenre } from '../services/librivox';
import { Colors } from '../theme/colors';
import type { RootStackParamList } from '../navigation';

type Route = RouteProp<RootStackParamList, 'AudiobookGenre'>;
type Nav = NavigationProp<RootStackParamList>;

/**
 * Lista de audiolibros de un género, con buscador dentro del género.
 */
export default function AudiobookGenreScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const genre = route.params?.genre;

  const [books, setBooks] = useState<Audiobook[]>([]);
  const [filtered, setFiltered] = useState<Audiobook[]>([]);
  const [term, setTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!genre) return;
    setLoading(true);
    setError('');
    try {
      const list = await getBooksByGenre(genre.id);
      setBooks(list);
      setFiltered(list);
    } catch (e: any) {
      setError(e?.message ?? 'No se pudieron cargar los audiolibros.');
      setBooks([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  }, [genre]);

  useEffect(() => {
    if (genre) {
      navigation.setOptions({ title: genre.name });
      load();
    }
  }, [genre, navigation, load]);

  const applyFilter = useCallback(
    (query: string) => {
      setTerm(query);
      const q = query.trim().toLowerCase();
      if (!q) {
        setFiltered(books);
        return;
      }
      setFiltered(
        books.filter(
          (b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q),
        ),
      );
    },
    [books],
  );

  const renderBook = ({ item }: { item: Audiobook }) => (
    <TouchableOpacity
      style={styles.bookCard}
      activeOpacity={0.85}
      onPress={() => (navigation.navigate as (r: string, p?: any) => void)('AudiobookDetail', { book: item })}
    >
      <Image source={{ uri: item.artworkUrl }} style={styles.artwork} resizeMode="cover" />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.author} numberOfLines={1}>{item.author}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {item.numSections} capítulos · {bookHours(item.totalSeconds)}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={Colors.textSecondary} />
        <TextInput
          style={styles.input}
          placeholder={`Buscar en ${genre.name}…`}
          placeholderTextColor={Colors.textMuted}
          value={term}
          onChangeText={applyFilter}
          autoCorrect={false}
        />
        {term.length > 0 && (
          <TouchableOpacity onPress={() => applyFilter('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
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
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={<Text style={styles.count}>{filtered.length} audiolibros</Text>}
          ListEmptyComponent={
            <Text style={styles.empty}>No hay audiolibros que coincidan con tu búsqueda.</Text>
          }
          renderItem={renderBook}
        />
      )}
    </View>
  );
}

function bookHours(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h} h ${m} min`;
  return `${m} min`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingTop: 12 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 14,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
    marginBottom: 12,
  },
  input: { flex: 1, color: Colors.text, fontSize: 15, height: 46 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  errorText: { color: Colors.textSecondary, textAlign: 'center', marginTop: 12 },
  retryBtn: { backgroundColor: Colors.primary, marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  retryText: { color: '#FFF', fontWeight: '700' },
  listContent: { paddingBottom: 120, paddingHorizontal: 16 },
  count: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  empty: { color: Colors.textMuted, textAlign: 'center', marginTop: 40, fontSize: 14 },
  bookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginVertical: 5,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  artwork: { width: 60, height: 60, borderRadius: 12, backgroundColor: Colors.surfaceElevated },
  info: { flex: 1, marginLeft: 12, marginRight: 6 },
  title: { color: Colors.text, fontSize: 14, fontWeight: '700' },
  author: { color: Colors.textSecondary, fontSize: 12, marginTop: 3 },
  meta: { color: Colors.textMuted, fontSize: 11, marginTop: 4 },
});

