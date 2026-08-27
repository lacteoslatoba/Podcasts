import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Colors } from '../theme/colors';

interface Props {
  isPlaying: boolean;
  barCount?: number;
  height?: number;
  barWidth?: number;
  color?: string;
}

/**
 * Visualizador de ondas de audio estilo Amazon Music.
 */
export default function AudioWaveform({
  isPlaying,
  barCount = 18,
  height = 36,
  barWidth = 4,
  color = Colors.primaryLight,
}: Props) {
  const animatedValues = useRef<Animated.Value[]>(
    Array.from({ length: barCount }, () => new Animated.Value(0.15)),
  ).current;

  useEffect(() => {
    let active = true;

    if (isPlaying) {
      const animateBar = (index: number) => {
        if (!active) return;
        const randomHeight = Math.random() * 0.8 + 0.2;
        const randomDuration = Math.floor(Math.random() * 250) + 200;

        Animated.timing(animatedValues[index], {
          toValue: randomHeight,
          duration: randomDuration,
          useNativeDriver: false,
        }).start(() => {
          if (active) animateBar(index);
        });
      };

      animatedValues.forEach((_, i) => animateBar(i));
    } else {
      animatedValues.forEach((val) => {
        Animated.timing(val, {
          toValue: 0.15,
          duration: 300,
          useNativeDriver: false,
        }).start();
      });
    }

    return () => {
      active = false;
    };
  }, [isPlaying, animatedValues]);

  return (
    <View style={[styles.container, { height }]}>
      {animatedValues.map((val, index) => {
        const barHeight = val.interpolate({
          inputRange: [0, 1],
          outputRange: [3, height],
        });

        const isOdd = index % 2 === 1;
        const barColor = isOdd ? Colors.primary : color;

        return (
          <Animated.View
            key={index}
            style={[
              styles.bar,
              {
                width: barWidth,
                height: barHeight,
                backgroundColor: barColor,
                shadowColor: barColor,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginVertical: 12,
  },
  bar: {
    borderRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
});
