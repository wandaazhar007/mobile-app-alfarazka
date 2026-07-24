import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { AuthProvider } from './src/contexts/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { setupNotificationNavigation } from './src/notifications/notificationNavigation';
// Side-effect import (TaskManager.defineTask jalan di module scope file itu) — WAJIB
// di-import di sini supaya OS bisa relaunch app secara headless (app sudah di-kill
// total) dan tetap tahu apa yang harus dilakukan begitu ada update lokasi baru.
import './src/location/backgroundLocationTask';

// Module scope (bukan di dalam komponen) — harus dipanggil SEBELUM App() sempat
// render sama sekali, supaya splash native tidak auto-hide duluan sebelum
// AnimatedSplashScreen (dipanggil dari RootNavigator) sempat ambil alih.
SplashScreen.preventAutoHideAsync().catch(() => {});

// Default expo-notifications: notifikasi yang datang SAAT app terbuka (foreground)
// tidak ditampilkan sama sekali kecuali handler ini didaftarkan — Owner harus tetap
// lihat notifikasi walau appnya sedang aktif dipakai.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

setupNotificationNavigation();

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
