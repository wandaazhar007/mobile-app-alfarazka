import type { ExpoConfig } from 'expo/config';

// Dynamic config (bukan app.json statis) supaya nanti bisa baca env var EAS
// per-profile (dev/preview/production) dan gampang ditambah plugin (expo-location
// dkk) di Fase D tanpa harus pindah dari JSON ke sini di tengah jalan.
const config: ExpoConfig = {
  name: 'Alfarazka Bakery',
  slug: 'alfarazka-bakery-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.alfarazkabakery.mobile',
    // Teks izin lokasi WAJIB jujur & spesifik (Apple Guideline 2.5.4 sering menolak
    // background location yang cuma "supaya kantor bisa lihat Anda" tanpa manfaat
    // balik ke pemilik HP) — jelaskan juga manfaatnya buat penjual sendiri.
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'Alfarazka Bakery melacak lokasi Anda selama berjualan keliling supaya posisi Anda tercatat di peta kantor — membantu koordinasi kalau ada pelanggan terdekat atau Anda butuh bantuan di jalan.',
      NSLocationAlwaysAndWhenInUseUsageDescription:
        'Alfarazka Bakery tetap melacak lokasi Anda walau aplikasi ditutup, selama Anda sedang berjualan keliling — supaya posisi Anda tetap tercatat di peta kantor untuk koordinasi & keamanan, bahkan saat layar HP terkunci.',
      UIBackgroundModes: ['location'],
    },
  },
  android: {
    package: 'com.alfarazkabakery.mobile',
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    // Peta Owner (react-native-maps) di Android render lewat Google Maps SDK — WAJIB
    // API key ini (iOS pakai Apple Maps bawaan, tidak perlu key sama sekali). Nilainya
    // dari GOOGLE_MAPS_ANDROID_API_KEY di .env (BUKAN EXPO_PUBLIC_ — key ini cuma
    // dibaca di sini, saat build/config time, tidak perlu ikut ke JS bundle client).
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY,
      },
    },
    permissions: [
      'ACCESS_COARSE_LOCATION',
      'ACCESS_FINE_LOCATION',
      'ACCESS_BACKGROUND_LOCATION',
      'FOREGROUND_SERVICE',
      'FOREGROUND_SERVICE_LOCATION',
    ],
  },
  web: {
    favicon: './assets/favicon.png',
  },
  // expo-status-bar di SDK 54 tidak (belum) punya config plugin (beda dari SDK
  // 56/57 yang sempat dicoba) — jangan didaftarkan di sini, cukup di-import langsung
  // di App.tsx seperti biasa.
  //
  // expo-splash-screen: splash NATIVE statis (logo di atas background putih) yang
  // tampil PALING PERTAMA sebelum JS sempat jalan sama sekali — begitu App.tsx mount,
  // AnimatedSplashScreen (src/screens/AnimatedSplashScreen.tsx) langsung ambil alih
  // dengan animasi fade+scale, jadi transisinya mulus tanpa kedip.
  plugins: [
    // expo-font: config plugin kosong (cuma butuh terdaftar di sini) — dibutuhkan
    // karena SEBELUM ini `expo-font` tidak pernah dideklarasikan langsung di
    // package.json (cuma dependency transitif @expo/vector-icons), jadi npm
    // otomatis meng-install versi TERBARU dari registry buat penuhi peer
    // dependency-nya — versi itu (57.x, buat SDK lebih baru) tidak kompatibel
    // dengan expo-modules-core SDK 54 kita dan bikin app crash instan di Android
    // asli (NoSuchMethodError getDirectConverter, FontLoaderModule) walau lolos
    // di emulator. Fix: expo-font didaftarkan eksplisit (lihat dependencies).
    'expo-font',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 180,
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
      },
    ],
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          'Alfarazka Bakery tetap melacak lokasi Anda walau aplikasi ditutup, selama Anda sedang berjualan keliling — supaya posisi Anda tetap tercatat di peta kantor untuk koordinasi & keamanan.',
        locationWhenInUsePermission:
          'Alfarazka Bakery melacak lokasi Anda selama berjualan keliling supaya posisi Anda tercatat di peta kantor.',
        isAndroidBackgroundLocationEnabled: true,
        isAndroidForegroundServiceEnabled: true,
      },
    ],
    [
      'expo-notifications',
      {
        color: '#e63946',
      },
    ],
  ],
  // Link ke project EAS (dibuat via `eas init`) — WAJIB supaya `eas build` tahu
  // project mana yang dibangun/di-manage kredensialnya di server Expo.
  extra: {
    eas: {
      projectId: '3d775ac6-6948-42ed-9a2e-762a553a5298',
    },
  },
};

export default config;
