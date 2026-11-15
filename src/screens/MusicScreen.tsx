import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { searchSongs, fetchGenreSections, ARTIST_GENRES, type Song, type GenreSection } from '../services/music';
import { fetchJamendoGenreRows, JAMENDO_GENRES, type JamendoTrack, type JamendoGenreRow } from '../services/jamendo';
import { usePlayer } from '../context/PlayerContext';
import type { PlayableEpisode } from '../types';
import { Colors } from '../theme/colors';
import { useDragScroll } from '../hooks/useDragScroll';

// ──────────────────────────────────────────────
// Sub-componente: Fila horizontal Top 10 estilo Netflix
// ──────────────────────────────────────────────
function NetflixTop10SongsRow({
  title,
  subtitle,
  items,
  onPress,
}: {
  title: string;
  subtitle?: string;
  items: Song[];
  onPress: (s: Song) => void;
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
                  <Ionicons name="musical-notes" size={32} color={Colors.primaryLight} />
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
// Sub-componente: Fila horizontal por artista (carátulas de sus canciones)
// ──────────────────────────────────────────────
function NetflixArtistRow({
  artist,
  items,
  onPress,
}: {
  artist: string;
  items: Song[];
  onPress: (s: Song) => void;
}) {
  if (items.length === 0) return null;
  const cardW = 120;
  const cardH = 120;
  const { scrollRef, bind, onScroll, wasDragged } = useDragScroll();
  return (
    <View style={styles.rowSection}>
      <Text style={styles.rowTitle}>{artist}</Text>
      <Text style={styles.rowSubtitle}>Canciones de {artist}</Text>
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
                <Ionicons name="musical-notes" size={28} color={Colors.primaryLight} />
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
// Sub-componente: Fila horizontal Jamendo (canciones COMPLETAS, indie/CC)
// ──────────────────────────────────────────────
function NetflixJamendoRow({
  title,
  subtitle,
  items,
  onPress,
}: {
  title: string;
  subtitle?: string;
  items: JamendoTrack[];
  onPress: (t: JamendoTrack) => void;
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
            <View>
              {item.artworkUrl ? (
                <Image
                  source={{ uri: item.artworkUrl }}
                  style={[styles.rowCardImage, { width: cardW, height: cardH }]}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.rowCardImage, styles.rowCardFallback, { width: cardW, height: cardH }]}>
                  <Ionicons name="musical-notes" size={28} color={Colors.primaryLight} />
                </View>
              )}
              <View style={styles.fullBadge}>
                <Text style={styles.fullBadgeText}>COMPLETA</Text>
              </View>
            </View>
            <Text style={styles.rowCardTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.rowCardArtist} numberOfLines={1}>{item.artist}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

/**
 * Música — buscá un artista real y escuchá canciones reales de ese
 * artista (preview de 30s, catálogo de iTunes/Apple Music: es lo único
 * gratis y sin login que existe para esto — full-length requiere una
 * cuenta paga de Spotify/Apple Music/Amazon Music conectada).
 *
 * Debajo del buscador, igual que en Audiolibros: filas horizontales
 * estilo Netflix con las carátulas de cada artista para ir mirando/
 * escuchando sin necesidad de escribir nada.
 */
export default function MusicScreen() {
  const navigation = useNavigation();
  const { playEpisode } = usePlayer();

  const [term, setTerm] = useState('');
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  // Secciones por género (estilo Audiolibros/Radio) para navegar sin buscar
  const [genreSections, setGenreSections] = useState<GenreSection[]>([]);
  const [rowsLoading, setRowsLoading] = useState(true);

  // Canciones COMPLETAS de Jamendo (indie/Creative Commons), aparte de los previews de iTunes
  const [jamendoRows, setJamendoRows] = useState<JamendoGenreRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    // Se pinta género por género apenas llega, sin esperar a que terminen los 8
    fetchGenreSections(ARTIST_GENRES, 12, (section) => {
      if (cancelled) return;
      setGenreSections((prev) => [...prev, section]);
      setRowsLoading(false);
    })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setRowsLoading(false);
      });

    fetchJamendoGenreRows(JAMENDO_GENRES, 15, (row) => {
      if (cancelled) return;
      setJamendoRows((prev) => [...prev, row]);
    }).catch(() => {});

    return () => { cancelled = true; };
  }, []);

  // Top 10 canciones: una carátula por artista de cada género, para la fila destacada
  const topSongs: Song[] = genreSections
    .flatMap((s) => s.rows)
    .map((row) => row.songs[0])
    .filter((s): s is Song => !!s)
    .slice(0, 10);

  const playSong = (song: Song) => {
    const episode: PlayableEpisode = {
      id: `song-${song.id}`,
      podcastId: 'song',
      podcastTitle: song.artist,
      artworkUrl: song.artworkUrl,
      title: song.title,
      description: song.album,
      audioUrl: song.previewUrl,
      duration: Math.round(song.durationMs / 1000),
      pubDate: Date.now(),
      progress: 0,
      played: false,
      downloaded: false,
    };
    playEpisode(episode);
    (navigation.navigate as any)('Player');
  };

  const playJamendoTrack = (track: JamendoTrack) => {
    const episode: PlayableEpisode = {
      id: `jamendo-${track.id}`,
      podcastId: 'song',
      podcastTitle: track.artist,
      artworkUrl: track.artworkUrl,
      title: track.title,
      description: track.album,
      audioUrl: track.audioUrl,
      duration: Math.round(track.durationMs / 1000),
      pubDate: Date.now(),
      progress: 0,
      played: false,
      downloaded: false,
    };
    playEpisode(episode);
    (navigation.navigate as any)('Player');
  };

  const runSearch = async (query: string) => {
    const q = query.trim();
    if (!q) return;
    setTerm(q);
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const results = await searchSongs(q);
      setSongs(results);
      if (results.length === 0) setError(`No se encontraron canciones de "${q}".`);
      else playSong(results[0]); // estilo Jango: arranca a sonar de una
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo buscar la música.');
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setTerm('');
    setSongs([]);
    setSearched(false);
    setError('');
  };

  return (
    <View style={styles.container}>
      {/* ── Buscador estilo Jango: escribís el artista y arranca a sonar ── */}
      <View style={styles.jangoHero}>
        <Text style={styles.jangoTitle}>Buscá tu artista</Text>
        <Text style={styles.jangoTagline}>
          Canciones reales del artista que escribas · previews de 30 segundos (catálogo abierto de Apple)
        </Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.primaryLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Ej: Bad Bunny, Shakira, Karol G…"
            placeholderTextColor={Colors.textMuted}
            value={term}
            onChangeText={setTerm}
            onSubmitEditing={() => runSearch(term)}
            returnKeyType="search"
            autoCorrect={false}
          />
          {term.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {searched ? (
        // ── Resultados de búsqueda ──
        loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.primary} size="large" />
            <Text style={styles.loadingText}>Buscando "{term}"…</Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Ionicons name="musical-notes-outline" size={56} color={Colors.textMuted} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={clearSearch}>
              <Text style={styles.retryText}>Volver a explorar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.resultsCount}>{songs.length} canción(es) de "{term}"</Text>
            {songs.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={styles.songItem}
                activeOpacity={0.8}
                onPress={() => playSong(item)}
              >
                <Text style={styles.songRank}>{index + 1}</Text>
                {item.artworkUrl ? (
                  <Image source={{ uri: item.artworkUrl }} style={styles.songArtwork} resizeMode="cover" />
                ) : (
                  <View style={[styles.songArtwork, styles.songArtworkFallback]}>
                    <Ionicons name="musical-notes" size={22} color={Colors.primaryLight} />
                  </View>
                )}
                <View style={styles.songInfo}>
                  <Text style={styles.songTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.songArtist} numberOfLines={1}>{item.artist}</Text>
                </View>
                <View style={styles.songPlay}>
                  <Ionicons name="play" size={16} color="#FFF" style={{ marginLeft: 2 }} />
                </View>
              </TouchableOpacity>
            ))}
            <View style={{ height: 100 }} />
          </ScrollView>
        )
      ) : (
        // ── Explorar sin buscar: filas estilo Netflix con las carátulas de cada artista ──
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* ── Jamendo: canciones COMPLETAS, independiente del ritmo de iTunes de abajo ── */}
          {jamendoRows.length > 0 && (
            <>
              <View style={[styles.jamendoBanner, { marginTop: 0 }]}>
                <Text style={styles.jamendoBannerTitle}>🎵 Canciones completas (no previews)</Text>
                <Text style={styles.jamendoBannerSub}>
                  Catálogo de Jamendo: artistas independientes con licencia Creative Commons —
                  se escuchan enteras, gratis y legal. No incluye artistas mainstream (para esos,
                  usá el buscador de arriba o las filas por artista más abajo).
                </Text>
              </View>
              {jamendoRows.map((row) => (
                <NetflixJamendoRow
                  key={row.genre.id}
                  title={row.genre.label}
                  subtitle={`Canciones completas de ${row.genre.label.toLowerCase()} · indie/CC`}
                  items={row.tracks}
                  onPress={playJamendoTrack}
                />
              ))}
            </>
          )}

          {/* ── iTunes: previews de 30s por artista mainstream, agrupado por género ── */}
          {rowsLoading && genreSections.length === 0 ? (
            <View style={styles.rowsLoadingBox}>
              <ActivityIndicator color={Colors.primary} />
              <Text style={styles.loadingText}>Cargando artistas…</Text>
            </View>
          ) : (
            <>
              <NetflixTop10SongsRow
                title="Los Más Sonados Hoy"
                subtitle="Un pegue de cada género"
                items={topSongs}
                onPress={playSong}
              />
              {genreSections.map((section) => (
                <View key={section.genre.id}>
                  <View style={styles.sectionDivider}>
                    <Text style={styles.sectionDividerText}>{section.genre.name.toUpperCase()}</Text>
                  </View>
                  {section.rows.map((row) => (
                    <NetflixArtistRow
                      key={section.genre.id + '-' + row.artist}
                      artist={row.artist}
                      items={row.songs}
                      onPress={playSong}
                    />
                  ))}
                </View>
              ))}
              {rowsLoading && (
                <View style={styles.rowsLoadingBox}>
                  <ActivityIndicator color={Colors.primary} />
                  <Text style={styles.loadingText}>Cargando más géneros…</Text>
                </View>
              )}
            </>
          )}
          <View style={{ height: 120 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  jangoHero: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  jangoTitle: { color: Colors.text, fontSize: 20, fontWeight: '900', textAlign: 'center' },
  jangoTagline: {
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
    maxWidth: 340,
  },
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

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  loadingText: { color: Colors.textSecondary, marginTop: 12, fontSize: 14, fontWeight: '500' },
  errorText: { color: Colors.textSecondary, textAlign: 'center', marginTop: 12 },
  retryBtn: { backgroundColor: Colors.primary, marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  retryText: { color: '#FFF', fontWeight: '700' },

  scroll: { flex: 1 },
  scrollContent: { paddingTop: 14 },
  rowsLoadingBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },

  listContent: { paddingHorizontal: 16, paddingBottom: 120, paddingTop: 14 },
  resultsCount: { color: Colors.textMuted, fontSize: 12, fontWeight: '700', marginBottom: 8 },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    marginVertical: 5,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  songRank: { color: Colors.textMuted, fontSize: 13, fontWeight: '800', width: 22, textAlign: 'center' },
  songArtwork: { width: 50, height: 50, borderRadius: 8 },
  songArtworkFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surfaceElevated },
  songInfo: { flex: 1, marginLeft: 12, marginRight: 8 },
  songTitle: { color: Colors.text, fontSize: 14, fontWeight: '700' },
  songArtist: { color: Colors.textSecondary, fontSize: 12, marginTop: 3 },
  songPlay: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },

  sectionDivider: {
    marginTop: 30,
    marginHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  sectionDividerText: {
    color: Colors.primaryLight,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  // ── Filas Netflix (igual que Audiolibros) ──
  rowSection: { marginTop: 22 },
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
  rowScrollContent: { paddingHorizontal: 12, gap: 12 },
  rowCard: { backgroundColor: 'transparent' },
  rowCardImage: {
    borderRadius: 8,
    backgroundColor: Colors.surfaceElevated,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rowCardFallback: { alignItems: 'center', justifyContent: 'center' },
  rowCardTitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 15,
  },
  rowCardArtist: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },

  // ── Banner y tarjetas de Jamendo (canciones completas) ──
  jamendoBanner: {
    backgroundColor: Colors.primaryGlow,
    marginHorizontal: 16,
    marginTop: 30,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderGlow,
  },
  jamendoBannerTitle: { color: Colors.text, fontSize: 15, fontWeight: '800' },
  jamendoBannerSub: { color: Colors.textSecondary, fontSize: 12, marginTop: 4, lineHeight: 17 },
  fullBadge: {
    position: 'absolute',
    left: 4,
    top: 4,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fullBadgeText: { color: '#4ADE80', fontSize: 8, fontWeight: '900', letterSpacing: 0.3 },

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
  top10BadgeText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  top10ScrollContent: { paddingHorizontal: 12, gap: 14, paddingVertical: 10 },
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
  top10Poster: { width: '100%', height: '100%' },
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
});
