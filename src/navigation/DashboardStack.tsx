import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OwnerDashboardScreen from '../screens/owner/OwnerDashboardScreen';
import StokPagiScreen from '../screens/owner/StokPagiScreen';
import PengeluaranScreen from '../screens/owner/PengeluaranScreen';
import PiutangScreen from '../screens/owner/PiutangScreen';

export type DashboardStackParamList = {
  DashboardHome: undefined;
  StokPagi: undefined;
  Pengeluaran: undefined;
  Piutang: undefined;
};

const Stack = createNativeStackNavigator<DashboardStackParamList>();

// Stack utk tab "Dashboard" — sama pola dengan LokasiPenjualStack: home pakai
// AppNavbar custom (headerShown: false), 3 layar detail (dulu belum ada layar
// khusus, cuma ringkasan di Dashboard) pakai native header (tombol back bawaan).
export default function DashboardStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="DashboardHome" component={OwnerDashboardScreen} options={{ headerShown: false }} />
      <Stack.Screen name="StokPagi" component={StokPagiScreen} options={{ title: 'Stok Pagi' }} />
      <Stack.Screen name="Pengeluaran" component={PengeluaranScreen} options={{ title: 'Pengeluaran' }} />
      <Stack.Screen name="Piutang" component={PiutangScreen} options={{ title: 'Piutang' }} />
    </Stack.Navigator>
  );
}
