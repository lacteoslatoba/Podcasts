import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { fetchMusicByAllGenres, MUSIC_GENRES, type RadioStation } from '../services/radio';
import { usePlayer } from '../context/PlayerContext';
import type { PlayableEpisode } from '../types';
import { Colors } from '../theme/colors';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const HERO_HEIGHT = Math.min(SCREEN_H * 0.62, 460);

/** Nombres legibles en español para cada género musical (traducción simple). */
const GENRE_LABELS: Record<string, string> = {
  country: 'Country',
  pop: 'Pop',
  rock: 'Rock',
  latin: 'Latina',
  reggaeton: 'Reggaetón',
  balada: 'Balada',
  salsa: 'Salsa',
  bachata: 'Bachata',
  cumbia: 'Cumbia',
  norteño: 'Norteño',
  mariachi: 'Mariachi',
  banda: 'Banda',
  ranchera: 'Ranchera',
  jazz: 'Jazz',
  blues: 'Blues',
  classical: 'Clásica',
  electronica: 'Electrónica',
  house: 'House',
  dance: 'Dance',
  reggae: 'Reggae',
  hiphop: 'Hip Hop',
  rap: 'Rap',
  metal: 'Metal',
  indie: 'Indie',
  folk: 'Folk',
  romantica: 'Romántica',
  tropical: 'Tropical',
  vallenato: 'Vallenato',
  corridos: 'Corridos',
};

interface MusicRow {
  genre: string;
  label: string;
  stations: RadioStation[];
}

function genreLabel(genre: string): string {
  return GENRE_LABELS[genre] ?? genre.charAt(0).toUpperCase() + genre.slice(1);
}

/** Asigna cada estación a su género musical (o "Variada" si no se detecta). */
function groupByGenre(stations: RadioStation[]): MusicRow[] {
  const buckets = new Map<string, RadioStation[]>();
  const push = (g: string, s: RadioStation) => {
    const list = buckets.get(g) ?? [];
    list.push(s);
    buckets.set(g, list);
  };
  for (const s of stations) {
    const haystack = (s.tags + ' ' + s.name).toLowerCase();
    const g = MUSIC_GENRES.find((k) => haystack.includes(k));
    push(g || 'variada', s);
  }
  const rows: MusicRow[] = [];
  for (const [genre, list] of buckets.entries()) {
    rows.push({ genre, label: genreLabel(genre), stations: list });
  }
  rows.sort((a, b) => b.stations.length - a.stations.length);
  return rows;
}

