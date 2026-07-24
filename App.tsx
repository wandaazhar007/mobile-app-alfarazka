import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from './src/contexts/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
// Side-effect import (TaskManager.defineTask jalan di module scope file itu) — WAJIB
// di-import di sini supaya OS bisa relaunch app secara headless (app sudah di-kill
// total) dan tetap tahu apa yang harus dilakukan begitu ada update lokasi baru.
import './src/location/backgroundLocationTask';

// Module scope (bukan di dalam komponen) — harus dipanggil SEBELUM App() sempat
// render sama sekali, supaya splash native tidak auto-hide duluan sebelum
// AnimatedSplashScreen (dipanggil dari RootNavigator) sempat ambil alih.
SplashScreen.preventAutoHideAsync().catch(() => {});

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
