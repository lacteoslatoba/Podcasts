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
import type { ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { Podcast } from '../types';
import { fetchComedians, groupByComedian, TOP10_MX_COMEDIANS } from '../services/comedians';
import { Colors } from '../theme/colors';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const HERO_HEIGHT = Math.min(SCREEN_H * 0.62, 460);

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
              {item.artworkUrl ? (
                <Image source={{ uri: item.artworkUrl }} style={styles.top10Poster} resizeMode="cover" />
              ) : (
                <View style={[styles.top10Poster, styles.rowCardFallback]}>
                  <Ionicons name="happy" size={26} color={Colors.primaryLight} />
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
  const cardW = 150;
  const cardH = 200;
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
            {item.artworkUrl ? (
              <Image
                source={{ uri: item.artworkUrl }}
                style={[styles.rowCardImage, { width: cardW, height: cardH }]}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.rowCardImage, styles.rowCardFallback, { width: cardW, height: cardH }]}>
                <Ionicons name="happy-outline" size={36} color={Colors.primaryLight} />
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
// Pantalla Comediantes — mismo estilo que Audiolibros/Música (filas por comediante)
// ──────────────────────────────────────────────
export default function ComediansScreen() {
  const navigation = useNavigation();

  const [comedianRows, setComedianRows] = useState<ComedianRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const openComedian = (podcast: Podcast) => {
    (navigation.navigate as any)('Episodes', { podcast });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {loading ? (
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
                </View>
              </View>
            </TouchableOpacity>
          )}

          {/* ── Fila: Top 10 curado de comediantes mexicanos ── */}
          <ComedianTop10Row
            title="Top 10 Comediantes de México"
            subtitle="Por popularidad, especiales en streaming y presencia actual"
            items={TOP10_MX_COMEDIANS}
            onPress={openComedian}
          />

          {/* ── Filas por comediante ── */}
          {comedianRows.map((row) => (
            <ComedianRow
              key={row.comedian}
              title={row.comedian}
              subtitle={`${row.shows.length} show(s) de ${row.comedian}`}
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
  heroNBadge: { backgroundColor: Colors.accentRose, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  heroNBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  heroGenre: { color: Colors.primaryLight, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  heroTitle: { color: Colors.text, fontSize: 28, fontWeight: '900', lineHeight: 32, letterSpacing: -0.5 },
  heroAuthor: { color: Colors.textSecondary, fontSize: 14, marginTop: 4, marginBottom: 16 },
  heroBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroPlayBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF', paddingHorizontal: 22, paddingVertical: 10, borderRadius: 6 },
  heroPlayBtnText: { color: '#000', fontSize: 14, fontWeight: '800' },

  // ── Filas (estilo idéntico a Audiolibros) ──
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