// ──────────────────────────────────────────────
// Fila horizontal Top 10 estilo Netflix (igual que Audiolibros)
// ──────────────────────────────────────────────
function MusicTop10Row({
  title,
  subtitle,
  items,
  onPress,
}: {
  title: string;
  subtitle?: string;
  items: RadioStation[];
  onPress: (s: RadioStation) => void;
}) {
  if (items.length === 0) return null;
  const top10 = items.slice(0, 10);
  return (
    <View style={styles.rowSection}>
      <View style={styles.top10HeaderRow}>
        <View style={styles.top10Badge}>
          <Text style={styles.top10BadgeText}>TOP 10</Text>
        </View>
        <Text style={styles.rowTitle}>{title}</Text>
      </View>
      {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.top10ScrollContent}
        style={styles.horizontalScroll}
      >
        {top10.map((item, idx) => (
          <TouchableOpacity
            key={item.id}
            style={styles.top10CardWrap}
            activeOpacity={0.8}
            onPress={() => onPress(item)}
          >
            <View style={styles.top10NumberContainer}>
              <Text style={styles.top10Number}>{idx + 1}</Text>
            </View>
            <View style={styles.top10PosterWrap}>
              {item.favicon ? (
                <Image source={{ uri: item.favicon }} style={styles.top10Poster} resizeMode="cover" />
              ) : (
                <View style={[styles.top10Poster, styles.rowCardFallback]}>
                  <Ionicons name="musical-notes" size={26} color={Colors.primaryLight} />
                </View>
              )}
              <View style={styles.top10PlayOverlay}>
                <Ionicons name="play" size={14} color="#FFF" style={{ marginLeft: 2 }} />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// ──────────────────────────────────────────────
// Fila horizontal estándar (una por género musical)
// ──────────────────────────────────────────────
function MusicGenreRow({
  title,
  subtitle,
  items,
  onPress,
}: {
  title: string;
  subtitle?: string;
  items: RadioStation[];
  onPress: (s: RadioStation) => void;
}) {
  if (items.length === 0) return null;
  const cardW = 120;
  const cardH = 160;
  return (
    <View style={styles.rowSection}>
      <Text style={styles.rowTitle}>{title}</Text>
      {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rowScrollContent}
        style={styles.horizontalScroll}
      >
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.rowCard, { width: cardW }]}
            activeOpacity={0.75}
            onPress={() => onPress(item)}
          >
            {item.favicon ? (
              <Image
                source={{ uri: item.favicon }}
                style={[styles.rowCardImage, { width: cardW, height: cardH }]}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.rowCardImage, styles.rowCardFallback, { width: cardW, height: cardH }]}>
                <Ionicons name="musical-notes" size={28} color={Colors.primaryLight} />
              </View>
            )}
            <Text style={styles.rowCardTitle} numberOfLines={2}>
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// ──────────────────────────────────────────────
// Pantalla Música — mismo estilo que Radio/Audiolibros (filas por género)
// ──────────────────────────────────────────────
export default function MusicScreen() {
  const navigation = useNavigation();
  const { playEpisode } = usePlayer();

  const [stations, setStations] = useState<RadioStation[]>([]);
  const [musicRows, setMusicRows] = useState<MusicRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [heroIdx, setHeroIdx] = useState(0);
  const heroFade = useRef(new Animated.Value(1)).current;

  const load = () => {
    setLoading(true);
    setError('');
    fetchMusicByAllGenres()
      .then((list) => {
        setStations(list);
        setMusicRows(groupByGenre(list));
      })
      .catch((e) => setError(e?.message ?? 'No se pudieron cargar las estaciones de música.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  // Rotación del héroe
  useEffect(() => {
    if (stations.length === 0) return;
    const timer = setInterval(() => {
      Animated.timing(heroFade, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
        setHeroIdx((i) => (i + 1) % Math.min(stations.length, 5));
        Animated.timing(heroFade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      });
    }, 6000);
    return () => clearInterval(timer);
  }, [stations.length, heroFade]);

  const featured = stations[heroIdx] || stations[0];

  // Resultados de búsqueda (filtra por nombre y etiquetas de género)
  const searchResults = searchTerm.trim()
    ? stations.filter((s) => {
        const q = searchTerm.trim().toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          (s.tags || '').toLowerCase().includes(q)
        );
      })
    : [];

  // render de un resultado de búsqueda (lista vertical)
  const renderSearchResult = ({ item, index }: { item: RadioStation; index: number }) => (
    <TouchableOpacity
      style={styles.searchItem}
      activeOpacity={0.8}
      onPress={() => playStation(item)}
    >
      <Text style={styles.searchRank}>{index + 1}</Text>
      {item.favicon ? (
        <Image source={{ uri: item.favicon }} style={styles.searchArtwork} resizeMode="cover" />
      ) : (
        <View style={[styles.searchArtwork, styles.rowCardFallback]}>
          <Ionicons name="musical-notes" size={22} color={Colors.primaryLight} />
        </View>
      )}
      <View style={styles.searchInfo}>
        <Text style={styles.searchTitle} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.searchSubtitle} numberOfLines={1}>
          {item.tags || item.country || 'Música'}
        </Text>
      </View>
      <View style={styles.searchPlay}>
        <Ionicons name="play" size={16} color="#FFF" style={{ marginLeft: 2 }} />
      </View>
    </TouchableOpacity>
  );

  const playStation = (station: RadioStation) => {
    const episode: PlayableEpisode = {
      id: `music-${station.id}`,
      podcastId: 'radio',
      podcastTitle: [station.country, 'Música'].filter(Boolean).join(' · '),
      artworkUrl: station.favicon,
      title: station.name,
      description: station.tags,
      audioUrl: station.streamUrl,
      duration: 0,
      pubDate: Date.now(),
      progress: 0,
      played: false,
      downloaded: false,
    };
    playEpisode(episode);
    (navigation.navigate as any)('Player');
  };

  // Estilo Jango: al escribir un artista/género y darle Enter, arranca a
  // sonar de una la mejor coincidencia — sin tener que buscar y tocar un
  // resultado a mano.
  const handleSearchSubmit = () => {
    if (searchResults.length > 0) playStation(searchResults[0]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── Buscador estilo Jango: grande, escribís y arranca a sonar ── */}
      <View style={styles.jangoHero}>
        <Text style={styles.jangoTitle}>Tu propia estación</Text>
        <Text style={styles.jangoTagline}>
          Escribí tu artista, banda o género favorito y arrancá a escucharlo al toque
        </Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.primaryLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Ej: Bad Bunny, salsa, rock…"
            placeholderTextColor={Colors.textMuted}
            value={searchTerm}
            onChangeText={setSearchTerm}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
            autoCorrect={false}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        {searchTerm.trim().length > 0 && (
          <TouchableOpacity
            style={[styles.jangoPlayBtn, searchResults.length === 0 && styles.jangoPlayBtnDisabled]}
            onPress={handleSearchSubmit}
            disabled={searchResults.length === 0}
            activeOpacity={0.85}
          >
            <Ionicons name="play" size={16} color="#000" />
            <Text style={styles.jangoPlayBtnText}>Escuchar ahora</Text>
          </TouchableOpacity>
        )}
      </View>

      {searchTerm.trim().length > 0 ? (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.searchListContent}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <Text style={styles.searchCount}>{searchResults.length} resultado(s)</Text>
          }
          ListEmptyComponent={
            <Text style={styles.searchEmpty}>No se encontró ninguna estación con "{searchTerm}".</Text>
          }
          renderItem={renderSearchResult}
        />
      ) : loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.loadingText}>Cargando estaciones de música…</Text>
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
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* ── HERO a pantalla completa ── */}
          {featured && (
            <TouchableOpacity
              activeOpacity={0.95}
              style={styles.heroWrap}
              onPress={() => playStation(featured)}
            >
              <Animated.View style={[styles.heroImgWrap, { opacity: heroFade }]}>
                {featured.favicon ? (
                  <Image source={{ uri: featured.favicon }} style={styles.heroImg} resizeMode="cover" />
                ) : (
                  <View style={[styles.heroImg, styles.heroFallback]}>
                    <Ionicons name="musical-notes" size={80} color={Colors.primaryLight} />
                  </View>
                )}
              </Animated.View>

              <LinearGradient
                colors={['transparent', 'rgba(11,19,31,0.5)', 'rgba(11,19,31,0.98)']}
                style={styles.heroGradientLinear}
              />

              <View style={styles.heroContent}>
                <View style={styles.heroDots}>
                  {stations.slice(0, 5).map((_, i) => (
                    <View key={i} style={[styles.heroDot, i === heroIdx && styles.heroDotActive]} />
                  ))}
                </View>

                <View style={styles.heroBadgeRow}>
                  <View style={styles.heroNBadge}>
                    <Text style={styles.heroNBadgeText}>MÚSICA</Text>
                  </View>
                  <Text style={styles.heroGenre}>ESTACIÓN DESTACADA</Text>
                </View>

                <Text style={styles.heroTitle} numberOfLines={2}>{featured.name}</Text>
                <Text style={styles.heroAuthor} numberOfLines={1}>
                  {featured.tags || featured.country || 'Música en vivo'}
                </Text>

                <View style={styles.heroBtnRow}>
                  <TouchableOpacity
                    style={styles.heroPlayBtn}
                    onPress={() => playStation(featured)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="play" size={18} color="#000" />
                    <Text style={styles.heroPlayBtnText}>Escuchar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          )}

          {/* ── Fila: Top 10 con números gigantes (igual que Audiolibros) ── */}
          <MusicTop10Row
            title="Las 10 Estaciones Más Escuchadas"
            subtitle="Ranking real por clics de oyentes"
            items={stations}
            onPress={playStation}
          />

          {/* ── Filas por género musical ── */}
          {musicRows.map((row) => (
            <MusicGenreRow
              key={row.genre}
              title={row.label}
              subtitle={`${row.stations.length} estaciones de ${row.label}`}
              items={row.stations}
              onPress={playStation}
            />
          ))}

          <View style={{ height: 120 }} />
        </ScrollView>
      )}
    </View>
  );
}

