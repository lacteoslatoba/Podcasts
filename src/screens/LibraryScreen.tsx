import React, { useEffect, useRef, useState } from 'react';
import {
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
// Metro reload trigger
import { useNavigation } from '@react-navigation/native';
import type { Podcast } from '../types';
import { Colors } from '../theme/colors';
import { SEED_PODCASTS } from '../services/storage';
import HeroContinueCard from '../components/HeroContinueCard';
import PodcastDetailModal from '../components/PodcastDetailModal';
import { useDragScroll } from '../hooks/useDragScroll';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const HERO_HEIGHT = Math.min(SCREEN_H * 0.62, 460);

interface Props {
  subscriptions: Podcast[];
  onOpenPodcast: (podcast: Podcast) => void;
  categoryRows?: { id: string; title: string; subtitle: string; items: Podcast[] }[];
  trending?: Podcast[];
  onToggleSubscribe?: (podcast: Podcast) => void;
}

// ──────────────────────────────────────────────
// Sub-componente: Fila horizontal Top 10 estilo Netflix
// ──────────────────────────────────────────────
function NetflixTop10Row({
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
            {/* Número gigante estilizado al costado (Estilo Netflix) */}
            <View style={styles.top10NumberContainer}>
              <Text style={styles.top10Number}>{idx + 1}</Text>
            </View>

            {/* Poster de la portada */}
            <View style={styles.top10PosterWrap}>
              {item.artworkUrl ? (
                <Image source={{ uri: item.artworkUrl }} style={styles.top10Poster} resizeMode="cover" />
              ) : (
                <View style={[styles.top10Poster, styles.rowCardFallback]}>
                  <Ionicons name="mic" size={32} color={Colors.primaryLight} />
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
function NetflixRow({
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
                <Ionicons name="mic" size={28} color={Colors.primaryLight} />
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
// Pantalla principal – estilo Netflix Premium
// ──────────────────────────────────────────────
export default function LibraryScreen({
  subscriptions,
  onOpenPodcast,
  categoryRows = [],
  trending = [],
  onToggleSubscribe,
}: Props) {
  const navigation = useNavigation();
  const scrollY = useRef(new Animated.Value(0)).current;

  // Estado para el modal de detalles "Más Info"
  const [selectedPodcast, setSelectedPodcast] = useState<Podcast | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // El héroe rota entre los primeros podcasts destacados
  const featuredList = trending.length > 0 ? trending.slice(0, 5) : SEED_PODCASTS;
  const [heroIdx, setHeroIdx] = useState(0);
  const heroFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setInterval(() => {
      Animated.timing(heroFade, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
        setHeroIdx((i) => (i + 1) % featuredList.length);
        Animated.timing(heroFade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      });
    }, 6000);
    return () => clearInterval(timer);
  }, [featuredList.length, heroFade]);

  const featured = featuredList[heroIdx];

  const displaySubscriptions = subscriptions.length > 0 ? subscriptions : SEED_PODCASTS;

  const handleOpenDetail = (p: Podcast) => {
    setSelectedPodcast(p);
    setModalVisible(true);
  };

  const isSubscribed = (p: Podcast) => subscriptions.some((s) => s.id === p.id);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── Contenido principal (scroll vertical) ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO a pantalla completa estilo Netflix ── */}
        <TouchableOpacity
          activeOpacity={0.95}
          style={styles.heroWrap}
          onPress={() => handleOpenDetail(featured)}
        >
          <Animated.View style={[styles.heroImgWrap, { opacity: heroFade }]}>
            {featured.artworkUrl ? (
              <Image
                source={{ uri: featured.artworkUrl }}
                style={styles.heroImg}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.heroImg, styles.heroFallback]}>
                <Ionicons name="headset" size={80} color={Colors.primaryLight} />
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
              {featuredList.map((_, i) => (
                <View
                  key={i}
                  style={[styles.heroDot, i === heroIdx && styles.heroDotActive]}
                />
              ))}
            </View>

            <View style={styles.heroBadgeRow}>
              <View style={styles.heroNBadge}>
                <Text style={styles.heroNBadgeText}>TOP 10</Text>
              </View>
              <Text style={styles.heroGenre}>PODCAST DESTACADO HOY</Text>
            </View>

            <Text style={styles.heroTitle} numberOfLines={2}>{featured.title}</Text>
            <Text style={styles.heroAuthor} numberOfLines={1}>{featured.author}</Text>

            {/* Botones de acción estilo Netflix */}
            <View style={styles.heroBtnRow}>
              <TouchableOpacity
                style={styles.heroPlayBtn}
                onPress={() => onOpenPodcast(featured)}
                activeOpacity={0.85}
              >
                <Ionicons name="play" size={18} color="#000" />
                <Text style={styles.heroPlayBtnText}>Ver Episodios</Text>
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

        {/* ── Mini reproductor si hay uno activo ── */}
        <HeroContinueCard onPress={() => (navigation.navigate as any)('Player')} />

        {/* ── Fila: Siguiendo / Mis Podcasts ── */}
        <NetflixRow
          title="Mis Podcasts"
          subtitle="Tus suscripciones activas"
          items={displaySubscriptions}
          onPress={handleOpenDetail}
        />

        {/* ── Fila: Top actualizado "en vivo" con números gigantes estilo Netflix ── */}
        <NetflixTop10Row
          title="Lo Más Escuchado Ahora"
          subtitle="Actualizado en vivo · podcasts de México, España y LATAM"
          items={trending.length > 0 ? trending : SEED_PODCASTS}
          onPress={handleOpenDetail}
        />

        {/* ── Filas por categoría ── */}
        {categoryRows.map((row) => (
          <NetflixRow
            key={row.id}
            title={row.title}
            subtitle={row.subtitle}
            items={row.items}
            onPress={handleOpenDetail}
          />
        ))}

        {/* Fallback si las categorías no cargan */}
        {categoryRows.length === 0 && (
          <NetflixRow
            title="Destacados"
            subtitle="Selección recomendada"
            items={SEED_PODCASTS}
            onPress={handleOpenDetail}
          />
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Modal de Vista Previa "Más Info" estilo Netflix ── */}
      <PodcastDetailModal
        podcast={selectedPodcast}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onOpenEpisodes={(p) => {
          setModalVisible(false);
          onOpenPodcast(p);
        }}
        isSubscribed={selectedPodcast ? isSubscribed(selectedPodcast) : false}
        onToggleSubscribe={onToggleSubscribe}
      />
    </View>
  );
}

// ──────────────────────────────────────────────
// Estilos
// ──────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // ── Nav flotante ──
  floatingNav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight ?? 24,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  floatingNavContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 10,
  },
  navLogoBadge: {
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: '#E50914',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLogoBadgeText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 14,
  },
  navLogoText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  navCatScroll: {
    flexGrow: 0,
    gap: 8,
    paddingRight: 8,
  },
  navCatPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  navCatPillActive: {
    backgroundColor: Colors.text,
  },
  navCatItem: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  navCatItemActive: {
    color: '#000000',
    fontWeight: '800',
  },
  navActions: {
    flex: 1,
    alignItems: 'flex-end',
  },
  navActionBtn: {
    padding: 4,
  },

  // ── Scroll principal ──
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 0,
  },

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
    height: 155,
  },
  top10NumberContainer: {
    width: 55,
    height: 155,
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
    height: 150,
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
});
