import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Audiobook, PlayableEpisode } from '../types';
import { fetchAudiobookChapters } from '../services/librivox';
import { Colors } from '../theme/colors';
import { usePlayer } from '../context/PlayerContext';

const { height: SCREEN_H } = Dimensions.get('window');

interface Props {
  book: Audiobook | null;
  visible: boolean;
  onClose: () => void;
  onOpenDetail: (book: Audiobook) => void;
}

export default function AudiobookDetailModal({ book, visible, onClose, onOpenDetail }: Props) {
  const { playEpisode } = usePlayer();
  const [chapters, setChapters] = useState<PlayableEpisode[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (book && visible) {
      setLoading(true);
      fetchAudiobookChapters(book)
        .then((eps) =>
          setChapters(
            eps.slice(0, 6).map((c) => ({ ...c, progress: 0, played: false, downloaded: false })),
          ),
        )
        .catch(() => setChapters([]))
        .finally(() => setLoading(false));
    }
  }, [book, visible]);

  if (!book) return null;

  const handlePlayFirst = () => {
    if (chapters.length > 0) {
      playEpisode(chapters[0]);
      onClose();
    } else {
      onOpenDetail(book);
      onClose();
    }
  };

  const formatHours = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.dismissOverlay} activeOpacity={1} onPress={onClose} />

        <View style={styles.sheetContainer}>
          {/* Botón de cerrar */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={20} color="#FFF" />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Banner superior con imagen */}
            <View style={styles.heroWrap}>
              {book.artworkUrl ? (
                <Image source={{ uri: book.artworkUrl }} style={styles.heroImg} resizeMode="cover" />
              ) : (
                <View style={[styles.heroImg, styles.fallbackImg]}>
                  <Ionicons name="book" size={60} color={Colors.primaryLight} />
                </View>
              )}
              <View style={styles.heroOverlay} />
            </View>

            {/* Detalles del audiolibro */}
            <View style={styles.detailsBody}>
              <View style={styles.badgeRow}>
                <View style={styles.nBadge}>
                  <Text style={styles.nBadgeText}>LIBRO</Text>
                </View>
                <Text style={styles.badgeLabel}>AUDIOLIBRO GRATUITO</Text>
              </View>

              <Text style={styles.title}>{book.title}</Text>
              <Text style={styles.author}>Por {book.author}</Text>

              <View style={styles.metaRow}>
                <Text style={styles.metaBadge}>{book.numSections} capítulos</Text>
                <Text style={styles.metaBadge}>{formatHours(book.totalSeconds)}</Text>
                <Text style={styles.metaBadge}>{book.language.toUpperCase()}</Text>
              </View>

              {/* Botones estilo Netflix */}
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.playBtn} activeOpacity={0.85} onPress={handlePlayFirst}>
                  <Ionicons name="play" size={20} color="#000" />
                  <Text style={styles.playBtnText}>Escuchar Capítulo 1</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.detailBtn}
                  activeOpacity={0.8}
                  onPress={() => {
                    onClose();
                    onOpenDetail(book);
                  }}
                >
                  <Ionicons name="list" size={20} color="#FFF" />
                  <Text style={styles.detailBtnText}>Ver Capítulos</Text>
                </TouchableOpacity>
              </View>

              {/* Sinopsis */}
              <Text style={styles.description} numberOfLines={5}>
                {book.description || 'Obra clásica de dominio público producida por LibriVox.'}
              </Text>

              {/* Lista de primeros capítulos */}
              <View style={styles.episodesHeader}>
                <Text style={styles.episodesTitle}>Capítulos Primeros</Text>
                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    onOpenDetail(book);
                  }}
                >
                  <Text style={styles.seeAllText}>Todos ({book.numSections})</Text>
                </TouchableOpacity>
              </View>

              {loading ? (
                <ActivityIndicator color={Colors.primaryLight} style={{ marginVertical: 20 }} />
              ) : chapters.length > 0 ? (
                chapters.map((chap, idx) => (
                  <TouchableOpacity
                    key={chap.id || idx}
                    style={styles.episodeItem}
                    activeOpacity={0.75}
                    onPress={() => {
                      playEpisode(chap);
                      onClose();
                    }}
                  >
                    <View style={styles.epPlayCircle}>
                      <Ionicons name="play" size={14} color="#FFF" style={{ marginLeft: 2 }} />
                    </View>
                    <View style={styles.epInfo}>
                      <Text style={styles.epTitle} numberOfLines={1}>
                        {chap.title}
                      </Text>
                      <Text style={styles.epDesc} numberOfLines={1}>
                        Capítulo {idx + 1}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <TouchableOpacity
                  style={styles.fullEpBtn}
                  onPress={() => {
                    onClose();
                    onOpenDetail(book);
                  }}
                >
                  <Text style={styles.fullEpBtnText}>Ver todos los capítulos del libro</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  dismissOverlay: {
    flex: 1,
  },
  sheetContainer: {
    maxHeight: SCREEN_H * 0.85,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroWrap: {
    width: '100%',
    height: 220,
    position: 'relative',
  },
  heroImg: {
    width: '100%',
    height: '100%',
  },
  fallbackImg: {
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(21, 34, 56, 0.95)',
  },
  detailsBody: {
    paddingHorizontal: 20,
    marginTop: -20,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  nBadge: {
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 3,
  },
  nBadgeText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 11,
  },
  badgeLabel: {
    color: Colors.primaryLight,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  title: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  author: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  metaBadge: {
    color: Colors.textSecondary,
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    fontSize: 11,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  playBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFF',
    paddingVertical: 12,
    borderRadius: 6,
  },
  playBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '800',
  },
  detailBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceElevated,
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailBtnText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  description: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 20,
  },
  episodesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 16,
  },
  episodesTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  seeAllText: {
    color: Colors.primaryLight,
    fontSize: 12,
    fontWeight: '700',
  },
  episodeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    gap: 12,
  },
  epPlayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  epInfo: {
    flex: 1,
  },
  epTitle: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  epDesc: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  fullEpBtn: {
    backgroundColor: Colors.surfaceElevated,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  fullEpBtnText: {
    color: Colors.primaryLight,
    fontSize: 13,
    fontWeight: '700',
  },
});
