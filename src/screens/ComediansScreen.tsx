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
import type { Podcast } from '../types';
import { fetchComedians, groupByComedian, groupByCategory, TOP10_MX_COMEDIANS } from '../services/comedians';
import { useDragScroll } from '../hooks/useDragScroll';
import { Colors } from '../theme/colors';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const HERO_HEIGHT = Math.min(SCREEN_H * 0.42, 320);

interface ComedianRow {
  comedian: string;
  shows: Podcast[];
}

// ──────────────────────────────────────────────
// Fila horizontal Top 10 estilo Netflix
// ──────────────────────────────────────────────
function ComedianTop10Row({
  title,
  subtitle,
  items,
  onPress,
}: {
  title: string;
  subtitle?: string;
  items: Podcast[];
  onPress: (p: Podcast) => void;
}) {
  if (items.length === 0) return null;
  const top10 = items.slice(0, 10);
  const { scrollRef, bind, onScroll, wasDragged } = useDragScroll();
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
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.top10ScrollContent}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={styles.dragRow}
        {...bind}
      >
        {top10.map((item, idx) => (
          <TouchableOpacity
            key={item.id}
            style={styles.top10CardWrap}
            activeOpacity={0.8}
            onPress={() => { if (!wasDragged()) onPress(item); }}
          >
            <View style={styles.top10NumberContainer}>
              <Text style={styles.top10Number}>{idx + 1}</Text>
            </View>
            <View style={styles.top10PosterWrap}>
              {item.artworkUrl ? (
                <Image source={{ uri: item.artworkUrl }} style={styles.top10Poster} resizeMode="cover" />
              ) : (
                <View style={[styles.top10Poster, styles.rowCardFallback]}>
                  <Ionicons name="happy" size={32} color={Colors.primaryLight} />
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
// Fila horizontal por COMEDIANTE (una fila = un humorista)
// ──────────────────────────────────────────────
function ComedianRow({
  title,
  subtitle,
  items,
  onPress,
}: {
  title: string;
  subtitle?: string;
  items: Podcast[];
  onPress: (p: Podcast) => void;
}) {
  if (items.length === 0) return null;
  const cardW = 120;
  const cardH = 120;
  const { scrollRef, bind, onScroll, wasDragged } = useDragScroll();
  return (
    <View style={styles.rowSection}>
      <Text style={styles.rowTitle}>{title}</Text>
      {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rowScrollContent}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={styles.dragRow}
        {...bind}
      >
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.rowCard, { width: cardW }]}
            activeOpacity={0.75}
            onPress={() => { if (!wasDragged()) onPress(item); }}
          >
            {item.artworkUrl ? (
              <Image
                source={{ uri: item.artworkUrl }}
                style={[styles.rowCardImage, { width: cardW, height: cardH }]}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.rowCardImage, styles.rowCardFallback, { width: cardW, height: cardH }]}>
                <Ionicons name="happy-outline" size={28} color={Colors.primaryLight} />
              </View>
            )}
            <Text style={styles.rowCardTitle} numberOfLines={2}>
              {item.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// ──────────────────────────────────────────────
// Cuadrícula de comediantes (aprox. 4 por fila, distribuidas hacia abajo)
// ──────────────────────────────────────────────
function ComediansGrid({
  title,
  subtitle,
  items,
  onPress,
}: {
  title: string;
  subtitle?: string;
  items: Podcast[];
  onPress: (p: Podcast) => void;
}) {
  if (items.length === 0) return null;
  return (
    <View style={styles.gridSection}>
      <Text style={styles.rowTitle}>{title}</Text>
      {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      <View style={styles.grid}>
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.gridCard}
            activeOpacity={0.75}
            onPress={() => onPress(item)}
          >
            {item.artworkUrl ? (
              <Image source={{ uri: item.artworkUrl }} style={styles.gridCardImage} resizeMode="cover" />
            ) : (
              <View style={[styles.gridCardImage, styles.rowCardFallback]}>
                <Ionicons name="happy-outline" size={28} color={Colors.primaryLight} />
              </View>
            )}
            <Text style={styles.rowCardTitle} numberOfLines={2}>
              {item.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ──────────────────────────────────────────────
// Pantalla Comediantes — mismo estilo que Audiolibros/Música (filas por comediante)
// ──────────────────────────────────────────────
export default function ComediansScreen() {
  const navigation = useNavigation();

  const [comedianRows, setComedianRows] = useState<ComedianRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [heroIdx, setHeroIdx] = useState(0);
  const heroFade = useRef(new Animated.Value(1)).current;

  const load = () => {
    setLoading(true);
    setError('');
    fetchComedians()
      .then((list) => {
        setComedianRows(groupByComedian(list));
      })
      .catch((e) => setError(e?.message ?? 'No se pudieron cargar los comediantes.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  // Rotación del héroe (entre el Top 10 curado, no la búsqueda genérica)
  useEffect(() => {
    const timer = setInterval(() => {
      Animated.timing(heroFade, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
        setHeroIdx((i) => (i + 1) % TOP10_MX_COMEDIANS.length);
        Animated.timing(heroFade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      });
    }, 6000);
    return () => clearInterval(timer);
  }, [heroFade]);

  const featured = TOP10_MX_COMEDIANS[heroIdx];

  // Lista plana de todos los shows de comedia (para completar el Top 10)
  const allShows: Podcast[] = [];
  for (const r of comedianRows) {
    for (const s of r.shows) allShows.push(s);
  }
  // Combinamos los curados + los de la búsqueda, sin duplicar, hasta 10
  const seenTop = new Set<string>();
  const top10List: Podcast[] = [];
  for (const p of [...TOP10_MX_COMEDIANS, ...allShows]) {
    if (top10List.length >= 10) break;
    if (!p.artworkUrl) continue;
    if (seenTop.has(p.id)) continue;
    seenTop.add(p.id);
    top10List.push(p);
  }

  // Todos los comediantes juntos arriba: UNA tarjeta por artista (su show representativo)
  const seenArtist = new Set<string>();
  const allComediansList: Podcast[] = [];
  for (const r of comedianRows) {
    const rep = r.shows.find((s) => s.artworkUrl) || r.shows[0];
    if (!rep) continue;
    const artistKey = r.comedian.toLowerCase();
    if (seenArtist.has(artistKey)) continue;
    seenArtist.add(artistKey);
    allComediansList.push(rep);
  }

  // Separar por categoría de humor (género)
  const categoryRows = groupByCategory(allComediansList);

  const openComedian = (podcast: Podcast) => {
    (navigation.navigate as any)('Episodes', { podcast });
  };

  // Resultados de búsqueda (filtra por nombre del show y del comediante)
  const searchResults = searchTerm.trim()
    ? allComediansList.filter((s) => {
        const q = searchTerm.trim().toLowerCase();
        return (
          s.title.toLowerCase().includes(q) ||
          (s.author || '').toLowerCase().includes(q)
        );
      })
    : [];

  const renderSearchResult = ({ item, index }: { item: Podcast; index: number }) => (
    <TouchableOpacity
      style={styles.searchItem}
      activeOpacity={0.8}
      onPress={() => openComedian(item)}
    >
      <Text style={styles.searchRank}>{index + 1}</Text>
      {item.artworkUrl ? (
        <Image source={{ uri: item.artworkUrl }} style={styles.searchArtwork} resizeMode="cover" />
      ) : (
        <View style={[styles.searchArtwork, styles.rowCardFallback]}>
          <Ionicons name="happy-outline" size={22} color={Colors.primaryLight} />
        </View>
      )}
      <View style={styles.searchInfo}>
        <Text style={styles.searchTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.searchSubtitle} numberOfLines={1}>
          {item.author || 'Comediante'}
        </Text>
      </View>
      <View style={styles.searchPlay}>
        <Ionicons name="play" size={16} color="#FFF" style={{ marginLeft: 2 }} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── Buscador de comediantes ── */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={Colors.primaryLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar comediante o show…"
          placeholderTextColor={Colors.textMuted}
          value={searchTerm}
          onChangeText={setSearchTerm}
          autoCorrect={false}
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity onPress={() => setSearchTerm('')}>
            <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
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
            <Text style={styles.searchEmpty}>No se encontró "{searchTerm}".</Text>
          }
          renderItem={renderSearchResult}
        />
      ) : loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.loadingText}>Cargando comediantes…</Text>
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
              onPress={() => openComedian(featured)}
            >
              <Animated.View style={[styles.heroImgWrap, { opacity: heroFade }]}>
                {featured.artworkUrl ? (
                  <Image source={{ uri: featured.artworkUrl }} style={styles.heroImg} resizeMode="cover" />
                ) : (
                  <View style={[styles.heroImg, styles.heroFallback]}>
                    <Ionicons name="happy" size={80} color={Colors.primaryLight} />
                  </View>
                )}
              </Animated.View>

              <LinearGradient
                colors={['transparent', 'rgba(11,19,31,0.5)', 'rgba(11,19,31,0.98)']}
                style={styles.heroGradientLinear}
              />

              <View style={styles.heroContent}>
                <View style={styles.heroDots}>
                  {TOP10_MX_COMEDIANS.map((_, i) => (
                    <View key={i} style={[styles.heroDot, i === heroIdx && styles.heroDotActive]} />
                  ))}
                </View>

                <View style={styles.heroBadgeRow}>
                  <View style={styles.heroNBadge}>
                    <Text style={styles.heroNBadgeText}>COMEDIA</Text>
                  </View>
                  <Text style={styles.heroGenre}>CHISTES EN DIRECTO</Text>
                </View>

                <Text style={styles.heroTitle} numberOfLines={2}>{featured.title}</Text>
                <Text style={styles.heroAuthor} numberOfLines={1}>
                  {featured.author || 'Comediante'}
                </Text>

                <View style={styles.heroBtnRow}>
                  <TouchableOpacity
                    style={styles.heroPlayBtn}
                    onPress={() => openComedian(featured)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="play" size={18} color="#000" />
                    <Text style={styles.heroPlayBtnText}>Ver chistes</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.heroInfoBtn}
                    onPress={() => openComedian(featured)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="information-circle-outline" size={20} color={Colors.text} />
                    <Text style={styles.heroInfoBtnText}>Más info</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          )}

          {/* ── Top 10 en cuadrícula (sin línea larga) ── */}
          {top10List.length > 0 && (
            <ComediansGrid
              title="Los 10 Comediantes Más Escuchados"
              subtitle="Por popularidad, especiales en streaming y presencia actual"
              items={top10List}
              onPress={openComedian}
            />
          )}

          {/* ── Cada categoría de humor en su propia cuadrícula ── */}
          {categoryRows.map((row) => (
            <ComediansGrid
              key={row.category.id}
              title={row.category.name}
              subtitle={`${row.shows.length} en ${row.category.name}`}
              items={row.shows}
              onPress={openComedian}
            />
          ))}

          <View style={{ height: 120 }} />
        </ScrollView>
      )}
    </View>
  );
}

// ──────────────────────────────────────────────
// Estilos (mismos patrones que Audiolibros/Música)
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

  // ── Buscador ──
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  searchInput: { flex: 1, color: Colors.text, fontSize: 15, height: 44 },
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

  // ── Hero Netflix (idéntico a Podcasts/Audiolibros) ──
  heroWrap: { width: SCREEN_W, height: HERO_HEIGHT, position: 'relative', overflow: 'hidden', backgroundColor: Colors.surface },
  heroImgWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  heroImg: { width: '100%', height: '100%' },
  heroFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surfaceElevated },
  heroGradientLinear: { position: 'absolute', bottom: 0, left: 0, right: 0, height: HERO_HEIGHT * 0.75 },
  heroContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 24 },
  heroDots: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  heroDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.35)' },
  heroDotActive: { backgroundColor: Colors.primary, width: 20, borderRadius: 3 },
  heroBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  heroNBadge: { backgroundColor: '#E50914', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  heroNBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  heroGenre: { color: Colors.primaryLight, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  heroTitle: { color: Colors.text, fontSize: 26, fontWeight: '900', lineHeight: 30, letterSpacing: -0.5 },
  heroAuthor: { color: Colors.textSecondary, fontSize: 13, marginTop: 4, marginBottom: 14 },
  heroBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroPlayBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF', paddingHorizontal: 22, paddingVertical: 10, borderRadius: 6 },
  heroPlayBtnText: { color: '#000', fontSize: 14, fontWeight: '800' },
  heroInfoBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(120, 120, 120, 0.45)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 6 },
  heroInfoBtnText: { color: Colors.text, fontSize: 14, fontWeight: '700' },

  // ── Filas (estilo idéntico a Podcasts/Audiolibros) ──
  rowSection: { marginTop: 22 },
  rowTitle: { color: Colors.text, fontSize: 16, fontWeight: '800', paddingHorizontal: 16 },
  rowSubtitle: { color: Colors.textMuted, fontSize: 12, marginTop: 2, marginBottom: 8, paddingHorizontal: 16 },
  rowScrollContent: { paddingHorizontal: 12, gap: 12 },
  horizontalScroll: (Platform.OS === 'web' ? { touchAction: 'pan-x' } : {}) as ViewStyle,
  dragRow: (Platform.OS === 'web' ? { cursor: 'grab' } : {}) as ViewStyle,
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

  // ── Cuadrícula de comediantes (tarjetas compactas como Podcasts) ──
  gridSection: { marginTop: 22 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 12,
  },
  gridCard: {
    width: 100, // tarjeta vertical estilo audiolibro
    marginBottom: 8,
  },
  gridCardImage: {
    width: 100,
    height: 133,
    borderRadius: 8,
    backgroundColor: Colors.surfaceElevated,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // ── Top 10 (idéntico a Podcasts/Audiolibros: número gigante + carátula grande) ──
  top10HeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, marginBottom: 4 },
  top10Badge: { backgroundColor: '#E50914', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  top10BadgeText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  top10ScrollContent: { paddingHorizontal: 12, gap: 14, paddingVertical: 10 },
  top10CardWrap: { flexDirection: 'row', alignItems: 'flex-end', width: 160, height: 155 },
  top10NumberContainer: { width: 55, height: 155, justifyContent: 'flex-end', alignItems: 'center', zIndex: 2, marginRight: -18 },
  top10Number: {
    fontSize: 105,
    fontWeight: '900',
    color: Colors.background,
    textShadowColor: Colors.textSecondary,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    lineHeight: 110,
  },
  top10PosterWrap: { width: 120, height: 150, borderRadius: 8, overflow: 'hidden', backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border },
  top10Poster: { width: '100%', height: '100%' },
  top10PlayOverlay: { position: 'absolute', right: 8, bottom: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
});

