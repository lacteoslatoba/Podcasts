import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  NavigationContainer,
  DefaultTheme,
  createNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { Podcast, Audiobook, AudiobookGenre } from '../types';
import { usePlayer } from '../context/PlayerContext';
import HomeScreen from '../screens/HomeScreen';
import DownloadsScreen from '../screens/DownloadsScreen';
import SearchScreen from '../screens/SearchScreen';
import EpisodesScreen from '../screens/EpisodesScreen';
import PlayerScreen from '../screens/PlayerScreen';
import AudiobookGenreScreen from '../screens/AudiobookGenreScreen';
import AudiobookDetailScreen from '../screens/AudiobookDetailScreen';
import MiniPlayer from '../components/MiniPlayer';
import { Colors } from '../theme/colors';

export type RootStackParamList = {
  Home: undefined;
  Buscar: undefined;
  Descargas: undefined;
  Episodes: { podcast: Podcast };
  Player: undefined;
  AudiobookGenre: { genre: AudiobookGenre };
  AudiobookDetail: { book: Audiobook };
};

const navigationRef = createNavigationContainerRef<RootStackParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.background,
    card: Colors.surface,
    text: Colors.text,
    border: Colors.border,
    primary: Colors.primary,
  },
};

interface Props {
  subscriptions: Podcast[];
  onSubscribe: (list: Podcast[]) => void;
}

/**
 * Estructura Principal: Stack Navigator SIN barra de pestañas inferior.
 * Todo el control del menú superior (Podcasts | Audiolibros) ocurre en HomeScreen.
 */
export default function AppNavigator({ subscriptions, onSubscribe }: Props) {
  return (
    <NavigationContainer ref={navigationRef} theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: Colors.surface },
          headerTintColor: Colors.text,
          headerTitleStyle: { fontWeight: '700', color: Colors.text },
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        <Stack.Screen name="Home" options={{ headerShown: false }}>
          {() => <HomeScreen subscriptions={subscriptions} onSubscribe={onSubscribe} />}
        </Stack.Screen>

        <Stack.Screen name="Buscar" options={{ title: 'Buscar' }}>
          {() => <SearchScreen subscriptions={subscriptions} onSubscribe={onSubscribe} />}
        </Stack.Screen>

        <Stack.Screen name="Descargas" component={DownloadsScreen} options={{ title: 'Descargas' }} />
        <Stack.Screen name="Episodes" component={EpisodesScreen} options={{ title: 'Episodios' }} />
        <Stack.Screen
          name="Player"
          component={PlayerScreen}
          options={{ title: 'Ahora Suena', presentation: 'modal' }}
        />
        <Stack.Screen name="AudiobookGenre" component={AudiobookGenreScreen} options={{ title: 'Género' }} />
        <Stack.Screen name="AudiobookDetail" component={AudiobookDetailScreen} options={{ title: 'Audiolibro' }} />
      </Stack.Navigator>

      <MiniPlayerOverlay />
    </NavigationContainer>
  );
}

/** Mini reproductor flotante al fondo de la pantalla (sin tab bar) */
function MiniPlayerOverlay() {
  const { current } = usePlayer();

  if (!current) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <MiniPlayer
        onPress={() => {
          if (navigationRef.isReady()) {
            navigationRef.navigate('Player');
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});
