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
import type { Podcast, FetchedEpisode, PlayableEpisode } from '../types';
import { fetchEpisodes } from '../services/feed';
import { Colors } from '../theme/colors';
import { usePlayer } from '../context/PlayerContext';

const { height: SCREEN_H } = Dimensions.get('window');

interface Props {
  podcast: Podcast | null;
  visible: boolean;
  onClose: () => void;
  onOpenEpisodes: (podcast: Podcast) => void;
  isSubscribed?: boolean;
  onToggleSubscribe?: (podcast: Podcast) => void;
}

export default function PodcastDetailModal({
  podcast,
  visible,
  onClose,
  onOpenEpisodes,
  isSubscribed,
  onToggleSubscribe,
}: Props) {
  const { playEpisode } = usePlayer();
  const [episodes, setEpisodes] = useState<FetchedEpisode[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (podcast && visible) {
      setLoading(true);
      fetchEpisodes(podcast.feedUrl, podcast)
        .then((eps: FetchedEpisode[]) => setEpisodes(eps.slice(0, 5)))
        .catch(() => setEpisodes([]))
        .finally(() => setLoading(false));
    }
  }, [podcast, visible]);

  if (!podcast) return null;

  const handlePlayFirst = () => {
    if (episodes.length > 0) {
      const ep: PlayableEpisode = {
        ...episodes[0],
        progress: 0,
        played: false,
        downloaded: false,
      };
      playEpisode(ep);
      onClose();
    } else {
      onOpenEpisodes(podcast);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
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
              {podcast.artworkUrl ? (
                <Image source={{ uri: podcast.artworkUrl }} style={styles.heroImg} resizeMode="cover" />
              ) : (
                <View style={[styles.heroImg, styles.fallbackImg]}>
                  <Ionicons name="mic" size={60} color={Colors.primaryLight} />
                </View>
              )}
              <View style={styles.heroOverlay} />
            </View>

            {/* Información del podcast */}
            <View style={styles.detailsBody}>
              <View style={styles.badgeRow}>
                <View style={styles.nBadge}>
                  <Text style={styles.nBadgeText}>P</Text>
                </View>
                <Text style={styles.badgeLabel}>PODCAST ORIGINAL</Text>
              </View>

              <Text style={styles.title}>{podcast.title}</Text>
              <Text style={styles.author}>{podcast.author}</Text>

              {/* Botones de acción estilo Netflix */}
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.playBtn} activeOpacity={0.85} onPress={handlePlayFirst}>
                  <Ionicons name="play" size={20} color="#000" />
                  <Text style={styles.playBtnText}>Reproducir</Text>
                </TouchableOpacity>

                {onToggleSubscribe && (
                  <TouchableOpacity
                    style={[styles.subBtn, isSubscribed && styles.subBtnActive]}
                    activeOpacity={0.8}
                    onPress={() => onToggleSubscribe(podcast)}
                  >
                    <Ionicons
                      name={isSubscribed ? 'checkmark' : 'add'}
                      size={20}
                      color="#FFF"
                    />
                    <Text style={styles.subBtnText}>
                      {isSubscribed ? 'Siguiendo' : 'Mi Lista'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Descripción */}
              <Text style={styles.description} numberOfLines={4}>
                {podcast.description || 'Sin descripción disponible.'}
              </Text>

              {/* Lista de episodios recientes */}
              <View style={styles.episodesHeader}>
                <Text style={styles.episodesTitle}>Episodios Recientes</Text>
                <TouchableOpacity onPress={() => { onClose(); onOpenEpisodes(podcast); }}>
                  <Text style={styles.seeAllText}>Ver todos ({podcast.trackCount ?? '20+'})</Text>
                </TouchableOpacity>
              </View>

              {loading ? (
                <ActivityIndicator color={Colors.primaryLight} style={{ marginVertical: 20 }} />
              ) : episodes.length > 0 ? (
                episodes.map((ep, idx) => (
                  <TouchableOpacity
                    key={ep.id || idx}
                    style={styles.episodeItem}
                    activeOpacity={0.75}
                    onPress={() => {
                      playEpisode({ ...ep, progress: 0, played: false, downloaded: false });
                      onClose();
                    }}
                  >
                    <View style={styles.epPlayCircle}>
                      <Ionicons name="play" size={14} color="#FFF" style={{ marginLeft: 2 }} />
                    </View>
                    <View style={styles.epInfo}>
                      <Text style={styles.epTitle} numberOfLines={1}>{ep.title}</Text>
                      <Text style={styles.epDesc} numberOfLines={2}>{ep.description}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <TouchableOpacity
                  style={styles.fullEpBtn}
                  onPress={() => { onClose(); onOpenEpisodes(podcast); }}
                >
                  <Text style={styles.fullEpBtnText}>Explorar todos los episodios</Text>
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
    backgroundColor: '#E50914',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 3,
  },
  nBadgeText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 12,
  },
  badgeLabel: {
    color: Colors.textSecondary,
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
    color: Colors.primaryLight,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  playBtn: {
    flex: 1,
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
    fontSize: 15,
    fontWeight: '800',
  },
  subBtn: {
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
  subBtnActive: {
    backgroundColor: 'rgba(0, 168, 225, 0.2)',
    borderColor: Colors.primary,
  },
  subBtnText: {
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
