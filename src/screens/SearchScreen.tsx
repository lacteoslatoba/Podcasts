import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { searchPodcasts } from '../services/itunes';
import type { Podcast } from '../types';
import { Colors } from '../theme/colors';
import { saveSubscriptions } from '../services/storage';

interface Props {
  subscriptions: Podcast[];
  onSubscribe: (list: Podcast[]) => void;
}

export default function SearchScreen({ subscriptions, onSubscribe }: Props) {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const subscribedIds = new Set(subscriptions.map((p) => p.id));

  const handleSearch = async (queryToSearch?: string) => {
    Keyboard.dismiss();
    const query = queryToSearch ?? term;
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    try {
      const found = await searchPodcasts(query);
      setResults(found);
      if (found.length === 0) setError('No se encontraron podcasts con ese término.');
    } catch (e: any) {
      setError(e?.message ?? 'Ocurrió un error al buscar.');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryPress = (categoryName: string) => {
    setTerm(categoryName);
    handleSearch(categoryName);
  };

  const toggleSubscribe = async (podcast: Podcast) => {
    const isSub = subscribedIds.has(podcast.id);
    let next: Podcast[];
    if (isSub) {
      next = subscriptions.filter((p) => p.id !== podcast.id);
    } else {
      next = [...subscriptions, podcast];
    }
    await saveSubscriptions(next);
    onSubscribe(next);
  };

  const renderCategoryCard = ({ item }: { item: (typeof Colors.categories)[0] }) => (
    <TouchableOpacity
      style={[styles.categoryCard, { borderColor: item.colors[0] }]}
      activeOpacity={0.8}
      onPress={() => handleCategoryPress(item.name)}
    >
      <View style={[styles.categoryIconCircle, { backgroundColor: item.colors[0] }]}>
        <Ionicons name={item.icon as any} size={22} color="#FFF" />
      </View>
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderResult = ({ item }: { item: Podcast }) => {
    const isSub = subscribedIds.has(item.id);
    return (
      <View style={styles.resultItem}>
        {item.artworkUrl ? (
          <Image source={{ uri: item.artworkUrl }} style={styles.artwork} resizeMode="cover" />
        ) : (
          <View style={[styles.artwork, styles.artworkFallback]}>
            <Ionicons name="mic" size={24} color={Colors.primaryLight} />
          </View>
        )}
        <View style={styles.resultInfo}>
          <Text style={styles.resultTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.resultAuthor} numberOfLines={1}>
            {item.author}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.subBtn, isSub && styles.subBtnActive]}
          onPress={() => toggleSubscribe(item)}
          activeOpacity={0.8}
        >
          <Ionicons name={isSub ? 'checkmark' : 'add'} size={18} color="#FFF" />
          <Text style={styles.subBtnText}>{isSub ? 'Siguiendo' : 'Seguir'}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Buscador Amazon Music */}
      <View style={styles.searchHeader}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.primaryLight} />
          <TextInput
            style={styles.input}
            placeholder="Buscar podcasts o creadores en Amazon Music…"
            placeholderTextColor={Colors.textMuted}
            value={term}
            onChangeText={setTerm}
            onSubmitEditing={() => handleSearch()}
            returnKeyType="search"
            autoCorrect={false}
          />
          {term.length > 0 && (
            <TouchableOpacity onPress={() => { setTerm(''); setResults([]); setError(''); }}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.searchBtn}
          onPress={() => handleSearch()}
          disabled={loading || !term.trim()}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          )}
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading && !error ? (
            <View style={styles.explorerSection}>
              <Text style={styles.sectionHeaderTitle}>EXPLORAR GÉNEROS EN AMAZON MUSIC</Text>
              <FlatList
                data={Colors.categories}
                keyExtractor={(cat) => cat.id}
                numColumns={2}
                scrollEnabled={false}
                renderItem={renderCategoryCard}
                contentContainerStyle={styles.categoryGrid}
              />
            </View>
          ) : null
        }
        renderItem={renderResult}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 8,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 12,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
    height: 48,
  },
  searchBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  error: {
    color: Colors.danger,
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
    textAlign: 'center',
    fontSize: 13,
  },
  list: {
    paddingBottom: 120,
  },
  explorerSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  sectionHeaderTitle: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 14,
  },
  categoryGrid: {
    gap: 12,
  },
  categoryCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    margin: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  categoryIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    marginHorizontal: 16,
    marginVertical: 5,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  artwork: {
    width: 54,
    height: 54,
    borderRadius: 10,
  },
  artworkFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceElevated,
  },
  resultInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  resultTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  resultAuthor: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  subBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  subBtnActive: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.accentGreen,
  },
  subBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
