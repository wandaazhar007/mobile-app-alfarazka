import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, ActivityIndicator } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

interface Props {
  // Selesai loading auth (AuthContext) — begitu true DAN animasi masuk sudah selesai,
  // splash mulai fade-out. Kalau auth masih loading setelah animasi masuk kelar,
  // splash tetap tampil (kasih spinner kecil) sampai auth beneran siap — supaya
  // durasi splash tidak pernah lebih pendek dari animasinya sendiri, dan tidak
  // pernah cut lompat ke Login/Dashboard sebelum auth resolve.
  ready: boolean;
  onFinish: () => void;
}

// Splash custom yang animasinya benar-benar terlihat user (bukan cuma native splash
// statis bawaan) — logo masuk dengan fade+scale (sedikit "bounce" lewat spring),
// baru fade-out seluruh layar begitu auth context sudah siap.
export default function AnimatedSplashScreen({ ready, onFinish }: Props) {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const [entranceDone, setEntranceDone] = useState(false);

  useEffect(() => {
    // Native splash (statis, dari app.config.ts) sudah tampil sejak sebelum JS jalan
    // sama sekali — begitu komponen JS ini mount & siap gambar frame pertamanya,
    // langsung ambil alih supaya tidak ada jeda blank putih di antara keduanya.
    SplashScreen.hideAsync().catch(() => {});

    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 5,
          tension: 60,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start(() => setEntranceDone(true));
  }, [logoOpacity, logoScale, titleOpacity]);

  useEffect(() => {
    if (!entranceDone || !ready) return;

    // Jeda sebentar supaya logo tidak langsung "kabur" begitu animasi masuk kelar —
    // beri waktu mata melihatnya sejenak sebelum fade-out.
    const holdTimer = setTimeout(() => {
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 350,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onFinish();
      });
    }, 400);

    return () => clearTimeout(holdTimer);
  }, [entranceDone, ready, containerOpacity, onFinish]);

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      <Animated.Image
        source={require('../../assets/logo.png')}
        style={[styles.logo, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}
        resizeMode="contain"
      />
      <Animated.Text style={[styles.title, { opacity: titleOpacity }]}>Alfarazka Bakery</Animated.Text>
      {entranceDone && !ready && <ActivityIndicator style={styles.spinner} color="#e63946" />}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  logo: {
    width: 140,
    height: 140,
  },
  title: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '700',
    color: '#e63946',
  },
  spinner: {
    marginTop: 24,
  },
});