// ──────────────────────────────────────────────
// Estilos (mismos patrones que Radio/Audiolibros)
// ──────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 0 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  loadingText: { color: Colors.textSecondary, marginTop: 12, fontSize: 14, fontWeight: '500' },
  errorText: { color: Colors.textSecondary, textAlign: 'center', marginTop: 12 },
  retryBtn: { backgroundColor: Colors.primary, marginTop: 18, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  retryText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  // ── Hero de búsqueda estilo Jango ──
  jangoHero: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  jangoTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  jangoTagline: {
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
    maxWidth: 320,
  },
  jangoPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 12,
  },
  jangoPlayBtnDisabled: {
    opacity: 0.4,
  },
  jangoPlayBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '800',
  },

  // ── Buscador integrado ──
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 14,
    width: '100%',
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  searchInput: { flex: 1, color: Colors.text, fontSize: 15, height: 46 },
  searchListContent: { paddingHorizontal: 16, paddingBottom: 120 },
  searchCount: { color: Colors.textMuted, fontSize: 12, fontWeight: '700', marginVertical: 8 },
  searchEmpty: { color: Colors.textMuted, textAlign: 'center', marginTop: 40, fontSize: 14 },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    marginVertical: 5,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchRank: { color: Colors.textMuted, fontSize: 13, fontWeight: '800', width: 24, textAlign: 'center' },
  searchArtwork: { width: 50, height: 50, borderRadius: 10 },
  searchInfo: { flex: 1, marginLeft: 12, marginRight: 8 },
  searchTitle: { color: Colors.text, fontSize: 14, fontWeight: '700' },
  searchSubtitle: { color: Colors.textSecondary, fontSize: 12, marginTop: 4 },
  searchPlay: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Hero Netflix ──
  heroWrap: { width: SCREEN_W, height: HERO_HEIGHT, position: 'relative', overflow: 'hidden', backgroundColor: Colors.surface },
  heroImgWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  heroImg: { width: '100%', height: '100%' },
  heroFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surfaceElevated },
  heroGradientLinear: { position: 'absolute', bottom: 0, left: 0, right: 0, height: HERO_HEIGHT * 0.7 },
  heroContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 24, backgroundColor: 'rgba(11,19,31,0.62)' },
  heroDots: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  heroDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.35)' },
  heroDotActive: { backgroundColor: Colors.primary, width: 20, borderRadius: 3 },
  heroBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  heroNBadge: { backgroundColor: Colors.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  heroNBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  heroGenre: { color: Colors.primaryLight, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  heroTitle: { color: Colors.text, fontSize: 28, fontWeight: '900', lineHeight: 32, letterSpacing: -0.5 },
  heroAuthor: { color: Colors.textSecondary, fontSize: 14, marginTop: 4, marginBottom: 16 },
  heroBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroPlayBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF', paddingHorizontal: 22, paddingVertical: 10, borderRadius: 6 },
  heroPlayBtnText: { color: '#000', fontSize: 14, fontWeight: '800' },

  // ── Filas (estilo idéntico a Radio/Audiolibros) ──
  rowSection: { marginTop: 22 },
  rowTitle: { color: Colors.text, fontSize: 16, fontWeight: '800', paddingHorizontal: 16 },
  rowSubtitle: { color: Colors.textMuted, fontSize: 12, marginTop: 2, marginBottom: 8, paddingHorizontal: 16 },
  rowScrollContent: { paddingHorizontal: 12, gap: 12 },
  horizontalScroll: (Platform.OS === 'web' ? { touchAction: 'pan-x' } : {}) as ViewStyle,
  rowCard: { backgroundColor: 'transparent' },
  rowCardImage: {
    borderRadius: 8,
    backgroundColor: Colors.surfaceElevated,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rowCardFallback: { alignItems: 'center', justifyContent: 'center' },
  rowCardTitle: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600', lineHeight: 15 },

  // ── Top 10 (igual que Audiolibros) ──
  top10HeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16 },
  top10Badge: { backgroundColor: Colors.accentRose, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  top10BadgeText: { color: '#FFF', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  top10ScrollContent: { paddingHorizontal: 16, gap: 4 },
  top10CardWrap: { position: 'relative', width: 88, marginBottom: 10 },
  top10NumberContainer: { position: 'absolute', left: 0, bottom: 2, zIndex: 2 },
  top10Number: { color: Colors.text, fontSize: 64, fontWeight: '900', textShadowColor: '#000', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 },
  top10PosterWrap: { marginLeft: 26, borderRadius: 8, overflow: 'hidden' },
  top10Poster: { width: 62, height: 88, backgroundColor: Colors.surfaceElevated },
  top10PlayOverlay: { position: 'absolute', right: 4, bottom: 4, width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
});

