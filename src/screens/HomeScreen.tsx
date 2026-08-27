import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, type NavigationProp } from '@react-navigation/native';
import type { Podcast } from '../types';
import { Colors } from '../theme/colors';
import { SEED_PODCASTS } from '../services/storage';
import { searchPodcasts, fetchLatestPodcasts } from '../services/itunes';
import LibraryScreen from './LibraryScreen';
import AudiobooksScreen from './AudiobooksScreen';
import RadioScreen from './RadioScreen';
import MusicScreen from './MusicScreen';
import ComediansScreen from './ComediansScreen';
import type { RootStackParamList } from '../navigation';

type Nav = NavigationProp<RootStackParamList>;

interface CategoryRow {
  id: string;
  title: string;
  subtitle: string;
  items: Podcast[];
}

interface Props {
  subscriptions: Podcast[];
  onSubscribe: (list: Podcast[]) => void;
}

/**
 * Pantalla raíz sin tab bar inferior.
 * Arriba: "Podcasts | Audiolibros" conmutable + iconos de Buscar y Descargas.
 * Abajo solo queda el mini reproductor.
 */
export default function HomeScreen({ subscriptions, onSubscribe }: Props) {
  const navigation = useNavigation<Nav>();
  const [section, setSection] = useState<'podcast' | 'audiobook' | 'radio' | 'music' | 'comedian'>('podcast');

  const [trending, setTrending] = useState<Podcast[]>(SEED_PODCASTS);
  const [categoryRows, setCategoryRows] = useState<CategoryRow[]>([]);

  // Carga "lo más actual" + filas de categorías (podcasts en español).
  // Se ejecuta CADA VEZ que el inicio recupera el foco, para estar siempre al día.
  const refreshContent = useCallback(() => {
    let cancelled = false;

    fetchLatestPodcasts(25)
      .then((list) => {
        if (!cancelled && list.length > 0) setTrending(list);
      })
      .catch(() => {
        // fallback con SEED_PODCASTS
      });

    Promise.allSettled(Colors.categories.map((cat) => searchPodcasts(cat.name))).then(
      (results) => {
        if (cancelled) return;
        const rows: CategoryRow[] = Colors.categories
          .map((cat, i) => {
            const r = results[i];
            const items = r.status === 'fulfilled' ? r.value.slice(0, 12) : [];
            return { id: cat.id, title: cat.name, subtitle: `Nuevo y popular en ${cat.name}`, items };
          })
          .filter((row) => row.items.length > 0);
        setCategoryRows(rows);
      },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  useFocusEffect(refreshContent);

  const handleToggleSubscribe = (podcast: Podcast) => {
    const exists = subscriptions.some((s) => s.id === podcast.id);
    if (exists) {
      onSubscribe(subscriptions.filter((s) => s.id !== podcast.id));
    } else {
      onSubscribe([podcast, ...subscriptions]);
    }
  };

  const openPodcast = (podcast: Podcast) =>
    (navigation.navigate as (r: string, p: any) => void)('Episodes', { podcast });

  return (
    <View style={styles.container}>
      {/* ── Encabezado superior fijo ── */}
      <View style={styles.header}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.segmented}
          style={styles.segmentedScroll}
        >
          {(
            [
              { id: 'podcast', label: 'Podcasts' },
              { id: 'audiobook', label: 'Audiolibros' },
              { id: 'radio', label: 'Radio' },
              { id: 'music', label: 'Música' },
              { id: 'comedian', label: 'Comediantes' },
            ] as const
          ).map((seg) => {
            const active = section === seg.id;
            return (
              <TouchableOpacity
                key={seg.id}
                style={[styles.segPill, active && styles.segPillActive]}
                onPress={() => setSection(seg.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.segLabel, active && styles.segLabelActive]}>
                  {seg.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => (navigation.navigate as (r: string) => void)('Buscar')}
          >
            <Ionicons name="search" size={18} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => (navigation.navigate as (r: string) => void)('Descargas')}
          >
            <Ionicons name="cloud-download-outline" size={18} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Contenido conmutable ── */}
      <View style={styles.body}>
        {section === 'audiobook' ? (
          <AudiobooksScreen />
        ) : section === 'radio' ? (
          <RadioScreen />
        ) : section === 'music' ? (
          <MusicScreen />
        ) : section === 'comedian' ? (
          <ComediansScreen />
        ) : (
          <LibraryScreen
            subscriptions={subscriptions}
            onOpenPodcast={openPodcast}
            trending={trending}
            categoryRows={categoryRows}
            onToggleSubscribe={handleToggleSubscribe}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 6,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    zIndex: 10,
    gap: 6,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  segmentedScroll: {
    flex: 1,
  },
  segPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 1,
  },
  segPillActive: {
    backgroundColor: Colors.primary,
  },
  segLabel: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  segLabelActive: {
    color: '#FFFFFF',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerBtn: {
    padding: 6,
    borderRadius: 9,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  body: {
    flex: 1,
  },
});

