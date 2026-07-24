import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import OwnerDashboardScreen from '../screens/owner/OwnerDashboardScreen';
import LaporanScreen from '../screens/owner/LaporanScreen';
import GajiPenjualScreen from '../screens/owner/GajiPenjualScreen';
import UtangPenjualScreen from '../screens/owner/UtangPenjualScreen';
import LokasiPenjualStack from './LokasiPenjualStack';
import CustomTabBar from './CustomTabBar';

export type OwnerTabsParamList = {
  Dashboard: undefined;
  Laporan: undefined;
  GajiPenjual: undefined;
  UtangPenjual: undefined;
  LokasiPenjual: undefined;
};

const Tab = createBottomTabNavigator<OwnerTabsParamList>();

// Dipakai role owner MAUPUN admin (sama-sama read-only lihat laporan+lokasi dari HP).
// Navbar custom (judul + logout) dirender masing-masing screen sendiri lewat
// <AppNavbar/> — bukan di sini, supaya konsisten sama pola SellerDashboardScreen.
// Bottom bar juga custom (<CustomTabBar/>, lihat file itu) — ikon+warna aktif
// sekarang di-handle di sana, bukan lewat screenOptions bawaan.
export default function OwnerTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <CustomTabBar {...props} />}>
      <Tab.Screen name="Dashboard" component={OwnerDashboardScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="Laporan" component={LaporanScreen} options={{ title: 'Laporan' }} />
      <Tab.Screen name="GajiPenjual" component={GajiPenjualScreen} options={{ title: 'Gaji Penjual' }} />
      <Tab.Screen name="UtangPenjual" component={UtangPenjualScreen} options={{ title: 'Utang Penjual' }} />
      <Tab.Screen name="LokasiPenjual" component={LokasiPenjualStack} options={{ title: 'Lokasi Penjual' }} />
    </Tab.Navigator>
  );
}
