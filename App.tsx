import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PlayerProvider } from './src/context/PlayerContext';
import AppNavigator from './src/navigation';
import type { Podcast } from './src/types';
import { getSubscriptions } from './src/services/storage';
import { Colors } from './src/utils/format';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <PlayerProvider>
          <Root />
        </PlayerProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function Root() {
  return <ThemedApp />;
}

function ThemedApp() {
  const [subscriptions, setSubscriptions] = useState<Podcast[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getSubscriptions()
      .then((list) => {
        setSubscriptions(list);
        setReady(true);
      })
      .catch(() => setReady(true));
  }, []);

  return (
    <View style={styles.flex}>
      <StatusBar style="light" />
      {ready ? (
        <AppNavigator subscriptions={subscriptions} onSubscribe={setSubscriptions} />
      ) : (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});

