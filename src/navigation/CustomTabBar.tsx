import { useEffect, useRef } from 'react';
import { View, Animated, Pressable, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import type { OwnerTabsParamList } from './OwnerTabs';

type IconPair = { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap };

const ICONS: Record<keyof OwnerTabsParamList, IconPair> = {
  Dashboard: { active: 'grid', inactive: 'grid-outline' },
  Laporan: { active: 'bar-chart', inactive: 'bar-chart-outline' },
  GajiPenjual: { active: 'cash', inactive: 'cash-outline' },
  UtangPenjual: { active: 'wallet', inactive: 'wallet-outline' },
  LokasiPenjual: { active: 'location', inactive: 'location-outline' },
};

const BAR_HEIGHT = 62;
const NOTCH_RADIUS = 32;
// Seberapa lebar transisi kurva di kiri/kanan lengkungan — makin besar makin landai.
const CURVE_SPREAD = 24;
const BUTTON_SIZE = 58;

// Tap feedback dipakai di kedua jenis tombol (normal & tengah) — tekan mengecil
// cepat, lepas mental balik pakai spring. Dipisah jadi hook kecil biar tidak
// duplikat logic di 2 komponen di bawah.
function usePressScale(pressedScale: number) {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () => {
    Animated.timing(scale, { toValue: pressedScale, duration: 90, useNativeDriver: true }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, { toValue: 1, friction: 5, tension: 140, useNativeDriver: true }).start();
  };
  return { scale, onPressIn, onPressOut };
}

interface TabButtonProps {
  focused: boolean;
  icon: IconPair;
  label: string;
  onPress: () => void;
}

function TabButton({ focused, icon, label, onPress }: TabButtonProps) {
  const { scale, onPressIn, onPressOut } = usePressScale(0.88);
  const bounce = useRef(new Animated.Value(1)).current;
  const wasFocused = useRef(focused);

  useEffect(() => {
    if (focused && !wasFocused.current) {
      // Baru saja jadi tab aktif — kasih "pop" kecil biar kelihatan reaktif,
      // bukan cuma warnanya yang ganti diam-diam.
      Animated.sequence([
        Animated.timing(bounce, { toValue: 1.25, duration: 120, useNativeDriver: true }),
        Animated.spring(bounce, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }),
      ]).start();
    }
    wasFocused.current = focused;
  }, [focused, bounce]);

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} style={styles.tabButton}>
      <Animated.View style={{ transform: [{ scale: Animated.multiply(scale, bounce) }] }}>
        <Ionicons name={focused ? icon.active : icon.inactive} size={22} color={focused ? '#e63946' : '#9ca3af'} />
      </Animated.View>
      <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

interface MiddleTabButtonProps {
  icon: IconPair;
  label: string;
  onPress: () => void;
}

function MiddleTabButton({ icon, label, onPress }: MiddleTabButtonProps) {
  const { scale, onPressIn, onPressOut } = usePressScale(0.9);

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} style={styles.middleSlot}>
      <Animated.View style={[styles.middleButton, { transform: [{ scale }] }]}>
        <Ionicons name={icon.active} size={26} color="#fff" />
      </Animated.View>
      <Text style={[styles.label, styles.middleLabel]}>{label}</Text>
    </Pressable>
  );
}

// Bottom bar custom (bukan default @react-navigation/bottom-tabs) — background
// digambar sebagai SVG path dengan lengkungan setengah lingkaran di tengah supaya
// tombol tab tengah bisa "mengambang" ke atas, dengan shadow di baki maupun tombolnya.
export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const middleIndex = Math.floor(state.routes.length / 2);
  const cx = width / 2;
  const totalHeight = BAR_HEIGHT + insets.bottom;

  const barPath = [
    `M0 0`,
    `L ${cx - NOTCH_RADIUS - CURVE_SPREAD} 0`,
    `C ${cx - NOTCH_RADIUS} 0 ${cx - NOTCH_RADIUS} ${NOTCH_RADIUS} ${cx} ${NOTCH_RADIUS}`,
    `C ${cx + NOTCH_RADIUS} ${NOTCH_RADIUS} ${cx + NOTCH_RADIUS} 0 ${cx + NOTCH_RADIUS + CURVE_SPREAD} 0`,
    `L ${width} 0`,
    `L ${width} ${totalHeight}`,
    `L 0 ${totalHeight}`,
    `Z`,
  ].join(' ');

  return (
    <View style={[styles.wrap, { height: totalHeight }]}>
      <Svg width={width} height={totalHeight} style={StyleSheet.absoluteFill}>
        <Path d={barPath} fill="#ffffff" />
      </Svg>

      <View style={[styles.row, { paddingBottom: insets.bottom }]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const icon = ICONS[route.name as keyof OwnerTabsParamList];
          const label = typeof options.title === 'string' ? options.title : route.name;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          if (index === middleIndex) {
            return <MiddleTabButton key={route.key} icon={icon} label={label} onPress={onPress} />;
          }

          return <TabButton key={route.key} focused={focused} icon={icon} label={label} onPress={onPress} />;
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#fff',
    // Shadow di baki — halus, cuma menegaskan bar mengambang di atas konten (iOS).
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    // Android.
    elevation: 12,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    gap: 3,
  },
  middleSlot: {
    flex: 1,
    alignItems: 'center',
  },
  middleButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: '#e63946',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -(BUTTON_SIZE - NOTCH_RADIUS - 6),
    borderWidth: 4,
    borderColor: '#fff',
    // Shadow di tombol tengah sendiri — bikin efek "mengambang" lebih terasa.
    shadowColor: '#e63946',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 10,
  },
  label: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '600',
  },
  labelActive: {
    color: '#e63946',
  },
  middleLabel: {
    marginTop: 4,
    color: '#e63946',
  },
});
