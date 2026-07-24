import { useEffect, useRef } from 'react';
import { Animated, Easing, View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';

// RN version of frontend/src/components/Skeleton/Skeleton.tsx — shimmer block (animated
// opacity pulse, RN has no easy moving CSS gradient) + spinning ring overlay on
// card-shaped skeletons, same combo as web (§8.10: no blank/fullscreen spinner allowed,
// skeleton shape must resemble real content).

function useShimmerOpacity() {
  const value = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(value, { toValue: 0.5, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [value]);
  return value;
}

function useSpin() {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(value, { toValue: 1, duration: 800, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [value]);
  return value.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
}

export function SkeletonBlock({ style }: { style?: StyleProp<ViewStyle> }) {
  const opacity = useShimmerOpacity();
  return <Animated.View style={[styles.block, style, { opacity }]} />;
}

function SpinnerRing({ size = 32 }: { size?: number }) {
  const rotate = useSpin();
  return (
    <Animated.View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          marginTop: -size / 2,
          marginLeft: -size / 2,
          transform: [{ rotate }],
        },
      ]}
    />
  );
}

// Card-shaped skeleton (statCard) — shimmer background + spinning ring centered on top,
// matches frontend .statCard skeleton exactly.
export function SkeletonStatCard() {
  return (
    <View style={styles.statCard}>
      <SkeletonBlock style={StyleSheet.absoluteFillObject} />
      <SpinnerRing size={28} />
    </View>
  );
}

export function SkeletonStatCardRow({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.statGrid}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonStatCard key={i} />
      ))}
    </View>
  );
}

// Chart-shaped skeleton (Tren Penjualan) — bigger card, same shimmer+spinner combo.
export function SkeletonChart({ height = 160 }: { height?: number }) {
  return (
    <View style={[styles.chart, { height }]}>
      <SkeletonBlock style={StyleSheet.absoluteFillObject} />
      <SpinnerRing size={36} />
    </View>
  );
}

export function SkeletonBadge({ width = 100 }: { width?: number }) {
  return <SkeletonBlock style={{ width, height: 22, borderRadius: 999 }} />;
}

const styles = StyleSheet.create({
  block: {
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  ring: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    borderWidth: 3,
    borderColor: 'rgba(230, 57, 70, 0.15)',
    borderTopColor: '#e63946',
  },
  statCard: {
    flexBasis: '47%',
    borderRadius: 12,
    height: 72,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chart: {
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
