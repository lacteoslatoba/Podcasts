import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import type { Audiobook, AudiobookGenre } from '../types';
import { AUDIOBOOK_GENRES, fetchCatalog, getBooksByGenre, countBooksByGenre, fetchEssentialBooks } from '../services/librivox';
import { Colors } from '../theme/colors';
import type { RootStackParamList } from '../navigation';
import AudiobookDetailModal from '../components/AudiobookDetailModal';
import { useDragScroll } from '../hooks/useDragScroll';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const HERO_HEIGHT = Math.min(SCREEN_H * 0.62, 460);

type Nav = NavigationProp<RootStackParamList>;

interface GenreRow {
  genre: AudiobookGenre;
  books: Audiobook[];
}

// ──────────────────────────────────────────────
// Sub-componente: Fila horizontal Top 10 estilo Netflix
// ──────────────────────────────────────────────
function NetflixTop10AudiobooksRow({
  title,
  subtitle,
  items,
  onPress,
}: {
  title: string;
  subtitle?: string;
  items: Audiobook[];
  onPress: (b: Audiobook) => void;
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
            {/* Número gigante Top 10 (Estilo Netflix) */}
            <View style={styles.top10NumberContainer}>
              <Text style={styles.top10Number}>{idx + 1}</Text>
            </View>

            {/* Poster de la portada del libro */}
            <View style={styles.top10PosterWrap}>
              {item.artworkUrl ? (
                <Image source={{ uri: item.artworkUrl }} style={styles.top10Poster} resizeMode="cover" />
              ) : (
                <View style={[styles.top10Poster, styles.rowCardFallback]}>
                  <Ionicons name="book" size={32} color={Colors.primaryLight} />
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
// Sub-componente: Fila horizontal estándar tipo Netflix
// ──────────────────────────────────────────────
function NetflixAudiobooksRow({
  title,
  subtitle,
  items,
  onPress,
}: {
  title: string;
  subtitle?: string;
  items: Audiobook[];
  onPress: (b: Audiobook) => void;
}) {
  if (items.length === 0) return null;
  const cardW = 120;
  const cardH = 160;
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
                <Ionicons name="book" size={28} color={Colors.primaryLight} />
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
// Pantalla Audiolibros estilo Netflix
// ──────────────────────────────────────────────
export default function AudiobooksScreen() {
  const navigation = useNavigation<Nav>();
  const [featuredList, setFeaturedList] = useState<Audiobook[]>([]);
  /** Los esenciales recomendados disponibles en el catálogo */
  const [essentialBooks, setEssentialBooks] = useState<Audiobook[]>([]);
  const [genreRows, setGenreRows] = useState<GenreRow[]>([]);
  /** Conteo total de obras por género (para mostrar lo extenso del catálogo) */
  const [genreCounts, setGenreCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estado del modal "Más Info"
  const [selectedBook, setSelectedBook] = useState<Audiobook | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Animación del Hero rotativo
  const [heroIdx, setHeroIdx] = useState(0);
  const heroFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadData();
  }, []);

  // Rotación del héroe
  useEffect(() => {
    if (featuredList.length === 0) return;
    const timer = setInterval(() => {
      Animated.timing(heroFade, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
        setHeroIdx((i) => (i + 1) % featuredList.length);
        Animated.timing(heroFade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      });
    }, 6000);
    return () => clearInterval(timer);
  }, [featuredList.length, heroFade]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const catalog = await fetchCatalog();
      setFeaturedList(catalog.slice(0, 10));

      // Los esenciales recomendados (filas destacadas)
      fetchEssentialBooks()
        .then((list) => setEssentialBooks(list))
        .catch(() => {});

      // Cargar audiolibros por cada género
      const rowsRes = await Promise.allSettled(
        AUDIOBOOK_GENRES.map(async (g) => {
          const books = await getBooksByGenre(g.id);
          return { genre: g, books };
        }),
      );

      const rows: GenreRow[] = rowsRes
        .map((r) => (r.status === 'fulfilled' ? r.value : null))
        .filter((r): r is GenreRow => r !== null && r.books.length > 0);

      setGenreRows(rows);

      // Conteo total de obras por género (barato, solo numFound)
      const countRes = await Promise.allSettled(
        AUDIOBOOK_GENRES.map(async (g) => ({ id: g.id, n: await countBooksByGenre(g.id) })),
      );
      const counts: Record<string, number> = {};
      countRes.forEach((r) => {
        if (r.status === 'fulfilled' && r.value.n > 0) counts[r.value.id] = r.value.n;
      });
      setGenreCounts(counts);
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo cargar el catálogo de audiolibros.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = (book: Audiobook) => {
    setSelectedBook(book);
    setModalVisible(true);
  };

  const openFullBookPage = (book: Audiobook) => {
    (navigation.navigate as (r: string, p?: any) => void)('AudiobookDetail', { book });
  };

  const featured = featuredList[heroIdx] || featuredList[0];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.loadingText}>Cargando audiolibros al estilo Netflix…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={56} color={Colors.textMuted} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* ── HERO a pantalla completa para Audiolibros (estilo Netflix) ── */}
          {featured && (
            <TouchableOpacity
              activeOpacity={0.95}
              style={styles.heroWrap}
              onPress={() => handleOpenDetail(featured)}
            >
              <Animated.View style={[styles.heroImgWrap, { opacity: heroFade }]}>
                {featured.artworkUrl ? (
                  <Image source={{ uri: featured.artworkUrl }} style={styles.heroImg} resizeMode="cover" />
                ) : (
                  <View style={[styles.heroImg, styles.heroFallback]}>
                    <Ionicons name="book" size={80} color={Colors.primaryLight} />
                  </View>
                )}
              </Animated.View>

              {/* Sombra gradiente inferior estilo Netflix */}
              <LinearGradient
                colors={['transparent', 'rgba(11,19,31,0.5)', 'rgba(11,19,31,0.98)']}
                style={styles.heroGradientLinear}
              />

              {/* Contenido del héroe */}
              <View style={styles.heroContent}>
                {/* Indicadores de posición (puntos) */}
                <View style={styles.heroDots}>
                  {featuredList.slice(0, 5).map((_, i) => (
                    <View key={i} style={[styles.heroDot, i === heroIdx && styles.heroDotActive]} />
                  ))}
                </View>

                <View style={styles.heroBadgeRow}>
                  <View style={styles.heroNBadge}>
                    <Text style={styles.heroNBadgeText}>TOP 10</Text>
                  </View>
                  <Text style={styles.heroGenre}>AUDIOLIBRO DESTACADO HOY</Text>
                </View>

                <Text style={styles.heroTitle} numberOfLines={2}>{featured.title}</Text>
                <Text style={styles.heroAuthor} numberOfLines={1}>Por {featured.author}</Text>

                {/* Botones de acción estilo Netflix */}
                <View style={styles.heroBtnRow}>
                  <TouchableOpacity
                    style={styles.heroPlayBtn}
                    onPress={() => openFullBookPage(featured)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="play" size={18} color="#000" />
                    <Text style={styles.heroPlayBtnText}>Escuchar Capítulos</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.heroInfoBtn}
                    onPress={() => handleOpenDetail(featured)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="information-circle-outline" size={20} color={Colors.text} />
                    <Text style={styles.heroInfoBtnText}>Más info</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          )}

          {/* ── Fila: Los Esenciales en español (recomendados) ── */}
          {essentialBooks.length > 0 && (
            <View style={styles.essentialBanner}>
              <Text style={styles.essentialBannerTitle}>📚 Los 10 esenciales en español</Text>
              <Text style={styles.essentialBannerSub}>
                Las grandes obras de la literatura hispana y universal, en audio
              </Text>
            </View>
          )}
          {essentialBooks.length > 0 && (
            <NetflixAudiobooksRow
              title="Esenciales"
              subtitle="Recomendados: clásicos imprescindibles en español"
              items={essentialBooks}
              onPress={openFullBookPage}
            />
          )}

          {/* ── Fila: Top 10 Audiolibros con números gigantes estilo Netflix ── */}
          <NetflixTop10AudiobooksRow
            title="Los 10 Audiolibros Más Escuchados Hoy"
            subtitle="Obras maestras en español"
            items={featuredList}
            onPress={handleOpenDetail}
          />

          {/* ── Filas por género de audiolibro ── */}
          {genreRows.map((row) => (
            <NetflixAudiobooksRow
              key={row.genre.id}
              title={row.genre.name}
              subtitle={
                genreCounts[row.genre.id]
                  ? `Más de ${genreCounts[row.genre.id].toLocaleString('es')} obras en ${row.genre.name}`
                  : `Los mejores audiolibros de ${row.genre.name}`
              }
              items={row.books}
              onPress={handleOpenDetail}
            />
          ))}

          <View style={{ height: 120 }} />
        </ScrollView>
      )}

      {/* ── Modal de Vista Previa "Más Info" estilo Netflix para Audiolibros ── */}
      <AudiobookDetailModal
        book={selectedBook}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onOpenDetail={(b) => {
          setModalVisible(false);
          openFullBookPage(b);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  loadingText: { color: Colors.textSecondary, marginTop: 12, fontSize: 13, fontWeight: '600' },
  errorText: { color: Colors.textSecondary, textAlign: 'center', marginTop: 12 },
  retryBtn: { backgroundColor: Colors.primary, marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  retryText: { color: '#FFF', fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 0 },

  // ── Hero Netflix ──
  heroWrap: {
    width: SCREEN_W,
    height: HERO_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
  heroImgWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroImg: {
    width: '100%',
    height: '100%',
  },
  heroFallback: {
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGradientLinear: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: HERO_HEIGHT * 0.75,
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 24,
  },
  heroDots: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  heroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  heroDotActive: {
    backgroundColor: Colors.primary,
    width: 20,
    borderRadius: 3,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  heroNBadge: {
    backgroundColor: '#E50914',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  heroNBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  heroGenre: {
    color: Colors.primaryLight,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroTitle: {
    color: Colors.text,
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  heroAuthor: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 14,
  },
  heroBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 6,
  },
  heroPlayBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '800',
  },
  heroInfoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(120, 120, 120, 0.45)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  heroInfoBtnText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
  },

  // ── Top 10 Row Netflix ──
  top10HeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  top10Badge: {
    backgroundColor: '#E50914',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  top10BadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
  top10ScrollContent: {
    paddingHorizontal: 12,
    gap: 14,
    paddingVertical: 10,
  },
  top10CardWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: 160,
    height: 165,
  },
  top10NumberContainer: {
    width: 55,
    height: 165,
    justifyContent: 'flex-end',
    alignItems: 'center',
    zIndex: 2,
    marginRight: -18,
  },
  top10Number: {
    fontSize: 105,
    fontWeight: '900',
    color: Colors.background,
    textShadowColor: Colors.textSecondary,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    lineHeight: 110,
  },
  top10PosterWrap: {
    width: 120,
    height: 160,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  top10Poster: {
    width: '100%',
    height: '100%',
  },
  top10PlayOverlay: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Filas Netflix ──
  rowSection: {
    marginTop: 22,
  },
  // Cursor "mano" en web para indicar que la fila se puede arrastrar con el mouse
  dragRow: (Platform.OS === 'web' ? { cursor: 'grab' } : {}) as any,
  rowTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '800',
    paddingHorizontal: 16,
  },
  rowSubtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  rowScrollContent: {
    paddingHorizontal: 12,
    gap: 12,
  },
  rowCard: {
    backgroundColor: 'transparent',
  },
  rowCardImage: {
    borderRadius: 8,
    backgroundColor: Colors.surfaceElevated,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rowCardFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCardTitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 15,
  },

  // ── Banner "Esenciales" ──
  essentialBanner: {
    backgroundColor: Colors.primaryGlow,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderGlow,
  },
  essentialBannerTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  essentialBannerSub: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },
});
