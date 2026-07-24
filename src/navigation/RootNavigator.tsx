import { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import LoginScreen from '../screens/auth/LoginScreen';
import AnimatedSplashScreen from '../screens/AnimatedSplashScreen';
import SellerStack from './SellerStack';
import OwnerTabs from './OwnerTabs';

// Pola sama seperti ProtectedRoute/App.tsx di frontend web: selama AuthContext masih
// resolving (belum tahu firebaseUser/appUser), tampilkan loading — jangan flash ke
// LoginScreen dulu baru lompat ke dashboard begitu tahu user sudah login. Bedanya
// dari web: loading-nya sekarang splash beranimasi (bukan spinner polos) — lihat
// AnimatedSplashScreen untuk kenapa `ready`/`onFinish` dipisah dari `loading`.
export default function RootNavigator() {
  const { firebaseUser, appUser, loading } = useAuth();
  const [splashDone, setSplashDone] = useState(false);

  if (!splashDone) {
    return <AnimatedSplashScreen ready={!loading} onFinish={() => setSplashDone(true)} />;
  }

  // LoginScreen dirender TANPA NavigationContainer — belum ada apa-apa untuk
  // dinavigasi selagi belum login, dan NavigationContainer expect tepat 1
  // Navigator (Stack.Navigator) sebagai child, bukan sembarang komponen.
  if (!firebaseUser || !appUser) {
    return <LoginScreen />;
  }

  return <NavigationContainer>{appUser.role === 'seller' ? <SellerStack /> : <OwnerTabs />}</NavigationContainer>;
}
